package com.example.communityforum.service;

import com.example.communityforum.dto.post.PostListResponseDTO;
import com.example.communityforum.dto.user.AuthorDTO;
import com.example.communityforum.mapper.PostMapper;
import com.example.communityforum.persistence.entity.Post;
import com.example.communityforum.persistence.entity.User;
import com.example.communityforum.persistence.elasticsearch.PostSearchHit;
import com.example.communityforum.persistence.repository.CommentRepository;
import com.example.communityforum.persistence.repository.LikeRepository;
import com.example.communityforum.persistence.repository.PostRepository;
import com.example.communityforum.persistence.repository.SavedPostRepository;
import com.example.communityforum.persistence.repository.UserRepository;
import com.example.communityforum.security.SecurityUtils;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.elasticsearch.client.elc.ElasticsearchTemplate;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.query.Query;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SearchServiceTest {

    @Mock
    private ElasticsearchTemplate elasticsearchTemplate;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PostRepository postRepository;

    @Mock
    private LikeRepository likeRepository;

    @Mock
    private CommentRepository commentRepository;

    @Mock
    private SavedPostRepository savedPostRepository;

    @Mock
    private SecurityUtils securityUtils;

    @Mock
    private PostMapper postMapper;

    @InjectMocks
    private SearchService searchService;

    @Test
    void searchPosts_shouldReturnSameListShapeAsGetAllPosts() {
        User author = User.builder()
                .id(10L)
                .username("alice")
                .avatarPath("/avatar.png")
                .build();

        Post post = Post.builder()
                .id(7L)
                .title("Spring Boot Search")
                .content("This is a long content block used in search results")
                .slug("spring-boot-search")
                .user(author)
                .createdAt(LocalDateTime.now())
                .build();

        PostSearchHit searchHit = new PostSearchHit();
        searchHit.setId(7L);
        SearchHit<PostSearchHit> hit = mock(SearchHit.class);
        SearchHits<PostSearchHit> hits = mock(SearchHits.class);
        when(hit.getContent()).thenReturn(searchHit);
        when(hits.stream()).thenAnswer(invocation -> Stream.of(hit));
        when(hits.getTotalHits()).thenReturn(1L);

        when(elasticsearchTemplate.search(any(Query.class), eq(PostSearchHit.class))).thenReturn(hits);
        when(postRepository.findAllById(List.of(7L))).thenReturn(List.of(post));
        when(postMapper.toListDTO(eq(post), eq(null), any(), any())).thenReturn(PostListResponseDTO.builder()
                .id(7L)
                .title("Spring Boot Search")
                .slug("spring-boot-search")
                .excerpt("This is a long content block used in search results")
                .author(AuthorDTO.builder().id(10L).username("alice").avatar_path("/avatar.png").build())
                .likeCount(12L)
                .commentCount(4L)
                .build());

        List<Object[]> likeCounts = new ArrayList<>();
        likeCounts.add(new Object[] {7L, 12L});
        List<Object[]> commentCounts = new ArrayList<>();
        commentCounts.add(new Object[] {7L, 4L});

        when(likeRepository.countLikesByPostIds(List.of(7L))).thenReturn(likeCounts);
        when(commentRepository.countCommentsByPostIds(List.of(7L))).thenReturn(commentCounts);
        when(securityUtils.getCurrentUser()).thenReturn(null);

        Page<PostListResponseDTO> result = searchService.searchPosts("spring", PageRequest.of(0, 10));

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals("spring-boot-search", result.getContent().get(0).getSlug());
        assertEquals("alice", result.getContent().get(0).getAuthor().getUsername());
        assertEquals(12L, result.getContent().get(0).getLikeCount());
        assertEquals(4L, result.getContent().get(0).getCommentCount());
    }
}
