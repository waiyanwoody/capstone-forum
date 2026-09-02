package com.example.communityforum.api.controller;

import com.example.communityforum.dto.chat.ChatMessageDTO;
import com.example.communityforum.persistence.entity.ChatMessageRecord;
import com.example.communityforum.persistence.entity.User;
import com.example.communityforum.persistence.repository.ChatMessageRepository;
import com.example.communityforum.persistence.repository.UserRepository;
import com.example.communityforum.service.FollowService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Slf4j
@Controller
@RequiredArgsConstructor
@Tag(name = "Chat", description = "Private 1:1 chat between friends (persisted 24h)")
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;
    private final FollowService followService;
    private final ChatMessageRepository chatMessageRepository;

    private static final DateTimeFormatter TS = DateTimeFormatter.ofPattern("HH:mm");
    private static final String DM_QUEUE = "/queue/messages";

    /**
     * Private 1:1 message between two friends. The message is persisted for 24h,
     * then delivered live to the recipient's and the sender's own user queue
     * (/user/{name}/queue/messages).
     */
    @MessageMapping("/chat.send")
    public void send(@Payload ChatMessageDTO incoming, Principal principal) {
        if (incoming == null || principal == null) {
            return;
        }

        String content = incoming.getContent() == null ? "" : incoming.getContent().trim();
        if (content.isEmpty() || content.length() > 1000) {
            return;
        }

        String senderName = principal.getName();
        User sender = userRepository.findByUsername(senderName).orElse(null);
        if (sender == null) {
            return;
        }

        String recipientName = incoming.getRecipientUsername() == null
                ? "" : incoming.getRecipientUsername().trim();
        if (recipientName.isEmpty() || recipientName.equalsIgnoreCase(senderName)) {
            return;
        }

        User recipient = userRepository.findByUsername(recipientName).orElse(null);
        if (recipient == null) {
            return;
        }

        if (!followService.areFriends(sender, recipient)) {
            // Not friends — silently drop (the UI gates the composer to friends only)
            return;
        }

        // Persist for 24h history
        ChatMessageRecord stored = chatMessageRepository.save(ChatMessageRecord.builder()
                .senderId(sender.getId())
                .recipientId(recipient.getId())
                .clientId(incoming.getClientId())
                .content(content)
                .build());

        ChatMessageDTO message = new ChatMessageDTO(
                stored.getId(),
                incoming.getClientId(),
                sender.getUsername(),
                sender.getFullname(),
                sender.getAvatarPath(),
                recipient.getUsername(),
                content,
                stored.getCreatedAt().format(TS)
        );

        // Deliver to both parties' private queues
        messagingTemplate.convertAndSendToUser(recipient.getUsername(), DM_QUEUE, message);
        messagingTemplate.convertAndSendToUser(sender.getUsername(), DM_QUEUE, message);
    }
}