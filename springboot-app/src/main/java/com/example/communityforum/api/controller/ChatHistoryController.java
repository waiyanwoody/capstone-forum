package com.example.communityforum.api.controller;

import com.example.communityforum.dto.chat.ChatMessageDTO;
import com.example.communityforum.persistence.entity.ChatMessageRecord;
import com.example.communityforum.persistence.entity.User;
import com.example.communityforum.persistence.repository.ChatMessageRepository;
import com.example.communityforum.persistence.repository.UserRepository;
import com.example.communityforum.security.SecurityUtils;
import com.example.communityforum.service.FollowService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Tag(name = "Chat history", description = "Retrieve the last 24h of a private conversation with a friend")
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatHistoryController {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final FollowService followService;
    private final SecurityUtils securityUtils;

    private static final DateTimeFormatter TS = DateTimeFormatter.ofPattern("HH:mm");

    @GetMapping("/{peerUsername}/history")
    public List<ChatMessageDTO> history(@PathVariable String peerUsername) {
        User me = securityUtils.getCurrentUser();
        User peer = userRepository.findByUsername(peerUsername).orElse(null);
        if (peer == null || !followService.areFriends(me, peer)) {
            return List.of();
        }

        List<ChatMessageRecord> records = chatMessageRepository.findBetween(
                me.getId(), peer.getId(), LocalDateTime.now().minusHours(24));

        return records.stream().map(r -> toDto(r, me, peer)).toList();
    }

    private ChatMessageDTO toDto(ChatMessageRecord r, User me, User peer) {
        boolean senderIsMe = r.getSenderId().equals(me.getId());
        User sender = senderIsMe ? me : peer;
        User recipient = senderIsMe ? peer : me;
        return new ChatMessageDTO(
                r.getId(),
                r.getClientId(),
                sender.getUsername(),
                sender.getFullname(),
                sender.getAvatarPath(),
                recipient.getUsername(),
                r.getContent(),
                r.getCreatedAt().format(TS)
        );
    }
}