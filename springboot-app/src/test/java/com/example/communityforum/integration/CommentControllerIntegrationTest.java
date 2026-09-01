package com.example.communityforum.integration;

import com.example.communityforum.dto.PageResponse;
import com.example.communityforum.dto.comment.CommentRequestDTO;
import com.example.communityforum.dto.comment.CommentResponseDTO;
import com.example.communityforum.persistence.entity.Comment;
import com.example.communityforum.persistence.entity.Post;
import com.example.communityforum.persistence.entity.User;
import com.example.communityforum.persistence.repository.CommentRepository;
import com.example.communityforum.persistence.repository.PostRepository;
import com.example.communityforum.persistence.repository.UserRepository;
import com.example.communityforum.security.JwtUtil;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@ActiveProfiles("ci")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class CommentControllerIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private JwtUtil jwtUtil;

    private User user;
    private String userToken;
    private Post post;

    @BeforeEach
    void setUp() {
        commentRepository.deleteAll();
        postRepository.deleteAll();
        userRepository.deleteAll();

        User u = User.builder()
                .fullname("milo")
                .username("milomilo")
                .email("milo@example.com")
                .password(new BCryptPasswordEncoder().encode("password")) // encode password
                .role("USER")
                .emailVerified(true)
                .build();

        user = userRepository.save(u); // assign to field
        userToken = jwtUtil.generateToken(user);

        post = postRepository.findBySlug("sample-post")
                .orElseGet(() -> {
                    Post p = Post.builder()
                            .title("Sample Post")
                            .slug("sample-post")
                            .user(user)
                            .build();
                    return postRepository.save(p);
                });
    }

    private Comment createComment(String content) {
        Comment comment = Comment.builder()
                .content(content)
                .user(user)
                .post(post)
                .build();
        return commentRepository.save(comment);
    }

    @Test
    void testGetAllComments_DefaultPagination() {
        for (int i = 1; i <= 12; i++) createComment("Comment " + i);

        String url = "http://localhost:" + port + "/api/comments";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(userToken);
        HttpEntity<Void> request = new HttpEntity<>(headers);

        ResponseEntity<PageResponse<CommentResponseDTO>> response =
                restTemplate.exchange(url, HttpMethod.GET, request,
                        new ParameterizedTypeReference<PageResponse<CommentResponseDTO>>() {});

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        PageResponse<CommentResponseDTO> page = response.getBody();
        assertThat(page).isNotNull();
        assertThat(page.getContent().size()).isEqualTo(10);
        assertThat(page.getTotalElements()).isEqualTo(12);
        assertThat(page.getTotalPages()).isEqualTo(2);
    }

    @Test
    void testCreateComment() {
        String url = "http://localhost:" + port + "/api/comments";

        CommentRequestDTO dto = new CommentRequestDTO();
        dto.setContent("New comment");
        dto.setPostId(post.getId());

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(userToken);
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<CommentRequestDTO> request = new HttpEntity<>(dto, headers);

        ResponseEntity<CommentResponseDTO> response =
                restTemplate.exchange(url, HttpMethod.POST, request, CommentResponseDTO.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getContent()).isEqualTo("New comment");
    }

    @Test
    void testUnverifiedUser_cannotCreateComment() {
        User unverifiedUser = User.builder()
                .fullname("Unverified")
                .username("unverified")
                .email("unverified@example.com")
                .password("password")
                .role("USER")
                .emailVerified(false)
                .build();
        unverifiedUser = userRepository.save(unverifiedUser);
        String token = jwtUtil.generateToken(unverifiedUser);

        CommentRequestDTO dto = new CommentRequestDTO();
        dto.setContent("New comment");
        dto.setPostId(post.getId());

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<CommentRequestDTO> request = new HttpEntity<>(dto, headers);

        ResponseEntity<CommentResponseDTO> response =
                restTemplate.exchange("http://localhost:" + port + "/api/comments", HttpMethod.POST, request, CommentResponseDTO.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void testUpdateComment() {
        Comment comment = createComment("Old content");
        String url = "http://localhost:" + port + "/api/comments/" + comment.getId();

        CommentRequestDTO dto = new CommentRequestDTO();
        dto.setContent("Updated content");

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(userToken);
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<CommentRequestDTO> request = new HttpEntity<>(dto, headers);

        ResponseEntity<CommentResponseDTO> response =
                restTemplate.exchange(url, HttpMethod.PUT, request, CommentResponseDTO.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getContent()).isEqualTo("Updated content");
    }

    @Test
    void testDeleteComment() {
        Comment comment = createComment("Comment to delete");
        String url = "http://localhost:" + port + "/api/comments/" + comment.getId();

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(userToken);
        HttpEntity<Void> request = new HttpEntity<>(headers);

        ResponseEntity<Map> response =
                restTemplate.exchange(url, HttpMethod.DELETE, request, Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("message")).isEqualTo("Comment deleted successfully");

        assertThat(commentRepository.findById(comment.getId())).isEmpty();
    }

    @Test
    void testGetCommentsByUserId_WithPagination() {
        for (int i = 1; i <= 7; i++) createComment("User comment " + i);

        String url = "http://localhost:" + port + "/api/comments/user/" + user.getId() + "?page=0&size=5&sort=createdAt,DESC";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(userToken);
        HttpEntity<Void> request = new HttpEntity<>(headers);

        ResponseEntity<PageResponse<CommentResponseDTO>> response =
                restTemplate.exchange(url, HttpMethod.GET, request,
                        new ParameterizedTypeReference<PageResponse<CommentResponseDTO>>() {});

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        PageResponse<CommentResponseDTO> page = response.getBody();
        assertThat(page).isNotNull();
        assertThat(page.getContent().size()).isEqualTo(5);
        assertThat(page.getTotalElements()).isEqualTo(7);
        assertThat(page.getTotalPages()).isEqualTo(2);
        assertThat(page.getContent().get(0).getContent()).isEqualTo("User comment 7");
    }
}
