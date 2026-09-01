package com.example.communityforum.persistence.repository.projection;

public interface ProfileCountsProjection {
    long getFollowingCount();
    long getFollowerCount();
    long getPostCount();
    long getPostLikeCount();
}