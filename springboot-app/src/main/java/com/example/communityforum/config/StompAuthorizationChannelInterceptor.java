package com.example.communityforum.config;

import com.example.communityforum.persistence.entity.User;
import com.example.communityforum.persistence.repository.UserRepository;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

import java.security.Principal;

@Component
public class StompAuthorizationChannelInterceptor implements ChannelInterceptor {
    private final UserRepository userRepository;

    public StompAuthorizationChannelInterceptor(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) return message;

        if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            Principal principal = accessor.getUser();
            String destination = accessor.getDestination();

            if (principal == null) {
                throw new org.springframework.security.access.AccessDeniedException("Unauthenticated");
            }

            // Block cross-user subscriptions on public per-user topics
            if (destination != null && destination.startsWith("/topic/user/")) {
                Long requestedId = extractUserId(destination); // /topic/user/{id}/notifications
                User current = userRepository.findByUsername(principal.getName())
                        .orElseThrow(() -> new org.springframework.security.access.AccessDeniedException("User not found"));

                if (!current.getId().equals(requestedId)) {
                    throw new org.springframework.security.access.AccessDeniedException("Not allowed to subscribe to another user's notifications");
                }
            }
        }
        return message;
    }

    private Long extractUserId(String destination) {
        // expects /topic/user/{id}/notifications
        String[] parts = destination.split("/");
        if (parts.length >= 4) {
            return Long.parseLong(parts[3]);
        }
        throw new IllegalArgumentException("Invalid destination: " + destination);
    }
}