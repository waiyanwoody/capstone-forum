package com.example.communityforum.service;

import com.example.communityforum.dto.file.FileUploadResponseDTO;
import com.example.communityforum.dto.post.PostSummaryDTO;
import com.example.communityforum.dto.user.ProfileRequest;
import com.example.communityforum.dto.user.ProfileResponseDTO;
import com.example.communityforum.dto.user.ProfileStatsDTO;
import com.example.communityforum.exception.FileValidationException;
import com.example.communityforum.exception.ResourceNotFoundException;
import com.example.communityforum.persistence.entity.User;
import com.example.communityforum.persistence.repository.FollowRepository;
import com.example.communityforum.persistence.repository.LikeRepository;
import com.example.communityforum.persistence.repository.PostRepository;
import com.example.communityforum.persistence.repository.UserRepository;
import com.example.communityforum.security.SecurityUtils;
import jakarta.transaction.Transactional;
import lombok.NoArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProfileService {
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final FileStorageService fileStorageService;
    private final LikeRepository likeRepository;
    private final FollowRepository  followRepository;
    private final SecurityUtils securityUtils;

    @Value("${profile.avatar.max-size-bytes:2097152}") // 2 MB default
    private long maxAvatarSize;
    private static final List<String> ALLOWED_TYPES = List.of("image/jpeg", "image/png", "image/jpg", "image/JPG" , "image/gif");

    public ProfileService(UserRepository userRepository, PostRepository postRepository,
                          FileStorageService fileStorageService, LikeRepository likeRepository,
                          FollowRepository followRepository,
                          SecurityUtils securityUtils) {
        this.userRepository = userRepository;
        this.postRepository = postRepository;
        this.fileStorageService = fileStorageService;
        this.likeRepository  = likeRepository;
        this.followRepository = followRepository;
        this.securityUtils = securityUtils;
    }

    // Get current user's profile
    public ProfileResponseDTO getCurrentUserProfile(User currentUser) {
        return toProfileDTO(currentUser);
    }

    // Get profile by user ID
    public ProfileResponseDTO getUserProfileById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        return toProfileDTO(user);
    }

    public ProfileResponseDTO getUserProfileByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", username));
        return toProfileDTO(user);
    }

    private ProfileResponseDTO toProfileDTO(User user) {
        User currentUser = securityUtils.getCurrentUser();
        boolean followed = followRepository.existsByFollowerAndFollowing(currentUser, user);
        boolean followsBack = followRepository.existsByFollowerAndFollowing(user, currentUser);
        boolean isFriend = followed && followsBack;
        return ProfileResponseDTO.builder()
                .id(user.getId())
                .fullname(user.getFullname())
                .username(user.getUsername())
                .email(user.getEmail())
                .bio(user.getBio())
                .avatar_path(user.getAvatarPath())
                .bio(user.getBio())
                .createdAt(user.getCreatedAt())
                .followed(followed)
                .isFriend(isFriend)
                .build();
    }

    // Get profile statistics
    public ProfileStatsDTO getProfileStats(long userId) {
        var p = userRepository.getProfileCounts(userId);
        return new ProfileStatsDTO(
                p.getFollowingCount(),
                p.getFollowerCount(),
                p.getPostCount(),
                p.getPostLikeCount());
    }

    private String generateExcerpt(String content) {
        if (content == null)
            return "";
        return content.length() > 120 ? content.substring(0, 120) + "..." : content;
    }

    // JSON-only update
    public ProfileResponseDTO updateProfile(Long userId, ProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        if (request.getFullname() != null)
            user.setFullname(request.getFullname());
        if (request.getUsername() != null) {
            boolean usernameExists = userRepository.existsByUsername(request.getUsername());
            if (usernameExists && !user.getUsername().equals(request.getUsername())) {
                throw new FileValidationException("Username already exists");
            }
            user.setUsername(request.getUsername());
        }
        if (request.getBio() != null)
            user.setBio(request.getBio());
        User updated = userRepository.save(user);
        return mapToProfileResponseDTO(updated);
    }

    // Multipart update: update profile + optional avatar in one call
    @Transactional
    public ProfileResponseDTO updateProfile(Long userId, ProfileRequest request, @Nullable MultipartFile avatar) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        if (request.getFullname() != null)
            user.setFullname(request.getFullname());
        if (request.getUsername() != null) {
            boolean usernameExists = userRepository.existsByUsername(request.getUsername());
            if (usernameExists && !user.getUsername().equals(request.getUsername())) {
                throw new FileValidationException("Username already exists");
            }
            user.setUsername(request.getUsername());
        }
        if (request.getBio() != null)
            user.setBio(request.getBio());
        if (avatar != null && !avatar.isEmpty()) {
            FileUploadResponseDTO uploaded = uploadAvatarInternal(user, avatar);
            // user.setAvatarPath already set inside uploadAvatarInternal
        }
        User updated = userRepository.save(user);
        return mapToProfileResponseDTO(updated);
    }

    // Public API used by controller /api/profile/avatar
    @Transactional
    public FileUploadResponseDTO uploadAvatar(Long targetUserId, MultipartFile avatar) {
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", targetUserId));
        return uploadAvatarInternal(user, avatar);
    }

    // Core implementation
    private FileUploadResponseDTO uploadAvatarInternal(User user, MultipartFile avatar) {
        validateImage(avatar, maxAvatarSize, ALLOWED_TYPES);

        // delete existing avatar if present
        if (user.getAvatarPath() != null && !user.getAvatarPath().isBlank()) {
            fileStorageService.deleteFile(user.getAvatarPath());
        }

        // upload new file and persist relative path
        String folder = "avatars";
        String relativePath = fileStorageService.upload(avatar, folder);
        String safeFileName = extractFileName(relativePath);
        String downloadUrl = fileStorageService.buildFileUrl(relativePath);

        user.setAvatarPath(relativePath);
        userRepository.save(user);

        return new FileUploadResponseDTO(safeFileName, relativePath, downloadUrl);
    }

    private void validateImage(MultipartFile file, long maxSize, List<String> allowedTypes) {
        if (file == null || file.isEmpty()) {
            throw new FileValidationException("No file uploaded or file is empty");
        }

        if (file.getSize() > maxSize) {
            throw new FileValidationException(
                    "File size exceeds limit (" + (maxSize / 1024 / 1024) + " MB max)");
        }

        String contentType = file.getContentType();
        if (contentType == null || !allowedTypes.contains(contentType.toLowerCase())) {
            throw new FileValidationException(
                    "Invalid file type. Allowed types: " + String.join(", ", allowedTypes));
        }
    }

    private String extractFileName(String path) {
        if (path == null)
            return null;
        int idx = path.lastIndexOf('/');
        return idx >= 0 ? path.substring(idx + 1) : path;
    }

    // map to profile response dto
    public ProfileResponseDTO mapToProfileResponseDTO(User user) {
        // response without posts
        return new ProfileResponseDTO(user.getId(),user.getFullname(), user.getUsername(), user.getEmail(), user.isEmailVerified(), user.getBio(),
                user.getAvatarPath(), user.getCreatedAt());
    }

    // update user avatar
    public void updateAvatar(Long userId, String avatarUrl) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        user.setAvatarPath(avatarUrl);
        userRepository.save(user);
    }

}
