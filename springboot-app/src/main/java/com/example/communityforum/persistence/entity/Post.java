package com.example.communityforum.persistence.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

@Entity
@Table(
        name = "posts",
        indexes = {
                @Index(name = "idx_posts_deleted_at", columnList = "deleted_at"),
                @Index(name = "idx_posts_deleted_by", columnList = "deleted_by"),
                @Index(name = "idx_posts_slug", columnList = "slug")
        }
)
@Where(clause = "deleted_at IS NULL")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Post {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false,length = 255)
    private String title;

    @Column(length = 5000)
    private String content;

    @Column(nullable = false, unique = true, length = 255)
    private String slug;

    private LocalDateTime createdAt = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User user;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Comment> comments;

    public long getCommentCount() {
        return comments != null ? comments.size() : 0;
    }

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deleted_by")
    @OnDelete(action = OnDeleteAction.SET_NULL)
    private User deletedBy;

    @ManyToMany(fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
            name = "post_tags",
            joinColumns = @JoinColumn(name = "post_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    private Set<Tag> tags = new HashSet<>();

    @Column(name = "is_pinned", nullable = false)
    private boolean pinned = false;

    @Column(name = "is_solved", nullable = false)
    private boolean solved = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "post_type", length = 20)
    private PostType type = PostType.DISCUSSION;

    @Column(name = "view_count", nullable = false)
    private long viewCount = 0;

    @Column(name = "best_comment_id")
    private Long bestCommentId;

    @Column(name = "embedding", columnDefinition = "BLOB")
    @JsonIgnore
    private byte[] embedding;
}
