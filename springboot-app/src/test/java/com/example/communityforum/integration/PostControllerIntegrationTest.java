package com.example.communityforum.integration;

import com.example.communityforum.CommunityForumApplication;
import com.example.communityforum.dto.PageResponse;
import com.example.communityforum.dto.post.PostDetailResponseDTO;
import com.example.communityforum.dto.post.PostListResponseDTO;
import com.example.communityforum.dto.post.PostRequestDTO;
import com.example.communityforum.persistence.entity.Post;
import com.example.communityforum.persistence.entity.Tag;
import com.example.communityforum.persistence.entity.User;
import com.example.communityforum.persistence.repository.PostRepository;
import com.example.communityforum.persistence.repository.UserRepository;
import com.example.communityforum.security.JwtUtil;
import com.example.communityforum.service.PostService;
import com.github.dockerjava.zerodep.shaded.org.apache.hc.client5.http.classic.methods.HttpHead;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.data.domain.Page;
import org.springframework.http.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Fail.fail;


@ActiveProfiles("ci")
@SpringBootTest(classes = CommunityForumApplication.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class PostControllerIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private PostService postService;

    @Autowired
    private JwtUtil jwtUtil;


    private String adminToken;
    private String userToken;
    private User admin;
    private User user;


    @BeforeEach
    void setUp() {

        // clear repositories
        postRepository.deleteAll();
        userRepository.deleteAll();

        // Create admin and normal users
        admin = createUser("Admin", "admin", "admin@example.com", "password", "ADMIN", true);
        adminToken = jwtUtil.generateToken(admin);

        user = createUser("Alice", "alice", "alice@example.com", "password", "USER", false);
        userToken = jwtUtil.generateToken(user);
    }

    private User createUser(String fullname, String username, String email, String password, String role, boolean emailVerified) {
        User user = new User();
        user.setFullname(fullname);
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(new BCryptPasswordEncoder().encode(password));
        user.setRole(role);
        user.setEmailVerified(emailVerified);
        return userRepository.save(user);
    }

    // helper function to create post
    private Post createPost(User author, String title, String slug) {
        Post post = new Post();
        post.setUser(author);
        post.setTitle(title);
        post.setSlug(slug);
        post.setContent("Default content for " + title);
        return postRepository.save(post);
    }

    @Test
    void testVerifiedUser_canCreatePost() {
        String url = "http://localhost:" + port + "/api/posts";

        // prepare request
        PostRequestDTO request =  new PostRequestDTO();
        request.setTitle("My First Post");
        request.setContent("Test Content");
        List<String> tags = new ArrayList<>(Arrays.asList("hello","test"));
        request.setTags(tags);

        // prepare header
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(adminToken); // create post as verified user

        // call rest api
        ResponseEntity<PostDetailResponseDTO> response =
                restTemplate.postForEntity(url, new HttpEntity<>(request, headers), PostDetailResponseDTO.class);

        // check
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getTitle()).isEqualTo("My First Post");

        List<Post> posts = postRepository.findAll();
        assertThat(posts).hasSize(1);
    }

    @Test
    void testUnverifiedUser_createPost_shouldReturn403() {
        String url = "http://localhost:" + port + "/api/posts";

        // prepare request
        PostRequestDTO request =  new PostRequestDTO();
        request.setTitle("My First Post");
        request.setContent("Test Content");
        List<String> tags = new ArrayList<>(Arrays.asList("hello","test"));
        request.setTags(tags);

        // prepare header
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(userToken); // create post as unverified user

        // call rest api
        ResponseEntity<PostDetailResponseDTO> response =
                restTemplate.postForEntity(url, new HttpEntity<>(request, headers), PostDetailResponseDTO.class);

        // check
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void testGetAllPosts_DefaultPagination() {

            // Create 7 posts
            for (int i = 1; i <= 7; i++) {
                createPost(admin, "Post " + i, "post-" + i);
            }

            String url = "http://localhost:" + port + "/api/posts";

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(adminToken);
            HttpEntity<Void> request = new HttpEntity<>(headers);

        ResponseEntity<PageResponse<PostListResponseDTO>> response =
                restTemplate.exchange(
                        url,
                        HttpMethod.GET,
                        request,
                        new ParameterizedTypeReference<PageResponse<PostListResponseDTO>>() {}
                );

            //  Assertions
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

            PageResponse<PostListResponseDTO> page = response.getBody();
            assertThat(page).isNotNull();
            assertThat(page.getContent().size()).isEqualTo(5); // default page size

            assertThat(page.getContent().get(0).getTitle()).isEqualTo("Post 7");
            assertThat(page.getContent().get(1).getTitle()).isEqualTo("Post 6");

            assertThat(page.getTotalElements()).isEqualTo(7);
            assertThat(page.getTotalPages()).isEqualTo(2); // 7 posts, page size 5 -> 2 pages
    }

    @Test
    void testGetAllPosts_CustomPaginationAndSorting() {
        // Create 7 posts
        for (int i = 1; i <= 7; i++) {
            createPost(admin, "Post " + i, "post-" + i);
        }

        // Custom pagination & sorting: page 1, size 3, sort by title ascending
        String url = "http://localhost:" + port + "/api/posts?page=1&size=3&sort=title,ASC";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);
        HttpEntity<Void> request = new HttpEntity<>(headers);

        ResponseEntity<PageResponse<PostListResponseDTO>> response =
                restTemplate.exchange(
                        url,
                        HttpMethod.GET,
                        request,
                        new ParameterizedTypeReference<PageResponse<PostListResponseDTO>>() {}
                );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

        PageResponse<PostListResponseDTO> page = response.getBody();
        assertThat(page).isNotNull();

        // Check page info
        assertThat(page.getNumber()).isEqualTo(1);
        assertThat(page.getSize()).isEqualTo(3);

        // Check content size (last page may have fewer items)
        assertThat(page.getContent().size()).isEqualTo(3);

        // Check sorting by title ascending
        assertThat(page.getContent().get(0).getTitle()).isEqualTo("Post 4");
        assertThat(page.getContent().get(1).getTitle()).isEqualTo("Post 5");
        assertThat(page.getContent().get(2).getTitle()).isEqualTo("Post 6");

        // Check total elements and pages
        assertThat(page.getTotalElements()).isEqualTo(7);
        assertThat(page.getTotalPages()).isEqualTo(3); // 7 posts, page size 3 -> 3 pages
    }

    @Test
    void testGetPostById() {
        Post post = createPost(admin, "Test Post", "test-post");

        String url = "http://localhost:" + port + "/api/posts/" + post.getId();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);

        ResponseEntity<PostDetailResponseDTO> response = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(headers), PostDetailResponseDTO.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getTitle()).isEqualTo("Test Post");
    }

    @Test
    void testUpdatePost() {
        Post post = createPost(admin, "Old Title", "old-title");

        String url = "http://localhost:" + port + "/api/posts/" + post.getId();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        PostRequestDTO updateRequest = new PostRequestDTO();
        updateRequest.setTitle("Updated Title");
        updateRequest.setContent("Updated content.");

        ResponseEntity<PostDetailResponseDTO> response = restTemplate.exchange(
                url, HttpMethod.PUT, new HttpEntity<>(updateRequest, headers), PostDetailResponseDTO.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getTitle()).isEqualTo("Updated Title");
    }

    @Test
    void testSoftDeletePost() {
        Post post = createPost(admin, "Post to delete", "delete-post");

        String url = "http://localhost:" + port + "/api/posts/" + post.getId();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);

        ResponseEntity<Map> response = restTemplate.exchange(
                url, HttpMethod.DELETE, new HttpEntity<>(headers), Map.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().get("message")).isEqualTo("Post soft-deleted successfully");

    }

    @Test
    void testRestorePost() {
        // Create and save a soft-deleted post directly in the repository
        Post post = new Post();
        post.setTitle("Deleted Post");
        post.setSlug("deleted-post");
        post.setContent("Some content");
        post.setUser(admin);
        post.setDeletedAt(LocalDateTime.now()); // Mark as soft-deleted
        post = postRepository.save(post); // Save to DB

        // Call the restore endpoint via TestRestTemplate
        String url = "http://localhost:" + port + "/api/posts/" + post.getId() + "/restore";
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken); // Ensure admin token

        ResponseEntity<PostDetailResponseDTO> response = restTemplate.exchange(
                url, HttpMethod.POST, new HttpEntity<>(headers), PostDetailResponseDTO.class
        );

        // Assert the response
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getTitle()).isEqualTo("Deleted Post");

        // Optional: verify the post is no longer soft-deleted in DB
            Post restoredPost = postRepository.findById(post.getId()).orElseThrow();
            assertThat(restoredPost.getDeletedAt()).isNull();
    }

    @Test
    void testHardDeletePost() {
        Post post = createPost(admin, "Permanent Post", "perm-post");

        String url = "http://localhost:" + port + "/api/posts/" + post.getId() + "/hard";
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);

        ResponseEntity<Map> response = restTemplate.exchange(
                url, HttpMethod.DELETE, new HttpEntity<>(headers), Map.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().get("message")).isEqualTo("Post permanently deleted successfully");
    }


}
