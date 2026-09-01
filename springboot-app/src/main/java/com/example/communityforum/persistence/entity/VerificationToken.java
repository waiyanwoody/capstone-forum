package com.example.communityforum.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Table(name = "verification_tokens", indexes = {
        @Index(name = "idx_token_expires", columnList = "expires_at")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class VerificationToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // store the JWT string
    @Column(nullable = false, unique = true, length = 1024)
    private String token;

    // token purpose: "EMAIL_VERIFY" or "EMAIL_UPDATE" or "PASSWORD_RESET"
    @Column(nullable = false, length = 50)
    private String purpose;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private boolean used = false;

    // if this token is for updating email, store the new email in payload
    @Column(name = "new_email", length = 255)
    private String newEmail;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User user;
}
