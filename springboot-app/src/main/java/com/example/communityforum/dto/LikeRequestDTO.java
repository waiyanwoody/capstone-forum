package com.example.communityforum.dto;

import jakarta.validation.constraints.NotNull;

public class LikeRequestDTO {

    @NotNull(message = "Post or Comment ID is required")
    private Long targetId;

    @NotNull(message = "type is required POST  or COMMENT")
    private TargetType targetType;

    public Long getTargetId() {
        return targetId;
    }

    public void setTargetId(Long targetId) {
        this.targetId = targetId;
    }

    public TargetType getTargetType() {
        return targetType;
    }

    public void setTargetType(TargetType targetType) {
        this.targetType = targetType;
    }

    public enum TargetType {
        POST,
        COMMENT
    }


}
