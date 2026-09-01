package com.example.communityforum.mapper;

import com.example.communityforum.dto.comment.CommentResponseDTO;
import com.example.communityforum.persistence.entity.Comment;
import com.example.communityforum.persistence.entity.User;
import com.example.communityforum.persistence.repository.LikeRepository;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class CommentMapper {

    private final LikeRepository likeRepository;

    public CommentMapper(LikeRepository likeRepository) {
        this.likeRepository = likeRepository;
    }

    public CommentResponseDTO toResponseDTO(Comment comment) {
        return toResponseDTO(comment, null, 0);
    }

    public CommentResponseDTO toResponseDTO(Comment comment, User currentUser, int depth) {
        if (comment == null) return null;

        boolean liked = currentUser != null
                && likeRepository.existsByUserAndComment(currentUser, comment);

        return CommentResponseDTO.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .authorUsername(comment.getUser() != null ? comment.getUser().getUsername() : null)
                .authorFullname(comment.getUser() != null ? comment.getUser().getFullname() : null)
                .authorAvatar(comment.getUser() != null ? comment.getUser().getAvatarPath() : null)
                .createdAt(comment.getCreatedAt())
                .postId(comment.getPost() != null ? comment.getPost().getId() : null)
                .likeCount(likeRepository.countByCommentId(comment.getId()))
                .liked(liked)
                .best(comment.isBest())
                .replies(mapReplies(comment, currentUser, depth))
                .build();
    }

    private List<CommentResponseDTO> mapReplies(Comment comment, User currentUser, int depth) {
        List<Comment> replies = comment.getReplies();
        if (replies == null || replies.isEmpty()) {
            return new ArrayList<>();
        }

        List<CommentResponseDTO> result = new ArrayList<>();
        // limit nested recursion to avoid very deep payloads
        if (depth < 10) {
            for (Comment reply : replies) {
                result.add(toResponseDTO(reply, currentUser, depth + 1));
            }
        }
        return result;
    }
}
