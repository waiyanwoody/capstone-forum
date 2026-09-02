package com.example.communityforum.service;

import com.example.communityforum.dto.post.PostListResponseDTO;
import com.example.communityforum.mapper.PostMapper;
import com.example.communityforum.persistence.elasticsearch.PostDocument;
import com.example.communityforum.persistence.elasticsearch.PostSearchHit;
import com.example.communityforum.persistence.entity.Post;
import com.example.communityforum.persistence.entity.User;
import com.example.communityforum.persistence.repository.CommentRepository;
import com.example.communityforum.persistence.repository.LikeRepository;
import com.example.communityforum.persistence.repository.PostRepository;
import com.example.communityforum.persistence.repository.SavedPostRepository;
import com.example.communityforum.persistence.repository.UserRepository;
import com.example.communityforum.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.client.elc.ElasticsearchTemplate;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class SearchService {

    @Autowired
    private ElasticsearchOperations elasticsearchTemplate; // <-- Spring will bind ElasticsearchTemplate automatically

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private LikeRepository likeRepository;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private SavedPostRepository savedPostRepository;

    @Autowired
    private PostMapper postMapper;

    @Autowired
    private SecurityUtils securityUtils;

    @Autowired
    private UserRepository userRepository;

    // 1. Search posts by keyword across both Title and Content
    public Page<PostListResponseDTO> searchPosts(String keyword, Pageable pageable) {
        NativeQuery searchQuery = NativeQuery.builder()
                .withQuery(q -> q
                        .multiMatch(m -> m
                                .fields("title^2", "content", "authorUsername", "tagNames")
                                .query(keyword)))
                .withPageable(pageable)
                .build();

        // Read only hit IDs here. Mapping the full document can fail when the
        // index contains legacy documents with fields from an older schema.
        SearchHits<PostSearchHit> searchHits = elasticsearchTemplate.search(searchQuery, PostSearchHit.class);

        List<Long> postIds = searchHits.stream()
            .map(hit -> hit.getContent() == null ? null : hit.getContent().getId())
            .filter(Objects::nonNull)
                .toList();

        if (postIds.isEmpty()) {
            return Page.empty(pageable);
        }

        Map<Long, Post> postMap = postRepository.findAllById(postIds).stream()
                .collect(Collectors.toMap(Post::getId, Function.identity()));

        Map<Long, Long> likeCountMap = getLikeCountMap(postIds);
        Map<Long, Long> commentCountMap = getCommentCountMap(postIds);
        final User currentUser = resolveCurrentUser();

        List<PostListResponseDTO> postDtos = postIds.stream()
                .map(postMap::get)
                .filter(Objects::nonNull)
                .map(post -> postMapper.toListDTO(post, currentUser, likeCountMap, commentCountMap))
                .toList();

        long totalHits = searchHits.getTotalHits();
        return new PageImpl<>(postDtos, pageable, totalHits);
    }

    private User resolveCurrentUser() {
        try {
            return securityUtils.getCurrentUser();
        } catch (Exception e) {
            return null;
        }
    }

    private Map<Long, Long> getLikeCountMap(List<Long> postIds) {
        if (postIds == null || postIds.isEmpty()) {
            return Map.of();
        }

        return likeRepository.countLikesByPostIds(postIds).stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> (Long) row[1]
                ));
    }

    private Map<Long, Long> getCommentCountMap(List<Long> postIds) {
        if (postIds == null || postIds.isEmpty()) {
            return Map.of();
        }

        return commentRepository.countCommentsByPostIds(postIds).stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> (Long) row[1]
                ));
    }

    // 2. Filter posts by Tag and Search Keyword (Bool Query)
    public List<PostDocument> searchByTagAndKeyword(String tag, String keyword) {
        NativeQuery searchQuery = NativeQuery.builder()
                .withQuery(q -> q
                        .bool(b -> b
                                .must(m -> m.multiMatch(mm -> mm.fields("title", "content").query(keyword)))
                                .filter(f -> f.term(t -> t.field("tagNames").value(tag)))))
                .build();

        SearchHits<PostDocument> searchHits = elasticsearchTemplate.search(searchQuery, PostDocument.class);
        return searchHits.stream().map(h -> h.getContent()).collect(Collectors.toList());
    }

    // 3. Save / Index a PostDocument
    public PostDocument savePostDocument(PostDocument postDocument) {
        return elasticsearchTemplate.save(postDocument);
    }

    // 4. Find PostDocument by ID
    public PostDocument findById(Long id) {
        return elasticsearchTemplate.get(String.valueOf(id), PostDocument.class);
    }

    // 5. Delete PostDocument by ID
    public String deleteById(Long id) {
        return elasticsearchTemplate.delete(String.valueOf(id), PostDocument.class);
    }
}