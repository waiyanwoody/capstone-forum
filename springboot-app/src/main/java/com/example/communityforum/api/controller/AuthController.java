package com.example.communityforum.api.controller;

import com.example.communityforum.dto.ApiResponse;
import com.example.communityforum.dto.auth.AuthRequest;
import com.example.communityforum.dto.auth.AuthResponse;
import com.example.communityforum.dto.auth.ForgotPasswordRequest;
import com.example.communityforum.dto.auth.ResetPasswordRequest;
import com.example.communityforum.dto.user.UserRequestDTO;
import com.example.communityforum.dto.user.UserResponseDTO;
import com.example.communityforum.dto.user.UsernameCheckResponse;
import com.example.communityforum.exception.DuplicateResourceException;
import com.example.communityforum.exception.HttpStatusException;
import com.example.communityforum.persistence.entity.User;
import com.example.communityforum.persistence.repository.UserRepository;
import com.example.communityforum.security.JwtUtil;
import com.example.communityforum.security.SecurityUtils;
import com.example.communityforum.service.VerificationService;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

import java.nio.charset.StandardCharsets;

import org.apache.catalina.security.SecurityUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriUtils;
import java.util.Map;

@Tag(name = "Authentication", description = "Endpoints authentication")
@RestController
@RequestMapping("/auth")
public class AuthController {

    @Value("${frontend.url}")
    private String frontendUrl;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private SecurityUtils securityUtils;

    @Autowired
    private VerificationService verificationService;

    @GetMapping("/me")
    public ResponseEntity<UserResponseDTO> getCurrentUser() {
        User currentUser = securityUtils.getCurrentUser(); // fetch logged-in user
        return ResponseEntity.ok(UserResponseDTO.fromEntity(currentUser));
    }

    // check if username is available
    @GetMapping("/check-username")
    public ResponseEntity<UsernameCheckResponse> checkUsername(@RequestParam String username) {
        String u = username == null ? "" : username.trim();
        // same rule as ProfileRequest: 3-20, letters/numbers/_/-
        if (u.isEmpty()) {
            return ResponseEntity.ok(new UsernameCheckResponse(false, false, "Username is required"));
        }
        if (u.length() < 3 || u.length() > 20) {
            return ResponseEntity.ok(new UsernameCheckResponse(false, false, "Must be 3-20 characters"));
        }
        if (!u.matches("^[a-zA-Z0-9_-]+$")) {
            return ResponseEntity.ok(new UsernameCheckResponse(false, false, "Only letters, numbers, hyphens, underscores"));
        }
        boolean exists = userRepository.existsByUsernameIgnoreCase(u);
        return ResponseEntity.ok(new UsernameCheckResponse(true, !exists, exists ? "Username is already taken" : "OK"));
    }

    // -- Register --
    @PostMapping("/register")
    public AuthResponse registerUser(@Valid @RequestBody UserRequestDTO request) {
        // Check if username already exists
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException("Username is already taken");
        }

        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email is already registered");
        }
        // create and save new user
        User user = new User();
        user.setUsername(request.getUsername());
        user.setFullname(request.getUsername()); // temporarily set username as fullname
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());
        user.setRole("USER");
        user.setEmailVerified(false);
        userRepository.save(user);

        UserResponseDTO userDTO = UserResponseDTO.fromEntity(user);

        // Send verification email
        verificationService.sendVerification(user);

        String token = jwtUtil.generateToken(user);

        return new AuthResponse(token, userDTO);
    }

    @GetMapping("/verify-email")
    public ResponseEntity<Void> verifyEmailRedirect(@RequestParam String token) {
        String redirectUrl;

        try {
            verificationService.verify(token);
            redirectUrl = frontendUrl + "/verified?status=ok";
        } catch (HttpStatusException e) {
            redirectUrl = frontendUrl + "/verified?status=fail&reason=" +
                    UriUtils.encode(e.getMessage(), StandardCharsets.UTF_8);
        } catch (Exception e) {
            redirectUrl = frontendUrl + "/verified?status=fail&reason=" +
                    UriUtils.encode("Something went wrong", StandardCharsets.UTF_8);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.add("Location", redirectUrl);
        return new ResponseEntity<>(headers, HttpStatus.FOUND); // 302 redirect
    }

    // -- Login --
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody AuthRequest request) {

        // Fetch user details from the database
        User user = userRepository.findByUsername(request.getUsername())
            .or(() -> userRepository.findByEmail(request.getUsername()))
            .orElseThrow(() -> new HttpStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    request.getUsername(),
                    request.getPassword()));
        } catch (Exception e) {
            throw new HttpStatusException(HttpStatus.UNAUTHORIZED, "Incorrect password!");
        }
        String token = jwtUtil.generateToken(user);

        UserResponseDTO userDTO = UserResponseDTO.fromEntity(user);

        return new AuthResponse(token, userDTO);
    }

    @GetMapping("/confirm-email-change")
    public ResponseEntity<Void> confirmEmailChange(@RequestParam String token) {
        String redirectUrl;
        try {
            verificationService.confirmEmailChange(token);
            redirectUrl = frontendUrl + "/verified?status=email-updated";
        } catch (HttpStatusException e) {
            redirectUrl = frontendUrl + "/verified?status=fail&reason=" +
                    UriUtils.encode(e.getMessage(), StandardCharsets.UTF_8);
        } catch (Exception e) {
            redirectUrl = frontendUrl + "/verified?status=fail&reason=" +
                    UriUtils.encode("Something went wrong", StandardCharsets.UTF_8);
        }
        HttpHeaders h = new HttpHeaders();
        h.add("Location", redirectUrl);
        return new ResponseEntity<>(h, HttpStatus.FOUND);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        verificationService.startPasswordReset(req.getIdentifier());

        ApiResponse<Void> response = new ApiResponse<>(
                "success",
                "Password reset initiated",
                null);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        verificationService.confirmPasswordReset(req.getIdentifier(), req.getOtp(), req.getNewPassword());

        ApiResponse<Void> response = new ApiResponse<>(
                "success",
                "Password reset successful",
                null);
        return ResponseEntity.ok(response);
    }

}
