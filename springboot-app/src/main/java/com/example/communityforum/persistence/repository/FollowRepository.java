package com.example.communityforum.persistence.repository;

import com.example.communityforum.persistence.entity.Follow;
import com.example.communityforum.persistence.entity.User;

import jakarta.transaction.Transactional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FollowRepository extends JpaRepository<Follow, Long> {

    boolean existsByFollowerAndFollowing(User follower, User following);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    void deleteByFollowerAndFollowing(User follower, User following);

    List<Follow> findByFollower(User follower);
    List<Follow> findByFollowing(User following);

}
