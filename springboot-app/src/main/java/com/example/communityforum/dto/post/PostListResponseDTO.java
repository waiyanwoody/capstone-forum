package com.example.communityforum.dto.post;

import com.example.communityforum.persistence.entity.Post;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import com.example.communityforum.dto.user.AuthorDTO;
import com.example.communityforum.persistence.entity.Tag;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostListResponseDTO {

    private Long id;
    private String title;
    private String excerpt;
    private List<String> tags;
    private String slug;
    private String type;

    private AuthorDTO author;

    private LocalDateTime createdAt = LocalDateTime.now();

    private long likeCount;
    private boolean liked;
    private long commentCount;
    @JsonProperty("isSaved")
    private boolean isSaved;
    @JsonProperty("isPinned")
    private boolean isPinned;
    @JsonProperty("isSolved")
    private boolean isSolved;

}
