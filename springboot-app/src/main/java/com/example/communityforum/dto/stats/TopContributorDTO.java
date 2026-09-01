package com.example.communityforum.dto.stats;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TopContributorDTO {
    private Long id;
    private String username;
    private String fullname;
    private String avatarPath;
    private long postCount;
}
