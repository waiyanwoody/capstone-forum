package com.example.communityforum.persistence.repository;

import com.example.communityforum.persistence.entity.Post;
import com.example.communityforum.persistence.entity.SavedPost;
import com.example.communityforum.persistence.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedPostRepository extends JpaRepository<SavedPost, Long> {

    boolean existsByUserAndPost(User user, Post post);

    Optional<SavedPost> findByUserAndPost(User user, Post post);

    void deleteByUserAndPost(User user, Post post);

    List<SavedPost> findByUserOrderByCreatedAtDesc(User user);
}
