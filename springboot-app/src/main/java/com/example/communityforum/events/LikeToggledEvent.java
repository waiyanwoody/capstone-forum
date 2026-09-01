package com.example.communityforum.events;

import com.example.communityforum.dto.LikeRequestDTO;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class LikeToggledEvent {
    Long actorId;                      // who toggled
    Long ownerId;                      // owner of post/comment
    LikeRequestDTO.TargetType targetType;
    Long targetId;                     // postId or commentId
    boolean nowLiked;                  // true if like created, false if removed
    Long likeId; // null when unliked
    
public boolean getNowLiked() {
        return nowLiked;
    }
}