package com.example.communityforum.persistence.repository;

import com.example.communityforum.persistence.entity.User;
import com.example.communityforum.persistence.repository.projection.ProfileCountsProjection;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository  extends JpaRepository<User, Long>
{
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    
    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByUsernameIgnoreCase(String username);

    // Get counts for profile statistics
    @Query(value = """
        SELECT
          (SELECT COUNT(*) FROM follows f WHERE f.follower_id = :userId)  AS followingCount,
          (SELECT COUNT(*) FROM follows f WHERE f.following_id = :userId) AS followerCount,
          (SELECT COUNT(*) FROM posts   p WHERE p.user_id = :userId AND p.deleted_at IS NULL) AS postCount,
          (SELECT COUNT(*)
             FROM likes l
             JOIN posts p ON p.id = l.post_id
            WHERE p.user_id = :userId) AS postLikeCount
        """, nativeQuery = true)
    ProfileCountsProjection getProfileCounts(@Param("userId") Long userId);
}