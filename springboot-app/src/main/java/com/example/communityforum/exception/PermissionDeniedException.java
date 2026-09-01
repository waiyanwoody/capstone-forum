package com.example.communityforum.exception;

import org.springframework.http.HttpStatus;

public class PermissionDeniedException extends RuntimeException {
    public PermissionDeniedException(String message) {
        super(message);
    }
}