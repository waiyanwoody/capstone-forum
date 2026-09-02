package com.example.communityforum.dto.comment;

import com.example.communityforum.persistence.entity.Comment;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
public class CommentResponseDTO {
    private Long id;
    private String content;
    private String authorUsername;
    private String authorFullname;
    private String authorAvatar;
    private long postId;
    private String postSlug;
    private LocalDateTime createdAt;

    private long likeCount;
    private boolean liked;
    private boolean best;

    @Builder.Default
    private List<CommentResponseDTO> replies = new ArrayList<>();
}
