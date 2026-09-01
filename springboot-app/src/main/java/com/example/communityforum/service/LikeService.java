package com.example.communityforum.service;

import com.example.communityforum.dto.LikeRequestDTO;
import com.example.communityforum.events.LikeToggledEvent;
import com.example.communityforum.exception.ResourceNotFoundException;
import com.example.communityforum.persistence.entity.*;
import com.example.communityforum.persistence.repository.*;
import com.example.communityforum.security.SecurityUtils;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LikeService {

    private final LikeRepository likeRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final SecurityUtils securityUtils;
    private final ApplicationEventPublisher publisher;


    public LikeService(LikeRepository likeRepository,
                       PostRepository postRepository,
                       CommentRepository commentRepository,
                       UserRepository userRepository,
                       SecurityUtils securityUtils,
                       ApplicationEventPublisher publisher
    ) {
        this.likeRepository = likeRepository;
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
        this.securityUtils = securityUtils;
        this.publisher = publisher;
    }

    // Toggle like on a post or comment
    @Transactional
    public boolean toggleLike(LikeRequestDTO request) {
        User currentUser = securityUtils.getCurrentUser();

        boolean nowLiked = false;
        Like like = null;
        Long ownerId;

        if (request.getTargetType() == LikeRequestDTO.TargetType.POST) {
            Post post = postRepository.findById(request.getTargetId())
                    .orElseThrow(() -> new ResourceNotFoundException("Post", request.getTargetId()));

            ownerId = post.getUser().getId();

            if (likeRepository.existsByUserAndPost(currentUser, post)) {
                likeRepository.deleteByUserAndPost(currentUser, post);
                nowLiked = false;
            } else {
                like = likeRepository.save(Like.builder().user(currentUser).post(post).build());
                nowLiked = true;
            }

        } else if (request.getTargetType() == LikeRequestDTO.TargetType.COMMENT) {
            Comment comment = commentRepository.findById(request.getTargetId())
                    .orElseThrow(() -> new ResourceNotFoundException("Comment", request.getTargetId()));

            ownerId = comment.getUser().getId();

            if (likeRepository.existsByUserAndComment(currentUser, comment)) {
                likeRepository.deleteByUserAndComment(currentUser, comment);
                nowLiked = false;
            } else {
                like = likeRepository.save(Like.builder().user(currentUser).comment(comment).build());
                nowLiked = true;
            }

        } else {
            throw new IllegalArgumentException("Unsupported targetType: " + request.getTargetType());
        }

        // publish once with complete context
        publisher.publishEvent(LikeToggledEvent.builder()
                .actorId(currentUser.getId())
                .ownerId(ownerId)
                .targetType(request.getTargetType())
                .targetId(request.getTargetId())
                .nowLiked(nowLiked)
                .likeId(like != null ? like.getId() : null)
                .build());

        return nowLiked;
    }

    public long getPostLikeCount(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post",postId));
        return likeRepository.countByPost(post);
    }

    public long getCommentLikeCount(Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment",commentId));
        return likeRepository.countByComment(comment);
    }
}
