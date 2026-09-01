package com.example.communityforum.api.controller;

import com.example.communityforum.persistence.entity.User;
import com.example.communityforum.persistence.repository.NotificationRepository;

import com.example.communityforum.security.SecurityUtils;
import io.swagger.v3.oas.annotations.tags.Tag;

import com.example.communityforum.persistence.entity.Notification;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Notifications", description = "Endpoints for managing user notifications")
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final SecurityUtils securityUtils;


    @GetMapping("/{userId}")
    public List<Notification> getUserNotifications(@PathVariable Long userId) {
        User currentUser = securityUtils.getCurrentUser();

        // If current user is not admin, override the userId with current user's ID
        if (!currentUser.getRole().equals("ADMIN")) {
            userId = currentUser.getId();
        }
        return notificationRepository.findByReceiverIdOrderByCreatedAtDesc(userId);
    }

    // Send notification to a specific user
    public void sendNotification(String username, Notification notification) {
        messagingTemplate.convertAndSendToUser(
                username,
                "/queue/notifications",
                notification
        );
    }

    // Optional: receive messages from client
    @MessageMapping("/notify")
    public void receive(Notification notification) {
        System.out.println("Received: " + notification.getMessage());
    }
}
