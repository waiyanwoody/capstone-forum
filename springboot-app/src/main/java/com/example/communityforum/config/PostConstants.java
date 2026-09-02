package com.example.communityforum.config;

import java.util.List;

public final class PostConstants {

    public static final int MAX_TAGS = 5;

    public static final List<String> ALLOWED_TAGS = List.of(
            "Study",
            "Programming",
            "Technology",
            "University",
            "Career",
            "Projects",
            "Events",
            "Resources",
            "Community"
    );

    private PostConstants() {
    }

    public static boolean isAllowedTag(String tag) {
        if (tag == null) {
            return false;
        }
        String t = tag.trim();
        return ALLOWED_TAGS.stream().anyMatch(a -> a.equalsIgnoreCase(t));
    }
}
