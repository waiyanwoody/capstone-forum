package com.example.communityforum.dto.notification;

import com.example.communityforum.persistence.entity.Notification;
import com.example.communityforum.persistence.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponseDTO {
    private Long id;
    private String message;
    private String type;
    private String createdAt;
    private boolean read;

    // Actor (sender) info for follow modals / avatars
    private Long senderId;
    private String senderUsername;
    private String senderFullname;
    private String senderAvatar;

    // Where the notification points (post + optional comment)
    private Long postId;
    private String postSlug;
    private Long commentId;

    public static NotificationResponseDTO fromEntity(Notification n, User sender) {
        return NotificationResponseDTO.builder()
                .id(n.getId())
                .message(n.getMessage())
                .type(n.getType())
                .createdAt(n.getCreatedAt().toString())
                .read(n.isRead())
                .senderId(n.getSenderId())
                .senderUsername(sender != null ? sender.getUsername() : null)
                .senderFullname(sender != null ? sender.getFullname() : null)
                .senderAvatar(sender != null ? sender.getAvatarPath() : null)
                .postId(n.getPostId())
                .postSlug(n.getPostSlug())
                .commentId(n.getCommentId())
                .build();
    }
}