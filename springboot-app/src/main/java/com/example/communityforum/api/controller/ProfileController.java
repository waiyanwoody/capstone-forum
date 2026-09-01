package com.example.communityforum.api.controller;

import com.example.communityforum.dto.file.FileUploadResponseDTO;
import com.example.communityforum.dto.user.ProfileRequest;
import com.example.communityforum.dto.user.ProfileResponseDTO;
import com.example.communityforum.dto.user.ProfileStatsDTO;
import com.example.communityforum.dto.user.UsernameCheckResponse;
import com.example.communityforum.dto.ApiResponse;
import com.example.communityforum.exception.FileValidationException;
import com.example.communityforum.exception.PermissionDeniedException;
import com.example.communityforum.exception.ResourceNotFoundException;
import com.example.communityforum.persistence.entity.User;
import com.example.communityforum.persistence.repository.UserRepository;
import com.example.communityforum.security.SecurityUtils;
import com.example.communityforum.service.FileStorageService;
import com.example.communityforum.service.ProfileService;
import com.example.communityforum.service.UserService;
import com.example.communityforum.service.VerificationService;
import com.fasterxml.jackson.databind.ObjectMapper;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;


@Slf4j
@Tag(name = "Profiles", description = "Endpoints for managing forum user profiles")
@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {
    private final ProfileService profileService;
    private final SecurityUtils securityUtils;

    private final FileStorageService fileStorageService;
    private final ObjectMapper objectMapper;

    private final long MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2 MB, can also come from app.properties
    private final List<String> ALLOWED_TYPES = List.of("image/jpeg", "image/png", "image/jpg" , "image/gif");
    private final UserService userService;
    private final UserRepository userRepository;
    private final VerificationService verificationService;

    // Get current user profile
    @GetMapping("/me")
    public ResponseEntity<ProfileResponseDTO> getMyProfile() {
        User currentUser =  securityUtils.getCurrentUser();
        return ResponseEntity.ok(profileService.getCurrentUserProfile(currentUser));
    }

    // Get profile by username
    @GetMapping("/{username}")
    public ResponseEntity<ProfileResponseDTO> getUserProfileByUsername(@PathVariable String username) {
        // Let the service handle the logic and the error throwing
        return ResponseEntity.ok(profileService.getUserProfileByUsername(username));
    }

    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<FileUploadResponseDTO> uploadAvatar(
            @RequestParam("avatar") MultipartFile avatar,
            @RequestParam(value = "userId", required = false) Long userId) {
        if (avatar == null || avatar.isEmpty()) {
            throw new FileValidationException("File is empty");
        }
        User current = securityUtils.getCurrentUser();
        Long targetId = (userId != null && "ADMIN".equals(current.getRole())) ? userId : current.getId();
        log.debug("Uploading avatar for userId={}, originalName={}, size={}", targetId, avatar.getOriginalFilename(),
                avatar.getSize());
        var resp = profileService.uploadAvatar(targetId, avatar);
        return ResponseEntity.ok(resp);
    }

    @PutMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ProfileResponseDTO> updateProfile(@Valid @RequestBody ProfileRequest request) {
        User currentUser = securityUtils.getCurrentUser();
        return ResponseEntity.ok(profileService.updateProfile(currentUser.getId(), request));
    }

    // multipart combined update (no ProfileRequest in signature)
    @PutMapping(path = "/with-avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProfileResponseDTO> updateProfileWithAvatar(
            @ModelAttribute ProfileRequest request, // form fields
            @RequestPart(value = "avatar", required = false) MultipartFile avatar) { // optional file
        User currentUser = securityUtils.getCurrentUser();

        return ResponseEntity.ok(profileService.updateProfile(currentUser.getId(), request, avatar));
    }
    
    // Get profile statistics
    @GetMapping("/{id}/stats")
    public ResponseEntity<ProfileStatsDTO> getUserStats(@PathVariable long id) {
        return ResponseEntity.ok(profileService.getProfileStats(id));
    }

    // change new email
    @PostMapping("/change-email")
    public ResponseEntity<Void> requestEmailChange(@RequestParam String newEmail) {
        User current = securityUtils.getCurrentUser();
        verificationService.startEmailChange(current, newEmail, true); // set false to keep access
        return ResponseEntity.accepted().build();
    }
}
