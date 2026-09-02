package com.example.communityforum.api.controller;

import com.example.communityforum.persistence.entity.User;
import com.example.communityforum.persistence.repository.NotificationRepository;
import com.example.communityforum.persistence.repository.UserRepository;
import com.example.communityforum.dto.notification.NotificationResponseDTO;

import com.example.communityforum.security.SecurityUtils;
import io.swagger.v3.oas.annotations.tags.Tag;

import com.example.communityforum.persistence.entity.Notification;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Tag(name = "Notifications", description = "Endpoints for managing user notifications")
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final SecurityUtils securityUtils;
    private final UserRepository userRepository;


    @GetMapping("/{userId}")
    public List<NotificationResponseDTO> getUserNotifications(@PathVariable Long userId) {
        User currentUser = securityUtils.getCurrentUser();

        // If current user is not admin, override the userId with current user's ID
        if (!currentUser.getRole().equals("ADMIN")) {
            userId = currentUser.getId();
        }
        return notificationRepository.findByReceiverIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(n -> NotificationResponseDTO.fromEntity(n, userRepository.findById(n.getSenderId()).orElse(null)))
                .toList();
    }

    @GetMapping("/{userId}/unread-count")
    public long getUnreadCount(@PathVariable Long userId) {
        User currentUser = securityUtils.getCurrentUser();

        // If current user is not admin, override the userId with current user's ID
        if (!currentUser.getRole().equals("ADMIN")) {
            userId = currentUser.getId();
        }
        return notificationRepository.countByReceiverIdAndReadFalse(userId);
    }

    @PostMapping("/{userId}/read-all")
    @ResponseBody
    public int markAllRead(@PathVariable Long userId) {
        User currentUser = securityUtils.getCurrentUser();

        // If current user is not admin, override the userId with current user's ID
        if (!currentUser.getRole().equals("ADMIN")) {
            userId = currentUser.getId();
        }
        return notificationRepository.markAllReadByReceiverId(userId);
    }

    @PostMapping("/{notificationId}/read")
    @ResponseBody
    public int markRead(@PathVariable Long notificationId) {
        User currentUser = securityUtils.getCurrentUser();
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));

        // Only the receiver (or an admin) may mark a notification as read
        if (!currentUser.getRole().equals("ADMIN") && !notification.getReceiverId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your notification");
        }
        return notificationRepository.markReadById(notificationId);
    }

    // Send notification to a specific user
    public void sendNotification(String username, Notification notification) {
        User sender = userRepository.findById(notification.getSenderId()).orElse(null);
        messagingTemplate.convertAndSendToUser(
                username,
                "/queue/notifications",
                NotificationResponseDTO.fromEntity(notification, sender)
        );
    }

    // Optional: receive messages from client
    @MessageMapping("/notify")
    public void receive(Notification notification) {
        System.out.println("Received: " + notification.getMessage());
    }
}
