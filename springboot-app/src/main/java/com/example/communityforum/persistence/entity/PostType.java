package com.example.communityforum.persistence.entity;

public enum PostType {
    DISCUSSION,
    QUESTION,
    SHARING,
    ANNOUNCEMENT;

    public boolean isSolvable() {
        return this == DISCUSSION || this == QUESTION;
    }
}
