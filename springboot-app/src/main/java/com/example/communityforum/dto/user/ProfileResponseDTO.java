package com.example.communityforum.dto.user;

import com.example.communityforum.dto.post.PostSummaryDTO;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProfileResponseDTO {
    private Long id;
    private String fullname;
    private String username;

    public ProfileResponseDTO(Long id, String fullname, String username, String email, boolean email_verified, String bio, String avatar_path, LocalDateTime createdAt) {
        this.id = id;
        this.fullname = fullname;
        this.username = username;
        this.email = email;
        this.email_verified = email_verified;
        this.bio = bio;
        this.avatar_path = avatar_path;
        this.createdAt = createdAt;
    }

    private String email;
    private boolean email_verified;
    private String bio;
    private String avatar_path;            // public URL to serve avatar
    private LocalDateTime createdAt;
    private Boolean followed; // current user follows this user
    private Boolean isFriend; // mutual follow
}
