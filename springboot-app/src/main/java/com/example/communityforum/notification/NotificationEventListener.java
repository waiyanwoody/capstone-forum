package com.example.communityforum.notification;

import com.example.communityforum.dto.LikeRequestDTO;
import com.example.communityforum.dto.notification.NotificationResponseDTO;
import com.example.communityforum.events.CommentCreatedEvent;
import com.example.communityforum.events.LikeToggledEvent;
import com.example.communityforum.events.NewFollowerEvent;
import com.example.communityforum.persistence.entity.Comment;
import com.example.communityforum.persistence.entity.Notification;
import com.example.communityforum.persistence.entity.Post;
import com.example.communityforum.persistence.entity.User;
import com.example.communityforum.persistence.repository.CommentRepository;
import com.example.communityforum.persistence.repository.NotificationRepository;
import com.example.communityforum.persistence.repository.PostRepository;
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
    private final CommentRepository commentRepository;
    private final PostRepository postRepository;

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
                    .postId(event.getPostId())
                    .postSlug(event.getPostSlug())
                    .commentId(event.getCommentId())
                    .build();
            Notification saved = notificationRepository.save(notification);
            send(saved);
        } catch (Exception e) {
            log.error("Failed to process comment notification", e);
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

            if (!userRepository.existsById(event.getOwnerId()))
                return;

            // Resolve target post/comment so the notification can route to it
            Long postId = null;
            String postSlug = null;
            Long commentId = null;
            if (event.getTargetType() == LikeRequestDTO.TargetType.POST) {
                Post p = postRepository.findById(event.getTargetId()).orElse(null);
                if (p != null) {
                    postId = p.getId();
                    postSlug = p.getSlug();
                }
            } else if (event.getTargetType() == LikeRequestDTO.TargetType.COMMENT) {
                commentId = event.getTargetId();
                Comment c = commentRepository.findById(event.getTargetId()).orElse(null);
                if (c != null && c.getPost() != null) {
                    postId = c.getPost().getId();
                    postSlug = c.getPost().getSlug();
                }
            }

            String actorName = userRepository.findById(event.getActorId())
                    .map(User::getUsername)
                    .orElse("Someone");

            String targetLabel = event.getTargetType() == LikeRequestDTO.TargetType.POST
                    ? "post"
                    : "comment";
            String message = actorName + " liked your " + targetLabel + ".";

            Notification notification = Notification.builder()
                    .receiverId(event.getOwnerId())
                    .senderId(event.getActorId())
                    .type("LIKE")
                    .message(message)
                    .read(false)
                    .postId(postId)
                    .postSlug(postSlug)
                    .commentId(commentId)
                    .build();
            Notification saved = notificationRepository.save(notification);
            send(saved);
        } catch (Exception e) {
            log.error("Failed to process LikeToggledEvent", e);
        }
    }

    @Async
    @EventListener
    @Transactional
    public void handleNewFollower(NewFollowerEvent event) {
        try {
            if (!userRepository.existsById(event.getFollowingId()))
                return;

            var followerName = userRepository.findById(event.getFollowerId())
                    .map(User::getUsername)
                    .orElse("Someone");

            Notification notification = Notification.builder()
                    .receiverId(event.getFollowingId())
                    .senderId(event.getFollowerId())
                    .type("FOLLOW")
                    .message(followerName + " started following you.")
                    .read(false)
                    .build();
            Notification saved = notificationRepository.save(notification);
            send(saved);
        } catch (Exception e) {
            log.error("Failed to process NewFollowerEvent", e);
        }
    }

    /** Persist-and-deliver helper: broadcasts the enriched DTO to the receiver's queue. */
    private void send(Notification notification) {
        User sender = userRepository.findById(notification.getSenderId()).orElse(null);
        NotificationResponseDTO dto = NotificationResponseDTO.fromEntity(notification, sender);

        String username = userRepository.findById(notification.getReceiverId())
                .map(User::getUsername)
                .orElse(null);
        if (username != null) {
            messagingTemplate.convertAndSendToUser(username, "/queue/notifications", dto);
            log.info("Notification sent to user {} via /user/queue/notifications", username);
        }
    }
}