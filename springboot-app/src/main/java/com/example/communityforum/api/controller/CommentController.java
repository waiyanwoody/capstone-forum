package com.example.communityforum.api.controller;

import com.example.communityforum.dto.PageResponse;
import com.example.communityforum.dto.comment.CommentRequestDTO;
import com.example.communityforum.dto.comment.CommentResponseDTO;
import com.example.communityforum.persistence.entity.Comment;
import com.example.communityforum.service.CommentService;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Tag(name = "Comments", description = "Endpoints for managing forum comments")
@RestController
@RequestMapping("/api/comments")
public class CommentController {
    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    //Get all comments
    @GetMapping
    public ResponseEntity<PageResponse<CommentResponseDTO>> getAllComments(
            @ParameterObject
            @Parameter(description = "Pagination and sorting parameters (e.g., ?page=0&size=5&sort=createdAt,DESC)")
            @PageableDefault(page = 0, size = 10, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable,
            @RequestParam(required = false) Long postId
    ) {
        Page<CommentResponseDTO> commentPage = commentService.getAllComments(pageable, postId);

        PageResponse<CommentResponseDTO> response = PageResponse.<CommentResponseDTO>builder()
                .content(commentPage.getContent())
                .number(commentPage.getNumber())
                .size(commentPage.getSize())
                .totalElements(commentPage.getTotalElements())
                .totalPages(commentPage.getTotalPages())
                .build();

        return ResponseEntity.ok(response);
    }

    //get comment by ID
    @GetMapping("/{id}")
    public ResponseEntity<CommentResponseDTO> getCommentById(@PathVariable Long id) {
        CommentResponseDTO commentResponseDTO = commentService.getCommentById(id);
        return ResponseEntity.ok(commentResponseDTO);
    }

    // GET COMMENTS BY USER ID
    @GetMapping("/user/{userId}")
    public ResponseEntity<PageResponse<CommentResponseDTO>> getCommentsByUserId(
            @PathVariable Long userId,
            @ParameterObject
            @PageableDefault(page = 0, size = 5, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable
    ) {
        Page<CommentResponseDTO> commentPage = commentService.getCommentsByUser(userId, pageable);

        PageResponse<CommentResponseDTO> response = PageResponse.<CommentResponseDTO>builder()
                .content(commentPage.getContent())
                .number(commentPage.getNumber())
                .size(commentPage.getSize())
                .totalElements(commentPage.getTotalElements())
                .totalPages(commentPage.getTotalPages())
                .build();

        return ResponseEntity.ok(response);
    }

    // create new comment
    @PostMapping
    public CommentResponseDTO createComment(@Valid @RequestBody CommentRequestDTO dto) {
        return commentService.addComment(dto);
    }

    // MARK COMMENT AS BEST / SOLUTION (admin or post owner)
    @PostMapping("/{commentId}/mark-best")
    public ResponseEntity<CommentResponseDTO> markBest(
            @PathVariable Long commentId,
            @RequestParam Long postId
    ) {
        CommentResponseDTO dto = commentService.markBestSolution(postId, commentId);
        return ResponseEntity.ok(dto);
    }


    // UPDATE COMMENT
    @PutMapping("/{id}")
    public ResponseEntity<CommentResponseDTO> updateComment(
            @PathVariable Long id,
            @RequestBody CommentRequestDTO dto
    ) {
        try {
            CommentResponseDTO updatedComment = commentService.updateComment(id, dto);
            return ResponseEntity.ok(updatedComment);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // DELETE COMMENT
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteComment(@PathVariable Long id) {
        commentService.deleteComment(id);
        Map<String, String> response = Map.of("message", "Comment deleted successfully");
        return ResponseEntity.ok(response);
    }

}

