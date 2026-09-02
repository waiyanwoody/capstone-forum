package com.example.communityforum.jobs;

import com.example.communityforum.persistence.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class ChatHistoryCleanupTask {

    private final ChatMessageRepository repository;

    // Chat messages live for 24 hours, then are purged
    @Scheduled(fixedRate = 3600000) // every hour
    public void purgeOldMessages() {
        var cutoff = LocalDateTime.now().minusHours(24);
        long deleted = repository.deleteByCreatedAtBefore(cutoff);
        if (deleted > 0) {
            log.info("Purged {} chat messages older than 24h", deleted);
        }
    }
}