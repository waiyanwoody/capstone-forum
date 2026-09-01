package com.example.communityforum.events;

import com.example.communityforum.persistence.entity.Comment;
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

}
