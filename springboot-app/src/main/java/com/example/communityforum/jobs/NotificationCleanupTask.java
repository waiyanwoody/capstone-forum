// NotificationCleanupTask.java
package com.example.communityforum.jobs;

import com.example.communityforum.persistence.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationCleanupTask {
    private final NotificationRepository repo;

    @Value("${notifications.retention-days:30}")
    private int retentionDays;

    @Scheduled(cron = "0 0 2 * * *") // 02:00 nightly
    public void purgeOldRead() {
        var cutoff = LocalDateTime.now().minusDays(retentionDays);
        long deleted = repo.deleteByReadIsTrueAndCreatedAtBefore(cutoff);
        log.info("Deleted {} read notifications older than {} days", deleted, retentionDays);
    }
}