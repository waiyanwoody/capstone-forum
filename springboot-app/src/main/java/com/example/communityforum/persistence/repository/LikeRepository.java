package com.example.communityforum.persistence.repository;

import com.example.communityforum.persistence.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LikeRepository extends JpaRepository<Like, Long> {

    boolean existsByUserAndPost(User user, Post post);
    boolean existsByUserAndComment(User user, Comment comment);

    void deleteByUserAndPost(User user, Post post);
    void deleteByUserAndComment(User user, Comment comment);

    long countByPost(Post post);
    long countByComment(Comment comment);

    // For post likes
    long countByPostId(Long postId);

    @Query("SELECT l.post.id, COUNT(l) FROM Like l WHERE l.post.id IN :postIds GROUP BY l.post.id")
    List<Object[]> countLikesByPostIds(@Param("postIds") List<Long> postIds);

    // For comment likes
    long countByCommentId(Long commentId);

    // All post Likes by a given user (for liked-posts list)
    List<Like> findByUserIdAndCommentIsNull(Long userId);
}
