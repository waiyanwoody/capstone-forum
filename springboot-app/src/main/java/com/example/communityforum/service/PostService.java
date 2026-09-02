package com.example.communityforum.service;

import com.example.communityforum.config.PostConstants;
import com.example.communityforum.dto.post.*;
import com.example.communityforum.dto.user.UserSummaryDTO;
import com.example.communityforum.events.PostCreatedEvent;
import com.example.communityforum.events.PostUpdatedEvent;
import com.example.communityforum.exception.HttpStatusException;
import com.example.communityforum.exception.PermissionDeniedException;
import com.example.communityforum.exception.ResourceNotFoundException;
import com.example.communityforum.mapper.PostMapper;
import com.example.communityforum.persistence.entity.Like;
import com.example.communityforum.persistence.elasticsearch.PostDocument;
import com.example.communityforum.persistence.entity.Post;
import com.example.communityforum.persistence.entity.PostType;
import com.example.communityforum.persistence.entity.SavedPost;
import com.example.communityforum.persistence.entity.Tag;
import com.example.communityforum.persistence.entity.User;
import com.example.communityforum.persistence.repository.*;
import com.example.communityforum.security.SecurityUtils;
import lombok.AllArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@AllArgsConstructor
@Service
public class PostService {

    private final PostRepository postRepository;
    private final SecurityUtils securityUtils;
    private final LikeRepository  likeRepository;
    private final TagRepository tagRepository;
    private final PostMapper  postMapper;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final FollowRepository followRepository;
    private final ApplicationEventPublisher publisher;
    private final EmbeddingService embeddingService;
    private final SavedPostRepository savedPostRepository;
    private final SearchService searchService;

    public Page<PostListResponseDTO> getAllPosts(Pageable pageable, Boolean solved, Boolean pinned) {
        Page<Post> postPage;
        if (solved != null) {
            postPage = postRepository.findBySolved(solved, pageable);
        } else if (pinned != null) {
            postPage = postRepository.findByPinned(pinned, pageable);
        } else {
            postPage = postRepository.findAll(pageable);
        }

        User user = securityUtils.getCurrentUser();
        List<Long> postIds = postPage.getContent()
                .stream()
                .map(Post::getId)
                .toList();
        Map<Long, Long> likeCountMap = getLikeCountMap(postIds);
        Map<Long, Long> commentCountMap = getCommentCountMap(postIds);

        return postPage.map(post -> postMapper.toListDTO(post, user, likeCountMap,commentCountMap));

    }

    @Transactional
    public PostDetailResponseDTO getPostById(Long id) {
        Post post = postRepository.findById(id).orElseThrow( () -> new ResourceNotFoundException("Post",id));

        User user = securityUtils.getCurrentUser();
        incrementViewCount(post);

       return postMapper.toDetailDTO(post,user);
    }

    @Transactional
    public PostDetailResponseDTO getPostBySlug(String slug) {
        Post post = postRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Post", slug));

        User user = securityUtils.getCurrentUser();
        incrementViewCount(post);

        return postMapper.toDetailDTO(post, user);
    }

    private void incrementViewCount(Post post) {
        post.setViewCount(post.getViewCount() + 1);
        postRepository.save(post);
    }

    // get like count for post
    private Map<Long, Long> getLikeCountMap(List<Long> postIds) {
        List<Object[]> counts = likeRepository.countLikesByPostIds(postIds);
        return counts.stream().collect(Collectors.toMap(
                row -> (Long) row[0],
                row -> (Long) row[1]
        ));
    }

    // get comment count for post
    private Map<Long, Long> getCommentCountMap(List<Long> postIds) {
        List<Object[]> counts = commentRepository.countCommentsByPostIds(postIds);
        return counts.stream().collect(Collectors.toMap(
                row -> (Long) row[0],
                row -> (Long) row[1]
        ));
    }

    // get all posts by user id
    public UserPostsResponseDTO getPostsByUserId(Long userId, int page, int pageSize) {
        // 1️⃣ Fetch user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 2️⃣ Pagination
        Pageable pageable = PageRequest.of(page - 1, pageSize, Sort.by("createdAt").descending());
        Page<Post> postPage = postRepository.findAllByUser_Id(userId, pageable);

        // 3️⃣ Fetch like counts and comment counts in bulk
        List<Long> postIds = postPage.getContent()
                .stream()
                .map(Post::getId)
                .toList();
        Map<Long, Long> likeCountMap = getLikeCountMap(postIds);
        Map<Long, Long> commentCountMap = getCommentCountMap(postIds);

        // 4️⃣ Map posts using helper function
        List<PostSummaryDTO> postDTOs = postPage.getContent().stream()
                .map(post -> postMapper.mapToPostSummaryDTO(post, likeCountMap,commentCountMap))
                .toList();

        // 5️⃣ Author info
        UserSummaryDTO authorDTO = UserSummaryDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .avatar_path(user.getAvatarPath())
                .build();

        // 6️⃣ Return response
        return UserPostsResponseDTO.builder()
                .author(authorDTO)
                .posts(postDTOs)
                .page(page)
                .pageSize(pageSize)
                .totalPosts(postPage.getTotalElements())
                .build();
    }

