package com.example.communityforum.jobs;

import com.example.communityforum.persistence.repository.VerificationTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class VerificationTokenCleanupTask {
    private final VerificationTokenRepository tokenRepo;
    // Optional retention for used tokens
    @Value("${tokens.used.retention-days:7}")
    private int usedRetentionDays;

    // Run hourly (adjust as needed)
    @Scheduled(cron = "0 0 * * * *")
    public void purgeExpiredAndOldUsed() {
        var now = LocalDateTime.now();
        tokenRepo.deleteByExpiresAtBefore(now);
        var cutoffUsed = now.minusDays(usedRetentionDays);
        long oldUsed = tokenRepo.deleteByUsedIsTrueAndExpiresAtBefore(cutoffUsed);
        log.info("VerificationToken cleanup: expired=<n/a>, oldUsed>{}d={}", usedRetentionDays, oldUsed);
    }
}