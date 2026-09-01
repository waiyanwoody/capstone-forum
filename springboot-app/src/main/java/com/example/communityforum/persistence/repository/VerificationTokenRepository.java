package com.example.communityforum.persistence.repository;

import com.example.communityforum.persistence.entity.VerificationToken;

import jakarta.transaction.Transactional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

import java.time.LocalDateTime;
import java.util.Optional;

public interface VerificationTokenRepository extends JpaRepository<VerificationToken, Long> {
    Optional<VerificationToken> findByToken(String token);

    void deleteByExpiresAtBefore(java.time.LocalDateTime cutoff);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    void deleteByUser_IdAndPurpose(Long userId, String purpose);

    Optional<VerificationToken> findByUser_IdAndPurposeAndToken(Long userId, String purpose, String token);

    boolean existsByNewEmailAndPurpose(String newEmail, String purpose);
    // Purge expired tokens
    // NEW: purge used tokens older than retention
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    long deleteByUsedIsTrueAndExpiresAtBefore(LocalDateTime cutoff);
}
