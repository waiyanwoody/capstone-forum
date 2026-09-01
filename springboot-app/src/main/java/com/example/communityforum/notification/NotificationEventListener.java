package com.example.communityforum.notification;

import com.example.communityforum.dto.notification.NotificationResponseDTO;
import com.example.communityforum.events.CommentCreatedEvent;
import com.example.communityforum.events.LikeToggledEvent;
import com.example.communityforum.events.NewFollowerEvent;
import com.example.communityforum.persistence.entity.Notification;
import com.example.communityforum.persistence.repository.NotificationRepository;
import com.example.communityforum.persistence.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationEventListener {
    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;

    @Async
    @EventListener
    @Transactional
    public void handleCommentCreated(CommentCreatedEvent event) {
        try {
            if (!userRepository.existsById(event.getReceiverId()))
                return;
            if (!userRepository.existsById(event.getSenderId()))
                return;

            Notification notification = Notification.builder()
                    .receiverId(event.getReceiverId())
                    .senderId(event.getSenderId())
                    .type("COMMENT")
                    .message("Your post '" + event.getPostTitle() + "' got a new comment.")
                    .read(false)
                    .build();
            Notification saved = notificationRepository.save(notification);

            NotificationResponseDTO dto = new NotificationResponseDTO(
                    saved.getId(),
                    saved.getMessage(),
                    saved.getType(),
                    saved.getCreatedAt().toString());

            String username = userRepository.findById(event.getReceiverId())
                    .map(u -> u.getUsername())
                    .orElse(null);
            if (username != null) {
                // User-destination: client subscribes to /user/queue/notifications
                messagingTemplate.convertAndSendToUser(username, "/queue/notifications", dto);
                log.info("Notification sent to user {} via /user/queue/notifications", username);
            }
        } catch (Exception e) {
            log.error("Failed to process notification", e);
        }
    }
    
    @Async
    @EventListener
    @Transactional
    public void handleLikeToggled(LikeToggledEvent event) {
        try {
            // Only notify on LIKE (not UNLIKE)
            if (!event.getNowLiked())
                return;

            // Do not notify self-likes
            if (event.getActorId().equals(event.getOwnerId()))
                return;

            // Validate receiver (owner) exists and get username to route user-destination
            var ownerOpt = userRepository.findById(event.getOwnerId());
            if (ownerOpt.isEmpty()) {
                log.warn("LikeToggled: owner not found id={}", event.getOwnerId());
                return;
            }
            var owner = ownerOpt.get();

            // Get actor username for message if available
            String actorName = userRepository.findById(event.getActorId())
                    .map(u -> u.getUsername())
                    .orElse("Someone");

            String targetLabel = event.getTargetType() == com.example.communityforum.dto.LikeRequestDTO.TargetType.POST
                    ? "post"
                    : "comment";
            String message = actorName + " liked your " + targetLabel + ".";

            // Save notification
            Notification notification = Notification.builder()
                    .receiverId(event.getOwnerId())
                    .senderId(event.getActorId())
                    .type("LIKE")
                    .message(message)
                    .read(false)
                    .build();
            Notification saved = notificationRepository.save(notification);

            // Send to user queue
            NotificationResponseDTO dto = new NotificationResponseDTO(
                    saved.getId(),
                    saved.getMessage(),
                    saved.getType(),
                    saved.getCreatedAt().toString());
            messagingTemplate.convertAndSendToUser(owner.getUsername(), "/queue/notifications", dto);
            log.info("Like notification sent to user {} via /user/queue/notifications", owner.getUsername());
        } catch (Exception e) {
            log.error("Failed to process LikeToggledEvent: {}", event, e);
        }
    }

    // Add new follower event handling
    @Async
    @EventListener
    @Transactional
    public void handleNewFollower(NewFollowerEvent event) {
        try {
            
            var followedOpt = userRepository.findById(event.getFollowingId());
            var followerName = userRepository.findById(event.getFollowerId())
                    .map(u -> u.getUsername())
                    .orElse("Someone");

            String message = followerName + " started following you.";

            Notification notification = Notification.builder()
                    .receiverId(event.getFollowingId())
                    .senderId(event.getFollowerId())
                    .type("FOLLOW")
                    .message(message)
                    .read(false)
                    .build();
            Notification saved = notificationRepository.save(notification);

            NotificationResponseDTO dto = new NotificationResponseDTO(
                    saved.getId(),
                    saved.getMessage(),
                    saved.getType(),
                    saved.getCreatedAt().toString()
            );

            String followedUsername = followedOpt.get().getUsername();
            messagingTemplate.convertAndSendToUser(followedUsername, "/queue/notifications", dto);
            log.info("Follow notification sent to user {} via /user/queue/notifications", followedUsername);
        } catch (Exception e) {
            log.error("Failed to process NewFollowerEvent: {}", event, e);
        }
    }
}