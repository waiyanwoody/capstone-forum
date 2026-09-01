package com.example.communityforum.service;

import com.example.communityforum.events.NewFollowerEvent;
import com.example.communityforum.exception.HttpStatusException;
import com.example.communityforum.exception.ResourceNotFoundException;
import com.example.communityforum.persistence.entity.Follow;
import com.example.communityforum.persistence.entity.User;
import com.example.communityforum.persistence.repository.FollowRepository;
import com.example.communityforum.persistence.repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class FollowService {

    private final FollowRepository followRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher publisher;

    @Transactional
    public void followUser(Long followerId, Long followingId) {
        if (followerId.equals(followingId)) throw HttpStatusException.of("You cannot follow yourself.", HttpStatus.BAD_REQUEST);
        User follower = userRepository.findById(followerId).orElseThrow(() -> new ResourceNotFoundException("Follower",followerId));
        User following = userRepository.findById(followingId).orElseThrow(() -> new ResourceNotFoundException("User to follow",followingId));
        if (followRepository.existsByFollowerAndFollowing(follower, following)) throw HttpStatusException.of("Already following", HttpStatus.BAD_REQUEST);
        followRepository.save(Follow.builder().follower(follower).following(following).build());
        // publish NewFollower event
        publisher.publishEvent(NewFollowerEvent.builder()
                .followerId(followerId)
                .followingId(followingId)
                .build());
    }

    @Transactional
    public void unfollowUser(Long followerId, Long followingId) {
        User follower = userRepository.findById(followerId).orElseThrow(() -> new ResourceNotFoundException("Follower",followerId));
        User following = userRepository.findById(followingId).orElseThrow(() -> new ResourceNotFoundException("User to unfollow",followingId));
        followRepository.deleteByFollowerAndFollowing(follower, following);
    }

    @Transactional
    public Map<String, Object> toggleFollow(Long followerId, Long followingId) {
        if (followerId.equals(followingId))
            throw HttpStatusException.of("You cannot follow yourself.", HttpStatus.BAD_REQUEST);

        User follower = userRepository.findById(followerId)
                .orElseThrow(() -> new ResourceNotFoundException("Follower", followerId));
        User following = userRepository.findById(followingId)
                .orElseThrow(() -> new ResourceNotFoundException("User to follow", followingId));

        boolean followed;
        if (followRepository.existsByFollowerAndFollowing(follower, following)) {
            followRepository.deleteByFollowerAndFollowing(follower, following);
            followed = false;
        } else {
            followRepository.save(Follow.builder().follower(follower).following(following).build());
            followed = true;
            publisher.publishEvent(NewFollowerEvent.builder()
                    .followerId(followerId)
                    .followingId(followingId)
                    .build());
        }

        boolean isFriend = followRepository.existsByFollowerAndFollowing(follower, following) &&
                followRepository.existsByFollowerAndFollowing(following, follower);

        return Map.of(
                "followingId", followingId,
                "followed", followed,
                "isFriend", isFriend
        );
    }


    public List<User> getFollowing(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("UserId",userId));

        return followRepository.findByFollower(user)
                .stream()
                .map(Follow::getFollowing)
                .toList();
    }

    public List<User> getFollowers(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("UserId",userId));

        return followRepository.findByFollowing(user)
                .stream()
                .map(Follow::getFollower)
                .toList();
    }
}
