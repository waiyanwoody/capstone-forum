package com.example.communityforum.security;

import com.example.communityforum.persistence.entity.User;
import com.example.communityforum.persistence.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;

import java.io.IOException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class JwtFilterTest {

    private JwtUtil jwtUtil;
    private UserRepository userRepository;
    private JwtAuthenticationFilter jwtFilter;
    private FilterChain filterChain;

    @BeforeEach
    void setUp() {
        jwtUtil = mock(JwtUtil.class);
        userRepository = mock(UserRepository.class);
        jwtFilter = new JwtAuthenticationFilter(jwtUtil, userRepository);
        filterChain = mock(FilterChain.class);

        SecurityContextHolder.clearContext(); // clear context before each test
    }

    @Test
    void testDoFilterInternal_WithValidToken_ShouldAuthenticateUser() throws ServletException, IOException {
        // Mock HTTP request with Authorization header
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        request.addHeader("Authorization", "Bearer valid-token");

        // Mock JwtUtil behavior
        when(jwtUtil.extractUserId("valid-token")).thenReturn(1L);

        // Mock UserRepository
        User user = new User();
        user.setId(1L);
        user.setUsername("alice");
        user.setPassword("password");
        user.setRole("USER");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        // Mock token validation
        when(jwtUtil.validateToken("valid-token", 1L)).thenReturn(true);

        // Call filter
        jwtFilter.doFilterInternal(request, response, filterChain);

        // Verify authentication is set in SecurityContext
        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        UserDetails authenticatedUser = (UserDetails) SecurityContextHolder.getContext().getAuthentication()
                .getPrincipal();
        assertEquals("alice", authenticatedUser.getUsername());
        assertTrue(authenticatedUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_USER")));

        // Verify filter chain continues
        verify(filterChain, times(1)).doFilter(request, response);
    }

    @Test
    void testDoFilterInternal_WithNoToken_ShouldNotAuthenticate() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        // Call filter without Authorization header
        jwtFilter.doFilterInternal(request, response, filterChain);

        // SecurityContext should remain empty
        assertNull(SecurityContextHolder.getContext().getAuthentication());

        // Verify filter chain continues
        verify(filterChain, times(1)).doFilter(request, response);
    }

    @Test
    void testDoFilterInternal_WithInvalidToken_ShouldNotAuthenticate() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        request.addHeader("Authorization", "Bearer invalid-token");

        when(jwtUtil.extractUserId("invalid-token")).thenReturn(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(new User()));
        when(jwtUtil.validateToken("invalid-token", 1L)).thenReturn(false);

        jwtFilter.doFilterInternal(request, response, filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain, times(1)).doFilter(request, response);
    }
}
