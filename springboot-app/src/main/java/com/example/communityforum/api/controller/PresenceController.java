package com.example.communityforum.api.controller;

import com.example.communityforum.service.PresenceService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@Tag(name = "Presence", description = "Online user presence")
@RestController
@RequestMapping("/api/presence")
@RequiredArgsConstructor
public class PresenceController {

    private final PresenceService presenceService;

    @GetMapping
    public Map<String, List<String>> onlineUsers() {
        return Map.of("online", presenceService.onlineUsernames());
    }
}