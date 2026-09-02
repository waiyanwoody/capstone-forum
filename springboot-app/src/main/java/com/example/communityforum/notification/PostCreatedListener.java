package com.example.communityforum.notification;

import com.example.communityforum.events.PostCreatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class PostCreatedListener {

    private final SimpMessagingTemplate messagingTemplate;

    @Async
    @EventListener
    public void handlePostCreated(PostCreatedEvent event) {
        try {
            messagingTemplate.convertAndSend("/topic/new-posts", event.getPost());
            log.info("Broadcast new post '{}' to /topic/new-posts", event.getPost().getSlug());
        } catch (Exception e) {
            log.error("Failed to broadcast new post", e);
        }
    }
}