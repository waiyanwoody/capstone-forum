package com.example.communityforum.service;

import com.example.communityforum.events.VerificationRequested;
import com.example.communityforum.exception.HttpStatusException;
import com.example.communityforum.mail.EmailService;
import com.example.communityforum.persistence.entity.VerificationToken;
import com.example.communityforum.persistence.entity.User;
import com.example.communityforum.persistence.repository.VerificationTokenRepository;
import com.example.communityforum.persistence.repository.UserRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class VerificationService {
    private final VerificationTokenRepository tokenRepo;
    private final UserRepository userRepo;
    private final EmailService emailService;
    private final ApplicationEventPublisher publisher;
    private final SpringTemplateEngine templateEngine;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;
    @Value("${app.name:Community Forum}")
    private String appName;
    @Value("${app.email.verify.expire-hours:24}")
    private int expireHours;

    @Value("${app.password.reset.expire-mins:10}")
    private int resetExpireMins;

    public VerificationService(VerificationTokenRepository tokenRepo,
                               UserRepository userRepo,
                               EmailService emailService,
                               ApplicationEventPublisher publisher,
                               SpringTemplateEngine templateEngine,
                               PasswordEncoder passwordEncoder) {
        this.tokenRepo = tokenRepo;
        this.userRepo = userRepo;
        this.emailService = emailService;
        this.publisher = publisher;
        this.templateEngine = templateEngine;
        this.passwordEncoder = passwordEncoder;

    }

    @Transactional
    public void sendVerification(User user) {
        String token = UUID.randomUUID().toString();
        VerificationToken evt = VerificationToken.builder()
                .token(token)
                .purpose("EMAIL_VERIFY")
                .expiresAt(LocalDateTime.now().plusHours(expireHours))
                .used(false)
                .user(user)
                .build();
        tokenRepo.save(evt);

        String link = baseUrl + "/auth/verify-email?token=" + token;

        Context ctx = new Context();
        ctx.setVariable("username", user.getUsername());
        ctx.setVariable("verifyLink", link);
        ctx.setVariable("appName", appName);
        ctx.setVariable("expireHours", expireHours);

        String html = templateEngine.process("mail/verify-email", ctx);
        publisher.publishEvent(new VerificationRequested(user.getEmail(), "Verify your email", html));
    }

    @Transactional
    public void verify(String token) {
        VerificationToken evt = tokenRepo.findByToken(token)
                .orElseThrow(() -> HttpStatusException.of("Invalid verification token", HttpStatus.BAD_REQUEST));

        if (evt.isUsed() || evt.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw HttpStatusException.of("Verification token expired or already used", HttpStatus.BAD_REQUEST);
        }

        User user = evt.getUser();
        user.setEmailVerified(true);
        user.setEmailVerifiedAt(LocalDateTime.now());
        userRepo.save(user);

        evt.setUsed(true);
        tokenRepo.save(evt);
    }

    @Transactional
    public void startEmailChange(User user, String newEmail, boolean unverifyUntilConfirmed) {
        // reject same or duplicate email
        if (user.getEmail().equalsIgnoreCase(newEmail)) {
            throw HttpStatusException.of("New email is the same as current", HttpStatus.BAD_REQUEST);
        }
        if (userRepo.existsByEmail(newEmail)) {
            throw HttpStatusException.of("Email is already registered", HttpStatus.BAD_REQUEST);
        }
        // optional: prevent concurrent requests to same address
        if (tokenRepo.existsByNewEmailAndPurpose(newEmail, "EMAIL_UPDATE")) {
            throw HttpStatusException.of("A verification was already sent to this email", HttpStatus.BAD_REQUEST);
        }
        // clear previous pending updates for this user
        tokenRepo.deleteByUser_IdAndPurpose(user.getId(), "EMAIL_UPDATE");

        // create token
        String token = UUID.randomUUID().toString();
        VerificationToken evt = VerificationToken.builder()
                .token(token)
                .purpose("EMAIL_UPDATE")
                .expiresAt(LocalDateTime.now().plusHours(expireHours))
                .used(false)
                .newEmail(newEmail)
                .user(user)
                .build();
        tokenRepo.save(evt);

        // restrict until confirm / doesn't need for email change only after verified
        // if (unverifyUntilConfirmed) {
        //     user.setEmailVerified(false);
        //     userRepo.save(user);
        // }

        // email to NEW address
        String link = baseUrl + "/auth/confirm-email-change?token=" + token;
        Context ctx = new Context();
        ctx.setVariable("username", user.getUsername());
        ctx.setVariable("verifyLink", link);
        ctx.setVariable("appName", appName);
        ctx.setVariable("expireHours", expireHours);
        ctx.setVariable("newEmail", newEmail);
        String html = templateEngine.process("mail/confirm-email-change", ctx);
        publisher.publishEvent(new VerificationRequested(newEmail, "Confirm your new email", html));
    }

    @Transactional
    public void confirmEmailChange(String token) {
        VerificationToken evt = tokenRepo.findByToken(token)
                .orElseThrow(() -> HttpStatusException.of("Invalid email change token", HttpStatus.BAD_REQUEST));
        if (!"EMAIL_UPDATE".equals(evt.getPurpose())) {
            throw HttpStatusException.of("Invalid token purpose", HttpStatus.BAD_REQUEST);
        }
        if (evt.isUsed() || evt.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw HttpStatusException.of("Email change token expired or already used", HttpStatus.BAD_REQUEST);
        }
        // finalize change
        User user = evt.getUser();
        String newEmail = evt.getNewEmail();
        if (newEmail == null || newEmail.isBlank()) {
            throw HttpStatusException.of("Missing new email in token", HttpStatus.BAD_REQUEST);
        }
        // last-second uniqueness guard
        if (userRepo.existsByEmail(newEmail)) {
            throw HttpStatusException.of("Email is already registered", HttpStatus.BAD_REQUEST);
        }
        user.setEmail(newEmail);
        user.setEmailVerified(true);
        user.setEmailVerifiedAt(LocalDateTime.now());
        userRepo.save(user);

        evt.setUsed(true);
        tokenRepo.save(evt);
    }

    // forgot password token otp verification
    // generate 6-digit numeric OTP
    private String generateOtp() {
        int code = (int) (Math.random() * 900_000) + 100_000;
        return String.valueOf(code);
    }

    @Transactional
    public void startPasswordReset(String identifier) {
        // find user by username or email; if not found, do nothing (avoid user
        // enumeration)
        var user = userRepo.findByUsername(identifier)
                .or(() -> userRepo.findByEmail(identifier))
                .orElseThrow(() -> new HttpStatusException(HttpStatus.NOT_FOUND, "User not found"));

        tokenRepo.deleteByUser_IdAndPurpose(user.getId(), "PASSWORD_RESET");

        String otp = generateOtp();
        var t = VerificationToken.builder()
                .token(otp)
                .purpose("PASSWORD_RESET")
                .expiresAt(LocalDateTime.now().plusMinutes(resetExpireMins))
                .used(false)
                .user(user)
                .build();
        tokenRepo.save(t);

        // build OTP email
        var ctx = new org.thymeleaf.context.Context();
        ctx.setVariable("username", user.getUsername());
        ctx.setVariable("otp", otp);
        ctx.setVariable("expireMins", resetExpireMins);
        ctx.setVariable("appName", appName);
        String html = templateEngine.process("mail/password-reset-otp", ctx);

        publisher.publishEvent(new VerificationRequested(user.getEmail(), "Your password reset code", html));
    }

    @Transactional
    public void confirmPasswordReset(String identifier, String otp, String newPassword) {
        var user = userRepo.findByUsername(identifier)
                .or(() -> userRepo.findByEmail(identifier))
                .orElseThrow(() -> HttpStatusException.of("Account not found", HttpStatus.BAD_REQUEST));

        var token = tokenRepo.findByUser_IdAndPurposeAndToken(user.getId(), "PASSWORD_RESET", otp)
                .orElseThrow(() -> HttpStatusException.of("Invalid code", HttpStatus.BAD_REQUEST));

        if (token.isUsed() || token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw HttpStatusException.of("Code expired or already used", HttpStatus.BAD_REQUEST);
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepo.save(user);

        token.setUsed(true);
        tokenRepo.save(token);

        // optional: clean other reset tokens
        tokenRepo.deleteByUser_IdAndPurpose(user.getId(), "PASSWORD_RESET");
    }
}