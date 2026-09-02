package com.example.communityforum.config;

import com.example.communityforum.persistence.entity.Post;
import com.example.communityforum.persistence.entity.Tag;
import com.example.communityforum.persistence.repository.PostRepository;
import com.example.communityforum.service.EmbeddingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * On startup, generates embeddings for any posts created before the
 * recommendation feature was added (their embeddings are NULL in the DB).
 */
@Component
public class EmbeddingBackfillRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(EmbeddingBackfillRunner.class);

    private final PostRepository postRepository;
    private final EmbeddingService embeddingService;

    public EmbeddingBackfillRunner(PostRepository postRepository, EmbeddingService embeddingService) {
        this.postRepository = postRepository;
        this.embeddingService = embeddingService;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<Post> missing = postRepository.findAllWithNullEmbeddingNotDeleted();
        if (missing == null || missing.isEmpty()) {
            log.info("EmbeddingBackfill: no posts missing embeddings");
            return;
        }
        log.info("EmbeddingBackfill: found {} posts missing embeddings", missing.size());
        int updated = 0;
        for (Post post : missing) {
            try {
                List<String> tagNames = post.getTags() != null
                        ? post.getTags().stream().map(Tag::getName).toList()
                        : List.of();
                String embedText = embeddingService.buildText(
                        post.getTitle(), post.getContent(), tagNames);
                byte[] embedding = embeddingService.embedText(embedText);
                if (embedding == null) {
                    log.warn("EmbeddingBackfill: embedding failed for post {} – skipped", post.getId());
                    continue;
                }
                post.setEmbedding(embedding);
                postRepository.save(post);
                updated++;
            } catch (Exception e) {
                log.warn("EmbeddingBackfill: error for post {} – skipped: {}", post.getId(), e.getMessage());
            }
        }
        log.info("EmbeddingBackfill: completed, embedded {} posts", updated);
    }
}
