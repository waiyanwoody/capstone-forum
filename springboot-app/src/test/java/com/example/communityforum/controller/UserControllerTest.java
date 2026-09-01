package com.example.communityforum.controller;

import com.example.communityforum.api.controller.UserController;
import com.example.communityforum.dto.user.UserResponseDTO;
import com.example.communityforum.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doNothing;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
public class UserControllerTest {

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController userController;

    private MockMvc mockMvc;

    @BeforeEach
    void setup() {
        mockMvc = MockMvcBuilders.standaloneSetup(userController).build();
    }

    // ---------------- Get all users ----------------
    @Test
    void testGetAllUsers() throws Exception {
        List<UserResponseDTO> users = List.of(
                new UserResponseDTO(1L, "alice", "alice@example.com"),
                new UserResponseDTO(2L, "bob", "bob@example.com")
        );

        when(userService.getAllUsers()).thenReturn(users);

        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].username").value("alice"))
                .andExpect(jsonPath("$[1].username").value("bob"));
    }

    // ---------------- Get user by ID ----------------
    @Test
    void testGetUserById_UserExists() throws Exception {
        when(userService.getUserById(1L))
                .thenReturn(Optional.of(new UserResponseDTO(1L, "alice", "alice@example.com")));

        mockMvc.perform(get("/api/admin/users/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("alice"));
    }

    @Test
    void testGetUserById_UserNotFound() throws Exception {
        when(userService.getUserById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/admin/users/99"))
                .andExpect(status().isNotFound());
    }

    // ---------------- Get user by email ----------------
    @Test
    void testGetUserByEmail_UserExists() throws Exception {
        when(userService.getUserByEmail("alice@example.com"))
                .thenReturn(Optional.of(new UserResponseDTO(1L, "alice", "alice@example.com")));

        mockMvc.perform(get("/api/admin/users/email/alice@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("alice"));
    }

    @Test
    void testGetUserByEmail_UserNotFound() throws Exception {
        when(userService.getUserByEmail("unknown@example.com")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/admin/users/email/unknown@example.com"))
                .andExpect(status().isNotFound());
    }

    // ---------------- Delete user ----------------
    @Test
    void testDeleteUser() throws Exception {
        doNothing().when(userService).deleteUser(1L);

        mockMvc.perform(delete("/api/admin/users/1"))
                .andExpect(status().isNoContent());
    }
}
