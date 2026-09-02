package com.example.communityforum.persistence.elasticsearch;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;

@Data
@NoArgsConstructor
@Document(indexName = "posts")
public class PostSearchHit {
    @Id
    private Long id;
}