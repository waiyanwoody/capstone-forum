package com.example.communityforum.dto.comment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CommentRequestDTO {

    @NotNull(message = "Post ID is required")
    private Long postId;

    @NotBlank(message = "content cannot be blank")
    private String content;

    // Optional parent comment (for replies)
    private Long parentCommentId;
}
