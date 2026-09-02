package com.example.communityforum.persistence.repository;

import com.example.communityforum.persistence.entity.ChatMessageRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessageRecord, Long> {

    @Query("""
            select c from ChatMessageRecord c
            where c.createdAt >= :after
              and ((c.senderId = :a and c.recipientId = :b) or (c.senderId = :b and c.recipientId = :a))
            order by c.createdAt asc
            """)
    List<ChatMessageRecord> findBetween(@Param("a") Long a, @Param("b") Long b, @Param("after") LocalDateTime after);

    long deleteByCreatedAtBefore(LocalDateTime cutoff);
}