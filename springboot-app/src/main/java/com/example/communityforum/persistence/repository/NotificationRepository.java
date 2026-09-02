package com.example.communityforum.persistence.repository;

import com.example.communityforum.persistence.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByReceiverIdOrderByCreatedAtDesc(Long receiverId);

    long countByReceiverIdAndReadFalse(Long receiverId);

    @Modifying
    @Transactional
    @Query("update Notification n set n.read = true where n.receiverId = :receiverId and n.read = false")
    int markAllReadByReceiverId(@Param("receiverId") Long receiverId);

    @Modifying
    @Transactional
    @Query("update Notification n set n.read = true where n.id = :id")
    int markReadById(@Param("id") Long id);

    long deleteByReadIsTrueAndCreatedAtBefore(LocalDateTime cutoff);
    long deleteByCreatedAtBefore(LocalDateTime cutoff);
}
