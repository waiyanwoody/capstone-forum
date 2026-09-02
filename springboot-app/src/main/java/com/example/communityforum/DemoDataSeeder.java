package com.example.communityforum;

import com.example.communityforum.persistence.entity.*;
import com.example.communityforum.persistence.repository.*;
import com.github.javafaker.Faker;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Component
public class DemoDataSeeder implements ApplicationRunner {

    // Instructs the app to run the demo data (users / posts / comments) seed.
    // Enabled on demand via scripts/seed-demo-data.sh (sets app.seed-demo-data=true).
    public static final String ENABLED_PROPERTY = "app.seed-demo-data";

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final TagRepository tagRepository;
    private final PasswordEncoder passwordEncoder;
    private final Faker faker = new Faker();

    public DemoDataSeeder(UserRepository userRepository,
                          PostRepository postRepository,
                          CommentRepository commentRepository,
                          TagRepository tagRepository,
                          PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.tagRepository = tagRepository;
        this.passwordEncoder = passwordEncoder;
    }

    private String safeSubstring(String str, int maxLength) {
        if (str == null) return "";
        return str.length() > maxLength ? str.substring(0, maxLength) : str;
    }

    private static final List<String> DEMO_TAGS = List.of(
            "java", "spring-boot", "spring-security", "jpa", "mysql",
            "react", "nextjs", "javascript", "typescript", "tailwindcss",
            "websocket", "authentication", "docker", "devops", "testing",
            "algorithms", "database", "ui-ux", "performance", "help-wanted"
    );

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<String> enabled = args.getOptionValues(ENABLED_PROPERTY);
        if (enabled == null || !"true".equalsIgnoreCase(enabled.get(0))) {
            return;
        }

        // Idempotency: skip when any demo users already exist (the only source of
        // non-admin users is this seeder), so re-running never duplicates.
        if (userRepository.count() > 1) {
            System.out.println("ℹ️ Demo data already present. Skipping seed.");
            return;
        }

        System.out.println("🌱 Seeding demo data...");

        // --- Users (default member role, password `password123`) ---
        List<User> users = IntStream.range(0, 10)
                .mapToObj(i -> {
                    User u = new User();
                    u.setFullname(faker.name().fullName());
                    u.setUsername(safeSubstring(faker.name().username(), 50));
                    u.setEmail(safeSubstring(faker.internet().emailAddress(), 100));
                    u.setPassword(passwordEncoder.encode("password123"));
                    return u;
                }).collect(Collectors.toList());
        userRepository.saveAll(users);

        // --- Tags (Post <-> Tag many-to-many via post_tags join table) ---
        List<Tag> tags = DEMO_TAGS.stream().map(Tag::new).collect(Collectors.toList());
        tagRepository.saveAll(tags);

        // --- Posts (random types across the enum) ---
        PostType[] types = PostType.values();
        List<Post> posts = IntStream.range(0, 50)
                .mapToObj(i -> {
                    Post p = new Post();
                    String title = safeSubstring(faker.book().title(), 200);
                    p.setTitle(title);

                    String slug = title.toLowerCase()
                            .replaceAll("[^a-z0-9\\s-]", "")
                            .replaceAll("\\s+", "-");
                    p.setSlug(slug + "-" + faker.number().digits(4));

                    List<String> paragraphs = faker.lorem().paragraphs(faker.number().numberBetween(3, 8));
                    String content = String.join("\n\n", paragraphs);
                    p.setContent(safeSubstring(content, 5000));

                    p.setUser(users.get(faker.number().numberBetween(0, users.size())));
                    p.setType(types[faker.number().numberBetween(0, types.length)]);

                    int tagCount = faker.number().numberBetween(1, 4);
                    Set<Tag> postTags = IntStream.range(0, tagCount)
                            .mapToObj(idx -> tags.get(faker.number().numberBetween(0, tags.size())))
                            .collect(Collectors.toSet());
                    p.setTags(postTags);

                    return p;
                })
                .collect(Collectors.toList());
        postRepository.saveAll(posts);

        // --- Comments ---
        List<Comment> comments = IntStream.range(0, 100)
                .mapToObj(i -> {
                    Comment c = new Comment();
                    c.setContent(safeSubstring(faker.lorem().sentence(3, 8), 500));
                    c.setUser(users.get(faker.number().numberBetween(0, users.size())));
                    c.setPost(posts.get(faker.number().numberBetween(0, posts.size())));
                    return c;
                }).collect(Collectors.toList());
        commentRepository.saveAll(comments);

        System.out.println("✅ Demo data seeded: 10 users, 20 tags, 50 posts, 100 comments!");
    }
}