    public PostDetailResponseDTO addPost(PostRequestDTO request) {
        User currentUser = securityUtils.getCurrentUser();
        validateAndCleanTags(request.getTags());
        Post post = new Post();
        post.setTitle(request.getTitle());
        post.setContent(request.getContent());
        //ensure post has owner
        post.setUser(currentUser);
        post.setCreatedAt(LocalDateTime.now());
        if (request.getType() != null) {
            post.setType(request.getType());
        }

        post.setTags(processTags(request.getTags()));

        // generate slug
        String slug = generateSlug(request.getTitle());
        post.setSlug(slug);

        // compute + store embedding via the recommendation microservice
        List<String> tagNames = post.getTags().stream().map(Tag::getName).toList();
        String embedText = embeddingService.buildText(request.getTitle(), request.getContent(), tagNames);
        post.setEmbedding(embeddingService.embedText(embedText));

        Post saved = postRepository.save(post);

        // Broadcast new post to all connected clients
        PostListResponseDTO postDTO = postMapper.toListDTO(saved, currentUser, Map.of(), Map.of());
        publisher.publishEvent(new PostCreatedEvent(postDTO));


        // 2. Sync to Elasticsearch (Secondary Read Store)
        PostDocument doc = Post.toPostDocument(saved);
        searchService.savePostDocument(doc);

        return postMapper.toDetailDTO(post, currentUser);
    }

    private String generateSlug(String title) {
        String baseSlug = title.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")  // remove special chars
                .replaceAll("\\s+", "-");         // replace spaces with hyphen

        String slug = baseSlug;
        int counter = 1;

        // ensure uniqueness by checking repository
        while (postRepository.existsBySlug(slug)) {
            slug = baseSlug + "-" + counter++;
        }

        return slug;
    }
    
    private Set<Tag> processTags(List<String> tagNames) {
        if (tagNames == null || tagNames.isEmpty()) {
            return new HashSet<>(); // return an empty set instead of null
        }
        return tagNames.stream()
                .filter(tagName -> tagName != null && !tagName.trim().isEmpty())
                .map(tagName -> {
                    String name = tagName.trim();
                    // Only allowed tags are attached; already validated upstream.
                    return tagRepository.findByNameIgnoreCase(name)
                            .orElseGet(() -> tagRepository.save(Tag.builder().name(name).build()));
                })
                .collect(Collectors.toSet());
    }

    // Validate that provided tags are within the allowed list and not more than MAX_TAGS.
    private void validateAndCleanTags(List<String> tagNames) {
        if (tagNames == null || tagNames.isEmpty()) {
            throw HttpStatusException.of("Select at least one tag",
                    org.springframework.http.HttpStatus.BAD_REQUEST);
        }
        if (tagNames.size() > PostConstants.MAX_TAGS) {
            throw HttpStatusException.of("You can add up to " + PostConstants.MAX_TAGS + " tags",
                    org.springframework.http.HttpStatus.BAD_REQUEST);
        }
        List<String> invalid = tagNames.stream()
                .filter(t -> !PostConstants.isAllowedTag(t))
                .toList();
        if (!invalid.isEmpty()) {
            throw HttpStatusException.of("Tag not allowed: " + String.join(", ", invalid)
                    + ". Allowed tags: " + String.join(", ", PostConstants.ALLOWED_TAGS),
                    org.springframework.http.HttpStatus.BAD_REQUEST);
        }
    }

    // update post
//    @PreAuthorize("hasRole('ADMIN') or @securityUtils.isOwner(@postRepository.findById(#postId).orElse(null))")
    public PostDetailResponseDTO updatePost(long id, PostRequestDTO request) {
        Post existingPost = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post", id));

        // security check
        securityUtils.checkOwnerOrAdmin(existingPost);

        if (request.getTags() != null) {
            validateAndCleanTags(request.getTags());
            existingPost.setTags(processTags(request.getTags()));
        }

        // update only allowed fields
        existingPost.setTitle(request.getTitle());
        existingPost.setContent(request.getContent());
        if (request.getType() != null) {
            existingPost.setType(request.getType());
        }

        // recompute embedding since title/content changed
        List<String> tagNames = existingPost.getTags() != null
                ? existingPost.getTags().stream().map(Tag::getName).toList()
                : List.of();
        String embedText = embeddingService.buildText(request.getTitle(), request.getContent(), tagNames);
        existingPost.setEmbedding(embeddingService.embedText(embedText));;

        postRepository.save(existingPost);

        return postMapper.toDetailDTO(existingPost,securityUtils.getCurrentUser());
    }


