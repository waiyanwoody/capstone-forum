package com.example.communityforum.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageDTO {
    private Long id;
    private String clientId;
    private String senderUsername;
    private String senderFullname;
    private String senderAvatar;
    private String recipientUsername;
    private String content;
    private String timestamp;
}