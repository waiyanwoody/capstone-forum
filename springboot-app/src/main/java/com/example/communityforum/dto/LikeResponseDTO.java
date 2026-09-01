package com.example.communityforum.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LikeResponseDTO {
    private boolean liked;
    private long likeCount;
    private Long targetId;
    private String targetType;
}