    //soft delete post for admin or owner
//    @PreAuthorize("hasRole('ADMIN') or @securityUtils.isOwner(@postRepository.findById(#postId).orElse(null))")
    @Transactional
    public void softDeletePost(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post", postId));

        User currentUser = securityUtils.getCurrentUser();

        // security check
        securityUtils.checkOwnerOrAdmin(post);

        post.setDeletedAt(LocalDateTime.now());
        post.setDeletedBy(currentUser);
        postRepository.save(post);
    }

    // restore soft-deleted post
//    @PreAuthorize("hasRole('ADMIN') or @securityUtils.isOwner(@postRepository.findById(#postId).orElse(null))")
    @Transactional
    public PostDetailResponseDTO restorePost(Long postId) {

        Post post = postRepository.findDeletedById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Soft-deleted Post", postId));

        User currentUser = securityUtils.getCurrentUser();

        // security check
        securityUtils.checkOwnerOrAdmin(post);

        post.setDeletedAt(null);
        post.setDeletedBy(null);
        postRepository.save(post);

        return postMapper.toDetailDTO(post,currentUser);
    }

    // hard delete post
//    @PreAuthorize("hasRole('ADMIN') or @securityUtils.isOwner(@postRepository.findById(#postId).orElse(null))")
    @Transactional
    public void hardDeletePost(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post", postId));

        // security check
        securityUtils.checkOwnerOrAdmin(post);

        // permanent removal
        postRepository.deleteById(postId);
    }

    // ─────────────────────────────────────────────────────────────
    // Liked posts (by current user)
    // ─────────────────────────────────────────────────────────────
    public List<PostListResponseDTO> getLikedPosts() {
        User user = securityUtils.getCurrentUser();
        List<Post> posts = likeRepository.findByUserIdAndCommentIsNull(user.getId())
                .stream()
                .map(like -> like.getPost())
                .toList();

        List<Long> postIds = posts.stream().map(Post::getId).toList();
        Map<Long, Long> likeCountMap = getLikeCountMap(postIds);
        Map<Long, Long> commentCountMap = getCommentCountMap(postIds);

        return posts.stream()
                .map(post -> postMapper.toListDTO(post, user, likeCountMap, commentCountMap))
                .toList();
    }

    // ─────────────────────────────────────────────────────────────
    // Posts from users the current user follows
    // ─────────────────────────────────────────────────────────────
    public List<PostListResponseDTO> getFollowingPosts() {
        User user = securityUtils.getCurrentUser();
        List<User> followingUsers = followRepository.findByFollower(user)
                .stream()
                .map(follow -> follow.getFollowing())
                .toList();

        if (followingUsers.isEmpty()) {
            return List.of();
        }

        List<Post> posts = postRepository.findPostsByFollowing(followingUsers);

        List<Long> postIds = posts.stream().map(Post::getId).toList();
        Map<Long, Long> likeCountMap = getLikeCountMap(postIds);
        Map<Long, Long> commentCountMap = getCommentCountMap(postIds);

        return posts.stream()
                .map(post -> postMapper.toListDTO(post, user, likeCountMap, commentCountMap))
                .toList();
    }

