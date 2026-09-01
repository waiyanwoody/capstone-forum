package com.example.communityforum.dto.user;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor
public class ProfileStatsDTO {
    private long followingCount;
    private long followerCount;
    private long postCount;
    private long postLikeCount; // total likes on user's posts
}