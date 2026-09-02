package com.example.communityforum.events;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentCreatedEvent {
    private Long receiverId;
    private Long senderId;
    private String postTitle;
    private Long postId;
    private String postSlug;
    private Long commentId;
}