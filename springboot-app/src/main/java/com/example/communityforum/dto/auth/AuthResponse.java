package com.example.communityforum.dto.auth;

import com.example.communityforum.dto.user.UserResponseDTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
    private String token;
    private UserResponseDTO user;

    public AuthResponse(String token) {
        this.token = token;
    }
}
