package com.example.communityforum.exception;

public class EmailNotVerifiedException extends RuntimeException {
    public EmailNotVerifiedException() {
        super("Verify Your Email to update profile");
    }
}
