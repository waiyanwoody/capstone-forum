package com.example.communityforum.events;

import com.example.communityforum.dto.post.PostListResponseDTO;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class PostUpdatedEvent {
    private final PostListResponseDTO post;
}