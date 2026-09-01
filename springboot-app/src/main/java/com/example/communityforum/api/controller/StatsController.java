package com.example.communityforum.api.controller;

import com.example.communityforum.dto.stats.PopularTagDTO;
import com.example.communityforum.dto.stats.TopContributorDTO;
import com.example.communityforum.service.PostService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Stats", description = "Home page sidebar stats")
@RestController
@RequestMapping("/api/stats")
public class StatsController {

    private final PostService postService;

    public StatsController(PostService postService) {
        this.postService = postService;
    }

    @GetMapping("/popular-tags")
    public ResponseEntity<List<PopularTagDTO>> getPopularTags(
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ResponseEntity.ok(postService.getPopularTags(limit));
    }

    @GetMapping("/top-contributors")
    public ResponseEntity<List<TopContributorDTO>> getTopContributors(
            @RequestParam(defaultValue = "5") int limit
    ) {
        return ResponseEntity.ok(postService.getTopContributors(limit));
    }
}
