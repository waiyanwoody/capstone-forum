package com.example.communityforum.dto.post;

import com.example.communityforum.dto.user.UserResponseDTO;
import com.example.communityforum.persistence.entity.Tag;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostDetailResponseDTO {

    private Long id;
    private String title;
    private String content;
    private List<String> tags;
    private String slug;
    private String type;
    private LocalDateTime createdAt = LocalDateTime.now();

    private UserResponseDTO author;

    private long likeCount;
    private boolean liked;
    @JsonProperty("isSaved")
    private boolean isSaved;
    @JsonProperty("isPinned")
    private boolean isPinned;
    @JsonProperty("isSolved")
    private boolean isSolved;
    private long viewCount;
    private Long bestCommentId;

}
