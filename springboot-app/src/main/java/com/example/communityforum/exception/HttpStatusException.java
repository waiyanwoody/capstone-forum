package com.example.communityforum.exception;

import org.springframework.http.HttpStatus;

import java.util.Collections;
import java.util.Map;

public class HttpStatusException extends RuntimeException {
    private final HttpStatus status;
    private final Map<String, String> errors;

    public HttpStatusException(HttpStatus status, String message) {
        super(message);
        this.status = status;
        this.errors = Collections.emptyMap();
    }

    public HttpStatusException(HttpStatus status, String message, Map<String, String> errors) {
        super(message);
        this.status = status;
        this.errors = errors == null ? Collections.emptyMap() : errors;
    }

    public HttpStatus getStatus() { return status; }
    public Map<String, String> getErrors() { return errors; }

    public static HttpStatusException of(String message, HttpStatus status) {
        return new HttpStatusException(status, message);
    }

    public static HttpStatusException of(String message, HttpStatus status, Map<String, String> errors) {
        return new HttpStatusException(status, message, errors);
    }
}