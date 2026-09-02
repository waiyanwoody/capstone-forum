package com.example.communityforum.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ID of the user who will receive the notification
    @Column(nullable = false)
    private Long receiverId;

    // ID of the user who triggered the notification (e.g. commenter)
    @Column(nullable = false)
    private Long senderId;

    // Type of notification (e.g., COMMENT, LIKE, FOLLOW)
    // MySQL "type" is a reserved word -> backticks quote the column name
    @Column(name = "`type`", nullable = false)
    private String type;

    // Message content shown to receiver
    @Column(nullable = false, length = 255)
    private String message;

    // Target post/comment the notification refers to (nullable for pure system/follow notices)
    private Long postId;
    private String postSlug;
    private Long commentId;

    // Whether the receiver has read the notification
    // MySQL "read" is a reserved word -> backticks quote the column name
    @Column(name = "`read`", nullable = false)
    private boolean read;

    // Automatically set when the notification is created
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
