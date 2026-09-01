package com.example.communityforum.integration;

import com.example.communityforum.dto.ApiResponse;
import com.example.communityforum.dto.auth.*;
import com.example.communityforum.dto.user.UserRequestDTO;
import com.example.communityforum.dto.user.UsernameCheckResponse;
import com.example.communityforum.persistence.entity.User;
import com.example.communityforum.persistence.repository.CommentRepository;
import com.example.communityforum.persistence.repository.UserRepository;
import com.example.communityforum.security.JwtUtil;
import com.example.communityforum.service.VerificationService;

import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;

@ActiveProfiles("ci")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class AuthIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @MockitoBean
    private VerificationService verificationService;

    private String baseUrl;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @BeforeEach
    void setUp() {
        commentRepository.deleteAll();
        userRepository.deleteAll();
        baseUrl = "http://localhost:" + port + "/auth"; // Must match @RequestMapping("/auth")
    }

    // ------------------------ REGISTER ------------------------
    @Test
    void testRegisterUser_Success() {
        UserRequestDTO request = new UserRequestDTO();
        request.setUsername("alice");
        request.setPassword("password");
        request.setEmail("alice@example.com");

        ResponseEntity<AuthResponse> response =
                restTemplate.postForEntity(baseUrl + "/register", request, AuthResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getToken()).isNotBlank();
        assertThat(response.getBody().getUser().getUsername()).isEqualTo("alice");

        Mockito.verify(verificationService, Mockito.times(1)).sendVerification(Mockito.any(User.class));
    }

    @Test
    void testRegisterUser_DuplicateUsername_ShouldFail() {
        User existing = new User();
        existing.setUsername("bob");
        existing.setEmail("bob@example.com");
        existing.setPassword(passwordEncoder.encode("password"));
        existing.setRole("USER");
        userRepository.save(existing);

        UserRequestDTO request = new UserRequestDTO();
        request.setUsername("bob");
        request.setEmail("newbob@example.com");
        request.setPassword("password");

        ResponseEntity<String> response =
                restTemplate.postForEntity(baseUrl + "/register", request, String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).contains("Username is already taken");
    }

    // ------------------------ LOGIN ------------------------
    @Test
    void testLoginUser_Success() {
        User user = new User();
        user.setUsername("charlie");
        user.setEmail("charlie@example.com");
        user.setPassword(passwordEncoder.encode("password"));
        user.setRole("USER");
        userRepository.save(user);

        AuthRequest request = new AuthRequest();
        request.setUsername("charlie");
        request.setPassword("password");

        ResponseEntity<AuthResponse> response =
                restTemplate.postForEntity(baseUrl + "/login", request, AuthResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getToken()).isNotBlank();
    }

    @Test
    void testLoginUser_InvalidPassword_ShouldReturn401() {
        User user = new User();
        user.setUsername("david");
        user.setEmail("david@example.com");
        user.setPassword(passwordEncoder.encode("correctpass"));
        user.setRole("USER");
        userRepository.save(user);

        AuthRequest request = new AuthRequest();
        request.setUsername("david");
        request.setPassword("wrongpass");

        ResponseEntity<String> response =
                restTemplate.postForEntity(baseUrl + "/login", request, String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    // ------------------------ CHECK USERNAME ------------------------
    @Test
    void testCheckUsername_Available() {
        ResponseEntity<UsernameCheckResponse> response =
                restTemplate.getForEntity(baseUrl + "/check-username?username=newuser", UsernameCheckResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isAvailable()).isTrue();
    }

    @Test
    void testCheckUsername_Taken() {
        User user = new User();
        user.setUsername("takenuser");
        user.setEmail("taken@example.com");
        user.setPassword(passwordEncoder.encode("pass"));
        user.setRole("USER");
        userRepository.save(user);

        ResponseEntity<UsernameCheckResponse> response =
                restTemplate.getForEntity(baseUrl + "/check-username?username=takenuser", UsernameCheckResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isAvailable()).isFalse();
    }

    // ------------------------ CURRENT USER ------------------------
    @Test
    void testGetCurrentUser_WithValidJWT() {
        User user = new User();
        user.setUsername("eve");
        user.setEmail("eve@example.com");
        user.setPassword(passwordEncoder.encode("pass"));
        user.setRole("USER");
        userRepository.save(user);

        String token = jwtUtil.generateToken(user);

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<String> response = restTemplate.exchange(
                baseUrl + "/me", HttpMethod.GET, entity, String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).contains("eve@example.com");
    }

    @Test
    void testGetCurrentUser_WithoutJWT_ShouldReturn401() {
        ResponseEntity<String> response =
                restTemplate.getForEntity(baseUrl + "/me", String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    // ------------------------ FORGOT PASSWORD ------------------------
    @Test
    void testForgotPassword_Success() {
        ForgotPasswordRequest req = new ForgotPasswordRequest();
        req.setIdentifier("test@example.com");

        ResponseEntity<ApiResponse> response =
                restTemplate.postForEntity(baseUrl + "/forgot-password", req, ApiResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getStatus()).isEqualTo("success");
        Mockito.verify(verificationService, Mockito.times(1)).startPasswordReset("test@example.com");
    }

    // ------------------------ RESET PASSWORD ------------------------
    @Test
    void testResetPassword_Success() {
        ResetPasswordRequest req = new ResetPasswordRequest();
        req.setIdentifier("test@example.com");
        req.setOtp("123456");
        req.setNewPassword("newPass123");

        ResponseEntity<ApiResponse> response =
                restTemplate.postForEntity(baseUrl + "/reset-password", req, ApiResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getMessage()).contains("successful");
        Mockito.verify(verificationService, Mockito.times(1))
                .confirmPasswordReset("test@example.com", "123456", "newPass123");
    }
}
