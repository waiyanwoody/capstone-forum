package com.example.communityforum.api.controller;

import com.example.communityforum.dto.user.UserResponseDTO;
import com.example.communityforum.persistence.entity.User;
import com.example.communityforum.security.SecurityUtils;
import com.example.communityforum.service.FollowService;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "Follows", description = "Endpoints for managing user follows")
@RestController
@RequestMapping("/api/follows")
@RequiredArgsConstructor
public class FollowController {

    private final FollowService followService;
    private final SecurityUtils securityUtils;

    @PostMapping("/{followingId}")
    public ResponseEntity<String> followUser(@PathVariable Long followingId) {
        User currentUser = securityUtils.getCurrentUser();
        followService.followUser(currentUser.getId(), followingId);
        return ResponseEntity.ok("Followed successfully");
    }

    @DeleteMapping("/{followingId}")
    public ResponseEntity<String> unfollowUser(@PathVariable Long followingId) {
        User currentUser = securityUtils.getCurrentUser();
        followService.unfollowUser(currentUser.getId(), followingId);
        return ResponseEntity.ok("Unfollowed successfully");
    }

    // toggle follow
    @PostMapping("/{followingId}/toggle")
    public ResponseEntity<Map<String, Object>> toggleFollow(@PathVariable Long followingId) {
        User currentUser = securityUtils.getCurrentUser();

        Map<String, Object> result = followService.toggleFollow(currentUser.getId(), followingId);

        // result contains both followed and isFriend
        return ResponseEntity.ok(result);
    }

    @GetMapping("/followers/{userId}")
    public ResponseEntity<List<UserResponseDTO>> getFollowers(@PathVariable Long userId) {
        User currentUser = securityUtils.getCurrentUser();
        if (!securityUtils.isAdmin() && !currentUser.getId().equals(userId)) {
            userId = currentUser.getId();
        }
        return ResponseEntity.ok(
                followService.getFollowers(userId)
                        .stream()
                        .map(UserResponseDTO::fromEntity)
                        .toList());
    }

    @GetMapping("/following/{userId}")
    public ResponseEntity<List<UserResponseDTO>> getFollowing(@PathVariable Long userId) {
        User currentUser = securityUtils.getCurrentUser();
        if (!securityUtils.isAdmin() && !currentUser.getId().equals(userId)) {
            userId = currentUser.getId();
        }
        return ResponseEntity.ok(
                followService.getFollowing(userId)
                        .stream()
                        .map(UserResponseDTO::fromEntity)
                        .toList());
    }
}
