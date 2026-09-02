package com.example.communityforum.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Tracks which users currently have at least one live WebSocket session.
 * A user is "online" while any of their sessions is connected, and goes
 * offline only when the last one disconnects. Changes are broadcast on
 * /topic/presence so clients can show live active badges.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PresenceService {

    private final SimpMessagingTemplate messagingTemplate;

    // sessionId -> username
    private final ConcurrentHashMap<String, String> sessionUser = new ConcurrentHashMap<>();
    // username -> number of live sessions
    private final ConcurrentHashMap<String, Integer> onlineCount = new ConcurrentHashMap<>();

    public void onConnect(String sessionId, String username) {
        if (username == null || sessionId == null) return;
        sessionUser.put(sessionId, username);
        boolean first = onlineCount.merge(username, 1, Integer::sum) == 1;
        if (first) broadcast(username, true);
    }

    public void onDisconnect(String sessionId) {
        String username = sessionUser.remove(sessionId);
        if (username == null) return;
        Integer remaining = onlineCount.computeIfPresent(username, (u, c) -> c - 1);
        if (remaining != null && remaining <= 0) {
            onlineCount.remove(username);
            broadcast(username, false);
        }
    }

    public boolean isOnline(String username) {
        Integer c = onlineCount.get(username);
        return c != null && c > 0;
    }

    public List<String> onlineUsernames() {
        return new ArrayList<>(onlineCount.keySet());
    }

    private void broadcast(String username, boolean online) {
        try {
            messagingTemplate.convertAndSend("/topic/presence",
                    java.util.Map.of("username", username, "online", online));
        } catch (Exception e) {
            log.warn("Failed to broadcast presence for {}: {}", username, e.getMessage());
        }
    }
}