package com.example.communityforum.api.controller;

import com.example.communityforum.dto.post.UserPostsResponseDTO;
import com.example.communityforum.service.PostService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "UserPost", description = "Endpoints for managing forum user post")
@RestController
@RequestMapping("/api/user")
public class UserPostController {

    @Autowired
    private PostService postService;


    //Get one post by id
    @GetMapping("/{userId}/posts")
    public ResponseEntity<UserPostsResponseDTO> getUserPosts(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize
    ) {
        UserPostsResponseDTO response = postService.getPostsByUserId(userId, page, pageSize);
        return ResponseEntity.ok(response);
    }
}
