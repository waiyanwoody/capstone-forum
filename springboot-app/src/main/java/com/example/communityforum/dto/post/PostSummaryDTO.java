package com.example.communityforum.dto.post;

import lombok.*;

import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PostSummaryDTO {
    private Long id;
    private String title;
    private String excerpt;
    private List<String> tags;
    private String slug;
    private String createdAt;
    private long likeCount;
    private long commentCount;
    private boolean pinned;
    private boolean solved;
}
