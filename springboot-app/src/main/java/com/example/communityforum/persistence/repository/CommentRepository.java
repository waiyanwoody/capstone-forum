package com.example.communityforum.persistence.repository;


import com.example.communityforum.persistence.entity.Comment;
import com.example.communityforum.persistence.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    Page<Comment> findByPostId(Long postId, Pageable pageable);

    Page<Comment> findByUserId(Long userId, Pageable pageable);

    // to find top-level (root) comment
    List<Comment> findByPostAndParentCommentIsNull(Post post);

    // Replies for a specific comment
    List<Comment> findByParentCommentId(Long parentCommentId);

    List<Comment> findByPostAndParentCommentIsNullAndDeletedAtIsNull(Post post);

    @Query("SELECT c.post.id, COUNT(c) FROM Comment c WHERE c.post.id IN :postIds GROUP BY c.post.id")
    List<Object[]> countCommentsByPostIds(@Param("postIds") List<Long> postIds);
}