    // ─────────────────────────────────────────────────────────────
    // "For You" recommendations (embedding similarity + popularity)
    // ─────────────────────────────────────────────────────────────
    public Page<PostListResponseDTO> getRecommendedPosts(Pageable pageable) {
        User user = securityUtils.getCurrentUser();

        // Build the user profile vector from posts they liked or saved.
        Set<Long> signalPostIds = new HashSet<>();
        List<Post> signalPosts = new java.util.ArrayList<>();

        for (Like like : likeRepository.findByUserIdAndCommentIsNull(user.getId())) {
            if (like.getPost() != null && like.getPost().getEmbedding() != null) {
                signalPosts.add(like.getPost());
            }
        }
        for (SavedPost saved : savedPostRepository.findByUserOrderByCreatedAtDesc(user)) {
            if (saved.getPost() != null && saved.getPost().getEmbedding() != null) {
                signalPosts.add(saved.getPost());
            }
        }
        for (Post p : signalPosts) {
            signalPostIds.add(p.getId());
        }

        byte[] userVector = EmbeddingService.meanNormalized(
                signalPosts.stream().map(Post::getEmbedding).toList());

        // Candidate posts = all active posts that have an embedding.
        List<Post> candidates = postRepository.findAll().stream()
                .filter(p -> p.getEmbedding() != null)
                .filter(p -> !signalPostIds.contains(p.getId()))
                .toList();

        Map<Long, Long> likeCountMap = getLikeCountMap(candidates.stream().map(Post::getId).toList());
        Map<Long, Long> commentCountMap = getCommentCountMap(candidates.stream().map(Post::getId).toList());

        List<Post> ranked = candidates.stream()
                .sorted(java.util.Comparator.comparingDouble((Post p) -> score(p, likeCountMap, commentCountMap, userVector)).reversed())
                .toList();

        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), ranked.size());
        List<Post> pageContent = start < ranked.size() ? ranked.subList(start, end) : List.of();

        List<PostListResponseDTO> content = pageContent.stream()
                .map(p -> postMapper.toListDTO(p, user, likeCountMap, commentCountMap))
                .toList();

        return new PageImpl<>(content, pageable, ranked.size());
    }

    private double score(Post p, Map<Long, Long> likes, Map<Long, Long> comments, byte[] userVector) {
        // Normalized popularity component in [0,1].
        long likesN = likes.getOrDefault(p.getId(), 0L);
        long commentsN = comments.getOrDefault(p.getId(), 0L);
        double pop = Math.tanh((p.getViewCount() + likesN * 3.0 + commentsN * 4.0) / 50.0);

        // Similarity component in [0,1].
        double sim = userVector != null ? EmbeddingService.cosine(userVector, p.getEmbedding()) : 0.0;
        double recency = Math.exp(-hoursSince(p.getCreatedAt()) / (24.0 * 14.0));

        if (userVector == null) {
            // Cold start: rely on popularity + recency.
            return 0.5 * pop + 0.3 * recency;
        }
        return 0.6 * sim + 0.25 * pop + 0.15 * recency;
    }

    private double hoursSince(java.time.LocalDateTime ts) {
        if (ts == null) return 0;
        long hours = java.time.Duration.between(ts, java.time.LocalDateTime.now()).toHours();
        return Math.max(0, hours);
    }

    // ─────────────────────────────────────────────────────────────
    // Solved / Pinned toggles
    // ─────────────────────────────────────────────────────────────
    @Transactional
    public PostDetailResponseDTO toggleSolved(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post", postId));
        securityUtils.checkOwnerOrAdmin(post);
        if (post.getType() == null || !post.getType().isSolvable()) {
            throw HttpStatusException.of(
                    "Only Discussion and Question posts can be marked as solved",
                    org.springframework.http.HttpStatus.BAD_REQUEST);
        }
        post.setSolved(!post.isSolved());
        postRepository.save(post);

        User currentUser = securityUtils.getCurrentUser();
        PostListResponseDTO postDTO = postMapper.toListDTO(post, currentUser, getLikeCountMap(List.of(post.getId())), getCommentCountMap(List.of(post.getId())));
        publisher.publishEvent(new PostUpdatedEvent(postDTO));

        return postMapper.toDetailDTO(post, currentUser);
    }

    @Transactional
    public PostDetailResponseDTO togglePinned(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post", postId));
        if (!securityUtils.isAdmin() && !securityUtils.isOwner(post)) {
            throw new PermissionDeniedException("Only admins can pin posts.");
        }
        post.setPinned(!post.isPinned());
        postRepository.save(post);
        return postMapper.toDetailDTO(post, securityUtils.getCurrentUser());
    }

    // ─────────────────────────────────────────────────────────────
    // Home sidebar stats
    // ─────────────────────────────────────────────────────────────
    public List<com.example.communityforum.dto.stats.PopularTagDTO> getPopularTags(int limit) {
        List<Object[]> rows = tagRepository.findPopularTags();
        return rows.stream()
                .limit(Math.max(0, limit))
                .map(row -> com.example.communityforum.dto.stats.PopularTagDTO.builder()
                        .name((String) row[0])
                        .count(((Number) row[1]).longValue())
                        .build())
                .collect(Collectors.toList());
    }

    public List<com.example.communityforum.dto.stats.TopContributorDTO> getTopContributors(int limit) {
        List<Object[]> rows = postRepository.findTopContributors(PageRequest.of(0, Math.max(1, limit)));
        return rows.stream()
                .map(row -> com.example.communityforum.dto.stats.TopContributorDTO.builder()
                        .id((Long) row[0])
                        .username((String) row[1])
                        .fullname((String) row[2])
                        .avatarPath((String) row[3])
                        .postCount(((Number) row[4]).longValue())
                        .build())
                .collect(Collectors.toList());
    }
}
