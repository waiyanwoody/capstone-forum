package com.example.communityforum.api.controller;

import com.example.communityforum.dto.post.PostListResponseDTO;
import com.example.communityforum.service.SavedPostService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "Saved Posts", description = "Endpoints for managing saved posts")
@RestController
@RequestMapping("/api/saved")
public class SavedPostController {

    private final SavedPostService savedPostService;

    public SavedPostController(SavedPostService savedPostService) {
        this.savedPostService = savedPostService;
    }

    @PostMapping("/{postId}/toggle")
    public ResponseEntity<Map<String, Object>> toggleSave(@PathVariable Long postId) {
        boolean saved = savedPostService.toggleSave(postId);
        return ResponseEntity.ok(Map.of("saved", saved));
    }

    @GetMapping
    public ResponseEntity<List<PostListResponseDTO>> getSavedPosts() {
        return ResponseEntity.ok(savedPostService.getSavedPosts());
    }
}
