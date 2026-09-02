package com.example.communityforum.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.IndexOperations;

import com.example.communityforum.persistence.elasticsearch.PostDocument;

@Configuration
public class ElasticIndexInitializer {

    @Autowired
    private ElasticsearchOperations elasticsearchOperations;

    @PostConstruct
    public void initIndex() {
        try {
            IndexOperations indexOps = elasticsearchOperations.indexOps(PostDocument.class);
            if (!indexOps.exists()) {
                indexOps.create();
                indexOps.putMapping(indexOps.createMapping());
                System.out.println("Elasticsearch index 'posts' successfully created!");
            }
        } catch (Exception e) {
            // Elasticsearch is optional in the running deployment (no ES service in
            // docker-compose). Don't abort startup when it's unreachable.
            System.out.println("⚠️ Elasticsearch unavailable, skipping index init: " + e.getMessage());
        }
    }
}