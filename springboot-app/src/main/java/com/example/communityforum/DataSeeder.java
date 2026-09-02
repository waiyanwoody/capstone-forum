package com.example.communityforum;

import com.example.communityforum.persistence.entity.User;
import com.example.communityforum.persistence.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.findByUsername("admin").isEmpty()) {
            User admin = User.builder()
                    .fullname("admin")
                    .username("admin")
                    .email("admin@example.com")
                    .emailVerified(true)
                    .password(passwordEncoder.encode("admin123"))
                    .role("ADMIN")
                    .bio("System administrator account")
                    .build();

            userRepository.save(admin);
            System.out.println("✅ Admin account created: admin@example.com (password: admin123)");
        } else {
            System.out.println("ℹ️ Admin account already exists.");
        }
    }
}
