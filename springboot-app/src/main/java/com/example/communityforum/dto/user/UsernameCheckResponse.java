package com.example.communityforum.dto.user;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UsernameCheckResponse {
    private boolean valid;
    private boolean available;
    private String message;
}
