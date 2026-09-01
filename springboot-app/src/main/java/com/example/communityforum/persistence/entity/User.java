package com.example.communityforum.persistence.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "users", indexes = {
                @Index(name = "idx_user_avatar_path", columnList = "avatar_path")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @Column(nullable = true)
        private String fullname;

        @Column(unique = true, nullable = false)
        private String username;

        @Column(unique = true, nullable = false)
        private String email;

        @Column(nullable = false)
        private String password;

        @Column(nullable = false)
        private String role = "USER";

        @Column(columnDefinition = "TEXT")
        private String bio;

        @Column(name = "avatar_path", length = 512)
        private String avatarPath;

        @CreationTimestamp
        @Column(name = "created_at", nullable = false, updatable = false)
        private LocalDateTime createdAt;

        @Column(name = "email_verified", nullable = false)
        private boolean emailVerified = false;

        @Column(name = "email_verified_at")
        private LocalDateTime emailVerifiedAt;

        @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
        @JsonIgnore
        private List<Post> posts;

        @OneToMany(mappedBy = "follower", cascade = CascadeType.ALL, orphanRemoval = true)
        private Set<Follow> following = new HashSet<>();

        @OneToMany(mappedBy = "following", cascade = CascadeType.ALL, orphanRemoval = true)
        private Set<Follow> followers = new HashSet<>();
}