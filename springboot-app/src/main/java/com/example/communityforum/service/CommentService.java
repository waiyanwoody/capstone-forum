package com.example.communityforum.service;

import com.example.communityforum.dto.comment.CommentRequestDTO;
import com.example.communityforum.dto.comment.CommentResponseDTO;
import com.example.communityforum.events.CommentCreatedEvent;
import com.example.communityforum.exception.PermissionDeniedException;
import com.example.communityforum.exception.ResourceNotFoundException;
import com.example.communityforum.mapper.CommentMapper;
import com.example.communityforum.persistence.entity.Comment;
import com.example.communityforum.persistence.entity.Post;
import com.example.communityforum.persistence.entity.User;
import com.example.communityforum.persistence.repository.CommentRepository;
import com.example.communityforum.persistence.repository.PostRepository;
import com.example.communityforum.persistence.repository.UserRepository;
import com.example.communityforum.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CommentService {
    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final SecurityUtils securityUtils;
    private final ApplicationEventPublisher  publisher;
    private final CommentMapper commentMapper;

    public CommentService(CommentRepository commentRepository, PostRepository postRepository, UserRepository userRepository, CommentMapper commentMapper, SecurityUtils securityUtils,  ApplicationEventPublisher publisher) {
        this.commentRepository = commentRepository;
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.commentMapper = commentMapper;
        this.securityUtils = securityUtils;
        this.publisher = publisher;
    }

    //get all comments
    @Transactional(readOnly = true)
    public Page<CommentResponseDTO> getAllComments(Pageable pageable, Long postId) {
        if (postId != null) {
            // build a nested tree of root comments + replies for the post
            List<Comment> all = commentRepository.findByPostId(postId, Pageable.unpaged()).getContent();
            List<Comment> roots = all.stream()
                    .filter(c -> c.getParentComment() == null)
                    .collect(Collectors.toList());

            User user = securityUtils.getCurrentUser();
            List<CommentResponseDTO> dtos = roots.stream()
                    .map(root -> commentMapper.toResponseDTO(root, user, 0))
                    .collect(Collectors.toList());
            return new PageImpl<>(dtos, pageable, all.size());
        }

        Page<Comment> commentPage = commentRepository.findAll(pageable);
        User user = securityUtils.getCurrentUser();
        return commentPage.map(c -> commentMapper.toResponseDTO(c, user, 0));
    }

    // Get value from application.properties
    @Value("${comment.max-depth:2}")
    private int maxDepth;
    //create new comment
    @Transactional
    public CommentResponseDTO addComment(CommentRequestDTO dto) {

        // Get current authenticated user
        User currentUser = securityUtils.getCurrentUser();

        Post post = postRepository.findById(dto.getPostId()).orElseThrow(
                () -> new ResourceNotFoundException("post",dto.getPostId())
        );

        Comment parent = null;
        int depth = 1; // top-level comment = depth 1

        //for reply
        if(dto.getParentCommentId() != null) {
            parent = commentRepository.findById(dto.getParentCommentId()).orElseThrow(
                    () -> new ResourceNotFoundException("Parent comment",dto.getParentCommentId())
            );

            depth = calculateDepth(parent) + 1;

            if (depth > maxDepth) {
                throw new RuntimeException("Maximum reply depth (" + maxDepth + ") reached");
            }
        }

        Comment comment = Comment.builder()
                .content(dto.getContent())
                .post(post)
                .user(currentUser)
                .parentComment(parent)
                .build();

        Comment saved = commentRepository.save(comment);

        // publish event after comment created succsesfully
        if(!post.getUser().getId().equals(currentUser.getId())) {
            publisher.publishEvent(CommentCreatedEvent.builder()
                    .receiverId(post.getUser().getId())     // post owner is the receiver
                    .senderId(currentUser.getId())          // commenter
                    .postTitle(post.getTitle())     // for title of the post
                    .postId(post.getId())
                    .postSlug(post.getSlug())
                    .commentId(saved.getId())
                    .build());
        }


        System.out.println("receiver id: "+ post.getUser().getId());
        return commentMapper.toResponseDTO(saved, currentUser, 0);
    }

    // find root comments of post with nested replies
    @Transactional(readOnly = true)
    public List<CommentResponseDTO> getCommentsByPost(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        List<Comment> comments = commentRepository.findByPostAndParentCommentIsNull(post);
        User user = securityUtils.getCurrentUser();

        return comments.stream()
                .map(c -> commentMapper.toResponseDTO(c, user, 0))
                .collect(Collectors.toList());
    }

    // Mark a comment as the best/solution reply (admin or post owner)
    @Transactional
    public CommentResponseDTO markBestSolution(Long postId, Long commentId) {
        User currentUser = securityUtils.getCurrentUser();
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post", postId));

        boolean isAdmin = securityUtils.isAdmin();
        boolean isOwner = post.getUser() != null && post.getUser().getId().equals(currentUser.getId());
        if (!isAdmin && !isOwner) {
            throw new PermissionDeniedException("Only the post owner or an admin can mark a solution.");
        }

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment", commentId));

        if (!comment.getPost().getId().equals(postId)) {
            throw new IllegalArgumentException("Comment does not belong to this post.");
        }

        // clear previous best on this post
        List<Comment> all = commentRepository.findByPostId(postId, Pageable.unpaged()).getContent();
        for (Comment c : all) {
            if (c.isBest()) {
                c.setBest(false);
                commentRepository.save(c);
            }
        }

        comment.setBest(true);
        commentRepository.save(comment);

        post.setBestCommentId(commentId);
        post.setSolved(true);
        postRepository.save(post);

        return commentMapper.toResponseDTO(comment, currentUser, 0);
    }

    // calculate current depth of comment and return
    private int calculateDepth(Comment parentComment) {
        int depth = 1;
        Comment current =  parentComment;
        while(current.getParentComment() != null) {
            depth++;
            current = current.getParentComment();
        }
        return depth;
    }

    //get comment by ID
    @Transactional(readOnly = true)
    public CommentResponseDTO getCommentById(Long id) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(
                        () -> new ResourceNotFoundException("comment",id)
                );
        return commentMapper.toResponseDTO(comment, securityUtils.getCurrentUser(), 0);
    }

    //get comment by user ID
    @Transactional(readOnly = true)
    public Page<CommentResponseDTO> getCommentsByUser(Long userId, Pageable pageable) {
        Page<Comment> commentsPage = commentRepository.findByUserId(userId, pageable);
        return commentsPage.map(c -> commentMapper.toResponseDTO(c, securityUtils.getCurrentUser(), 0));
    }
    //update comment
    @Transactional
    public CommentResponseDTO updateComment(Long id, CommentRequestDTO dto) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comment", id));

        comment.setContent(dto.getContent()); // only allow updating content
        Comment updated = commentRepository.save(comment);

        return commentMapper.toResponseDTO(updated, securityUtils.getCurrentUser(), 0); // map to DTO for API response
    }

    //delete comment
    @Transactional
    public void deleteComment(Long id) {
        // Check if the comment exists
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comment", id));

        // Permanently delete it
        commentRepository.delete(comment);
    }

}

