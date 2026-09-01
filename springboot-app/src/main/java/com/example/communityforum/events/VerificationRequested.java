package com.example.communityforum.events;

public record VerificationRequested(String to, String subject, String body) {}