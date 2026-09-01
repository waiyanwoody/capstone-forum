package com.example.communityforum.api.controller;


import com.example.communityforum.dto.PageResponse;
import com.example.communityforum.dto.post.PostDetailResponseDTO;
import com.example.communityforum.dto.post.PostListResponseDTO;
import com.example.communityforum.dto.post.PostRequestDTO;
import com.example.communityforum.dto.post.UserPostsResponseDTO;
import com.example.communityforum.persistence.entity.Follow;
import com.example.communityforum.persistence.entity.Post;
import com.example.communityforum.persistence.entity.User;
import com.example.communityforum.persistence.repository.FollowRepository;
import com.example.communityforum.persistence.repository.PostRepository;
import com.example.communityforum.persistence.repository.UserRepository;
import com.example.communityforum.service.PostService;
import com.example.communityforum.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Parameter;

import java.util.List;
import java.util.Map;

@Tag(name = "Posts", description = "Endpoints for managing forum posts")
@RestController
@RequestMapping("/api/posts")
public class PostController {
    private final PostService postService;
    private final UserRepository userRepository;
    private final FollowRepository followRepository;
    private final PostRepository postRepository;

    public PostController(PostService postService, UserRepository userRepository,
                          FollowRepository followRepository, PostRepository postRepository) {
        this.postService = postService;
        this.userRepository = userRepository;
        this.followRepository = followRepository;
        this.postRepository = postRepository;
    }

    // ────────────────────────────────────────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<PageResponse<PostListResponseDTO>> getAllPosts(
            @ParameterObject
            @Parameter(description = "Pagination and sorting parameters (e.g., ?page=0&size=5&sort=createdAt,DESC)")
            @PageableDefault(page = 0, size = 5, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable,
            @RequestParam(required = false) Boolean solved,
            @RequestParam(required = false) Boolean pinned
    ) {
        Page<PostListResponseDTO> postsPage = postService.getAllPosts(pageable, solved, pinned);

        PageResponse<PostListResponseDTO> response = PageResponse.<PostListResponseDTO>builder()
                .content(postsPage.getContent())
                .number(postsPage.getNumber())
                .size(postsPage.getSize())
                .totalElements(postsPage.getTotalElements())
                .totalPages(postsPage.getTotalPages())
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<PostDetailResponseDTO> getPostBySlug(
            @PathVariable String slug
    ) {
        return ResponseEntity.ok(postService.getPostBySlug(slug));
    }

    //Get one post by id
    @GetMapping("/{id}")
    public ResponseEntity<PostDetailResponseDTO> getPostById(@PathVariable Long id) {
        return ResponseEntity.ok(postService.getPostById(id));
    }

    //Create a post
    @PostMapping
    //@PreAuthorize("@securityUtils.isVerified()")
    public ResponseEntity<PostDetailResponseDTO> addPost(@Valid @RequestBody PostRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(postService.addPost(request));
    }

    //Update post by id
    @PutMapping("/{id}")
    public ResponseEntity<PostDetailResponseDTO> updatePost(@PathVariable Long id, @RequestBody PostRequestDTO request) {
            return ResponseEntity.ok(postService.updatePost(id,request));
    }

    // DELETE -> soft delete current user's or admin
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deletePost(@PathVariable Long id) {
        postService.softDeletePost(id);
        Map<String, String> response = Map.of("message", "Post soft-deleted successfully");
        return ResponseEntity.ok(response);
    }

    // POST -> restore current user's or admin
    @PostMapping("/{id}/restore")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PostDetailResponseDTO> restorePost(@PathVariable Long id) {
        return ResponseEntity.ok(postService.restorePost(id));
    }

    // DELETE hard-delete current user's or admin
    @DeleteMapping("/{id}/hard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> hardDeletePost(@PathVariable Long id) {
        postService.hardDeletePost(id);
        Map<String, String> response = Map.of("message", "Post permanently deleted successfully");
        return ResponseEntity.ok(response);
    }

    // GET posts from users the current user follows
    @GetMapping("/following")
    public ResponseEntity<List<PostListResponseDTO>> getFollowingPosts() {
        return ResponseEntity.ok(postService.getFollowingPosts());
    }

    // GET posts liked by the current user
    @GetMapping("/liked")
    public ResponseEntity<List<PostListResponseDTO>> getLikedPosts() {
        return ResponseEntity.ok(postService.getLikedPosts());
    }

    // POST toggle solved flag
    @PostMapping("/{id}/solved")
    public ResponseEntity<PostDetailResponseDTO> toggleSolved(@PathVariable Long id) {
        return ResponseEntity.ok(postService.toggleSolved(id));
    }

    // POST toggle pinned flag
    @PostMapping("/{id}/pinned")
    public ResponseEntity<PostDetailResponseDTO> togglePinned(@PathVariable Long id) {
        return ResponseEntity.ok(postService.togglePinned(id));
    }

}
