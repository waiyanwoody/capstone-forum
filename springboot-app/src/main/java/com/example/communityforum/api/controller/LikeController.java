package com.example.communityforum.api.controller;

import com.example.communityforum.dto.LikeRequestDTO;
import com.example.communityforum.dto.LikeResponseDTO;
import com.example.communityforum.dto.user.UserResponseDTO;
import com.example.communityforum.events.CommentCreatedEvent;
import com.example.communityforum.events.LikeToggledEvent;
import com.example.communityforum.service.CommentService;
import com.example.communityforum.service.LikeService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Likes", description = "Endpoints for managing forum likes")
@RestController
@RequestMapping("/api/likes")
public class LikeController {

    private final LikeService likeService;
    private final CommentService commentService;

    public  LikeController(LikeService likeService, CommentService commentService) {
        this.likeService = likeService;
        this.commentService = commentService;
    }

    @PostMapping("/toggle")
    public ResponseEntity<LikeResponseDTO> toggleLike(@Valid @RequestBody LikeRequestDTO request) {
        boolean liked = likeService.toggleLike(request);
        long count;
        if (request.getTargetType() == LikeRequestDTO.TargetType.POST) {
            count = likeService.getPostLikeCount(request.getTargetId());
        } else {
            count = likeService.getCommentLikeCount(request.getTargetId());
        }
        LikeResponseDTO response = LikeResponseDTO.builder()
                .liked(liked)
                .likeCount(count)
                .targetId(request.getTargetId())
                .targetType(request.getTargetType() != null ? request.getTargetType().name() : null)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/post/{postId}")
    public ResponseEntity<List<UserResponseDTO>> getPostLikers(@PathVariable Long postId) {
        return ResponseEntity.ok(likeService.getPostLikers(postId));
    }
}
