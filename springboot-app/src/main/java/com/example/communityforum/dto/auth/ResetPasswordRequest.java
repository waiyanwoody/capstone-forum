package com.example.communityforum.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResetPasswordRequest {
    @NotBlank
    private String identifier; // email or username
    @NotBlank
    private String otp; // 6-digit
    @NotBlank
    @Size(min = 6)
    private String newPassword;
}