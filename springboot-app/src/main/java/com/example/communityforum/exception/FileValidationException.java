package com.example.communityforum.exception;
// Custom exception
public class FileValidationException extends RuntimeException {
    public FileValidationException(String message) {
        super(message);
    }
}

