package com.example.communityforum.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatTypingDTO {
    private String recipientUsername;
    private String senderUsername;
    private String senderFullname;
}
