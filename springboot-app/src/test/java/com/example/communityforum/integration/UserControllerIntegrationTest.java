package com.example.communityforum.integration;

import com.example.communityforum.CommunityForumApplication;
import com.example.communityforum.dto.user.UserRequestDTO;
import com.example.communityforum.dto.user.UserResponseDTO;
import com.example.communityforum.persistence.entity.User;
import com.example.communityforum.persistence.repository.UserRepository;
import com.example.communityforum.security.JwtUtil;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@ActiveProfiles("ci")
@SpringBootTest(classes = CommunityForumApplication.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class UserControllerIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    private String adminToken;
    private User admin;

    @BeforeEach
    void setUp() {

        // Create admin user if not exists
        admin = userRepository.findByEmail("admin@example.com")
                .orElseGet(() -> {
                    User u = new User();
                    u.setFullname("Admin");
                    u.setUsername("admin");
                    u.setEmail("admin@example.com");
                    u.setPassword(new BCryptPasswordEncoder().encode("password"));
                    u.setRole("ADMIN");
                    u.setEmailVerified(true);
                    return userRepository.save(u);
                });

        adminToken = jwtUtil.generateToken(admin);
    }

    @Test
    void testGetAllUsers_WithValidJWT() {
        String url = "http://localhost:" + port + "/api/admin/users";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);
        HttpEntity<Void> request = new HttpEntity<>(headers);

        ResponseEntity<UserResponseDTO[]> response =
                restTemplate.exchange(url, HttpMethod.GET, request, UserResponseDTO[].class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotEmpty();
        assertThat(response.getBody()).extracting(UserResponseDTO::getEmail).contains("admin@example.com");
    }

    @Test
    void testCreateUser_WithValidJWT() {
        String url = "http://localhost:" + port + "/api/admin/users";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(adminToken);

        UserRequestDTO newUser = new UserRequestDTO();
        newUser.setUsername("bob");
        newUser.setEmail("bob@example.com");
        newUser.setPassword("password");

        HttpEntity<UserRequestDTO> request = new HttpEntity<>(newUser, headers);

        ResponseEntity<UserResponseDTO> response =
                restTemplate.postForEntity(url, request, UserResponseDTO.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getUsername()).isEqualTo("bob");

        List<UserResponseDTO> users = userRepository.findAll()
                .stream()
                .map(u -> new UserResponseDTO(u.getId(), u.getUsername(), u.getEmail()))
                .toList();
        assertThat(users).extracting(UserResponseDTO::getEmail).contains("bob@example.com");
    }

    @Test
    void testGetUserById_WithValidJWT() {
        // Create a test user if not exists
        User user = userRepository.findByEmail("alice@example.com")
                .orElseGet(() -> {
                    User u = new User();
                    u.setUsername("alice");
                    u.setEmail("alice@example.com");
                    u.setPassword(new BCryptPasswordEncoder().encode("password"));
                    u.setRole("USER");
                    u.setEmailVerified(true);
                    return userRepository.save(u);
                });

        String url = "http://localhost:" + port + "/api/admin/users/" + user.getId();

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);
        HttpEntity<Void> request = new HttpEntity<>(headers);

        ResponseEntity<UserResponseDTO> response =
                restTemplate.exchange(url, HttpMethod.GET, request, UserResponseDTO.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getUsername()).isEqualTo("alice");
    }

    @Test
    void testGetUserById_WithInvalidJWT_ShouldReturn401() {
        // Create a test user if not exists
        User user = userRepository.findByEmail("alice2@example.com")
                .orElseGet(() -> {
                    User u = new User();
                    u.setUsername("alice2");
                    u.setEmail("alice2@example.com");
                    u.setPassword(new BCryptPasswordEncoder().encode("password"));
                    u.setRole("USER");
                    u.setEmailVerified(true);
                    return userRepository.save(u);
                });

        String url = "http://localhost:" + port + "/api/admin/users/" + user.getId();

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth("invalid-token");
        HttpEntity<Void> request = new HttpEntity<>(headers);

        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, request, String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }
}
