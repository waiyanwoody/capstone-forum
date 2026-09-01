package com.example.communityforum.service;

import com.example.communityforum.dto.post.PostListResponseDTO;
import com.example.communityforum.exception.ResourceNotFoundException;
import com.example.communityforum.mapper.PostMapper;
import com.example.communityforum.persistence.entity.Post;
import com.example.communityforum.persistence.entity.SavedPost;
import com.example.communityforum.persistence.entity.User;
import com.example.communityforum.persistence.repository.CommentRepository;
import com.example.communityforum.persistence.repository.LikeRepository;
import com.example.communityforum.persistence.repository.PostRepository;
import com.example.communityforum.persistence.repository.SavedPostRepository;
import com.example.communityforum.security.SecurityUtils;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class SavedPostService {

    private final SavedPostRepository savedPostRepository;
    private final PostRepository postRepository;
    private final PostMapper postMapper;
    private final SecurityUtils securityUtils;
    private final LikeRepository likeRepository;
    private final CommentRepository commentRepository;

    private Map<Long, Long> getLikeCountMap(List<Long> postIds) {
        List<Object[]> counts = likeRepository.countLikesByPostIds(postIds);
        return counts.stream().collect(Collectors.toMap(
                row -> (Long) row[0],
                row -> (Long) row[1]
        ));
    }

    private Map<Long, Long> getCommentCountMap(List<Long> postIds) {
        List<Object[]> counts = commentRepository.countCommentsByPostIds(postIds);
        return counts.stream().collect(Collectors.toMap(
                row -> (Long) row[0],
                row -> (Long) row[1]
        ));
    }

    @Transactional
    public boolean toggleSave(Long postId) {
        User user = securityUtils.getCurrentUser();
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post", postId));

        if (savedPostRepository.existsByUserAndPost(user, post)) {
            savedPostRepository.deleteByUserAndPost(user, post);
            return false;
        }

        savedPostRepository.save(SavedPost.builder()
                .user(user)
                .post(post)
                .build());
        return true;
    }

    public List<PostListResponseDTO> getSavedPosts() {
        User user = securityUtils.getCurrentUser();
        List<Post> posts = savedPostRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(SavedPost::getPost)
                .toList();

        List<Long> postIds = posts.stream().map(Post::getId).toList();
        Map<Long, Long> likeCountMap = getLikeCountMap(postIds);
        Map<Long, Long> commentCountMap = getCommentCountMap(postIds);

        return posts.stream()
                .map(post -> postMapper.toListDTO(post, user, likeCountMap, commentCountMap))
                .toList();
    }
}
