package com.example.communityforum.persistence.repository;

import com.example.communityforum.persistence.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface TagRepository extends JpaRepository<Tag, Long> {
    Optional<Tag> findByNameIgnoreCase(String name);
    Optional<Tag> findByName(String name);

    @Query("SELECT t.name, COUNT(t) FROM Post p JOIN p.tags t WHERE p.deletedAt IS NULL GROUP BY t.id, t.name ORDER BY COUNT(t) DESC")
    List<Object[]> findPopularTags();
}
