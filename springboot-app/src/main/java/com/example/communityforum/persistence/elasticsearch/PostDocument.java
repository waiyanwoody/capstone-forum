package com.example.communityforum.persistence.elasticsearch;

import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Document(indexName = "posts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostDocument {

    @Id
    private Long id;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String title;

    @Field(type = FieldType.Text)
    private String content;

    @Field(type = FieldType.Keyword)
    private String slug;

    // Flatten relational data into simple types for fast searching
    @Field(type = FieldType.Keyword)
    private String authorUsername; 

    @Field(type = FieldType.Keyword)
    private List<String> tagNames; 

    @Field(type = FieldType.Boolean)
    private boolean pinned;

    @Field(type = FieldType.Boolean)
    private boolean solved;

    @Field(type = FieldType.Long)
    private long commentCount;

    @Field(type = FieldType.Date)
    private LocalDateTime createdAt;
}