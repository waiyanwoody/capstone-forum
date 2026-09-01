package com.example.communityforum.dto;

public class ApiResponse<T> {

    private String status;   // e.g., "success" or "error"
    private String message;  // optional descriptive message
    private T data;          // the actual payload

    public ApiResponse() {}

    public ApiResponse(String status, String message, T data) {
        this.status = status;
        this.message = message;
        this.data = data;
    }

    // Getters & setters
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public T getData() { return data; }
    public void setData(T data) { this.data = data; }
}
