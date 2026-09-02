package com.example.communityforum.notification;

import com.example.communityforum.events.PostUpdatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class PostUpdatedListener {

    private final SimpMessagingTemplate messagingTemplate;

    @Async
    @EventListener
    public void handlePostUpdated(PostUpdatedEvent event) {
        try {
            messagingTemplate.convertAndSend("/topic/post-updates", event.getPost());
            log.info("Broadcast post update '{}' to /topic/post-updates", event.getPost().getSlug());
        } catch (Exception e) {
            log.error("Failed to broadcast post update", e);
        }
    }
}