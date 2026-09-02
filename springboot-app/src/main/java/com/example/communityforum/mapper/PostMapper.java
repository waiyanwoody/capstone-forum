package com.example.communityforum.mapper;

import com.example.communityforum.dto.post.*;
import com.example.communityforum.dto.user.AuthorDTO;
import com.example.communityforum.dto.user.UserResponseDTO;
import com.example.communityforum.persistence.entity.Post;
import com.example.communityforum.persistence.entity.Tag;
import com.example.communityforum.persistence.entity.User;
import com.example.communityforum.persistence.repository.LikeRepository;
import com.example.communityforum.persistence.repository.SavedPostRepository;
import com.example.communityforum.service.StorageService;

import java.util.List;
import java.util.Map;
import java.util.Arrays;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

@Component
public class PostMapper {
    private final LikeRepository likeRepository;
    private final SavedPostRepository savedPostRepository;
    private final StorageService storageService;

    public PostMapper(LikeRepository likeRepository, SavedPostRepository savedPostRepository,
                      StorageService storageService) {
        this.likeRepository = likeRepository;
        this.savedPostRepository = savedPostRepository;
        this.storageService = storageService;
    }

    public PostListResponseDTO toListDTO(Post post, User currentUser, Map<Long,Long> likeCountMap, Map<Long, Long> commentCountMap) {
        boolean liked = currentUser != null && likeRepository.existsByUserAndPost(currentUser, post);
        boolean saved = currentUser != null && savedPostRepository.existsByUserAndPost(currentUser, post);

        // Get author safely
        User author = post.getUser();
        AuthorDTO authorDTO = null;
        if (author != null) {
            authorDTO = new AuthorDTO(
                    author.getId(),
                    author.getUsername(),
                    avatarUrl(author.getAvatarPath()));
        }

        return PostListResponseDTO.builder()
                .id(post.getId())
                .title(post.getTitle())
                .excerpt(generateExcerpt(post.getContent()))
                .tags(post.getTags() != null
                        ? post.getTags().stream()
                                .map(Tag::getName)
                                .toList()
                        : List.of())
                .slug(post.getSlug())
                .type(post.getType() != null ? post.getType().name() : "DISCUSSION")
                .createdAt(post.getCreatedAt())
                .author(authorDTO) //  embedded author info
                .likeCount(likeCountMap.getOrDefault(post.getId(), 0L))
                .commentCount(commentCountMap.getOrDefault(post.getId(), 0L))
                .liked(liked)
                .isSaved(saved)
                .isPinned(post.isPinned())
                .isSolved(post.isSolved())
                .build();
    }

    public PostDetailResponseDTO toDetailDTO(Post post, User currentUser) {
        long likeCount = likeRepository.countByPostId(post.getId());
        boolean liked = currentUser != null && likeRepository.existsByUserAndPost(currentUser, post);
        boolean saved = currentUser != null && savedPostRepository.existsByUserAndPost(currentUser, post);

        User user = post.getUser();

        return PostDetailResponseDTO.builder()
                .id(post.getId())
                .title(post.getTitle())
                .content(post.getContent())
                .tags(post.getTags() != null
                ? post.getTags()
                    .stream()
                    .map(Tag::getName)   // extract only tag name
                    .toList()
                : List.of())
                .slug(post.getSlug())
                .type(post.getType() != null ? post.getType().name() : "DISCUSSION")
                .createdAt(post.getCreatedAt())
                .author(user != null ? UserResponseDTO.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .avatar_path(avatarUrl(user.getAvatarPath()))
                        .build() : null)
                .likeCount(likeCount)
                .liked(liked)
                .isSaved(saved)
                .isPinned(post.isPinned())
                .isSolved(post.isSolved())
                .viewCount(post.getViewCount())
                .bestCommentId(post.getBestCommentId())
                .build();


    }

    private String avatarUrl(String avatarPath) {
        if (avatarPath == null || avatarPath.isBlank() || avatarPath.startsWith("http")) {
            return avatarPath;
        }
        return storageService.buildFileUrl(avatarPath);
    }

    public PostSummaryDTO mapToPostSummaryDTO(Post post, Map<Long, Long> likeCountMap, Map<Long, Long> commentCountMap) {
        return PostSummaryDTO.builder()
                .id(post.getId())
                .title(post.getTitle())
                .excerpt(generateExcerpt(post.getContent()))
                .tags(post.getTags() != null
                        ? post.getTags()
                        .stream()
                        .map(Tag::getName)   // extract only tag name
                        .toList()
                        : List.of())
                .slug(post.getSlug())
                .type(post.getType() != null ? post.getType().name() : "DISCUSSION")
                .createdAt(post.getCreatedAt().toString())
                .likeCount(likeCountMap.getOrDefault(post.getId(), 0L))
                .commentCount(commentCountMap.getOrDefault(post.getId(), 0L))
                .pinned(post.isPinned())
                .solved(post.isSolved())
                .build();
    }

        private String generateExcerpt(String content) {
                if (content == null || content.isBlank()) {
                        return "";
                }

                String[] lines = content.split("\\R");
                String images = java.util.Arrays.stream(lines)
                                .map(String::trim)
                                .filter(line -> line.matches("!\\[[^]]*\\]\\([^)]*\\)"))
                                .limit(4)
                                .collect(Collectors.joining("\n"));
                String text = content.replaceAll("!\\[[^]]*\\]\\([^)]*\\)", "")
                                .replaceAll("\\s+", " ")
                                .trim();
                String excerpt = text.length() > 100 ? text.substring(0, 100) + "..." : text;
                return images.isEmpty() ? excerpt : images + (excerpt.isEmpty() ? "" : "\n" + excerpt);
        }
}
