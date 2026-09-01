package com.example.communityforum.security;

import com.example.communityforum.exception.EmailNotVerifiedException;
import com.example.communityforum.exception.PermissionDeniedException;
import com.example.communityforum.persistence.entity.User;
import com.example.communityforum.persistence.repository.UserRepository;

import io.jsonwebtoken.Claims;

import java.util.HashMap;

import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

@Component("securityUtils")
public class SecurityUtils {
    private final UserRepository userRepository;

    public SecurityUtils(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new SecurityException("User not authenticated");
        }

        Object principal = authentication.getPrincipal();

        if (principal instanceof UserDetails) {
            String username = ((UserDetails) principal).getUsername();
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new SecurityException("User not found in database"));
            return user.getId();
        }

        throw new SecurityException("Unable to extract user ID from authentication");
    }

    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AuthenticationCredentialsNotFoundException("User not authenticated");
        }

        Object principal = authentication.getPrincipal();

        if (principal instanceof UserDetails) {
            String username = ((UserDetails) principal).getUsername();
            return userRepository.findByUsername(username)
                    .orElseThrow(() -> new SecurityException("User not found in database"));
        }

        throw new SecurityException("Unable to extract user from authentication");
    }

    public String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication.getName();
    }

    /**
     * Generic owner check for any entity that has a getUser() method
     */
    public boolean isOwner(Object entity) {
        if (entity == null) return false;

        User currentUser = getCurrentUser();

        try {
            // Try to call getUser() using reflection
            User owner = (User) entity.getClass().getMethod("getUser").invoke(entity);
            return owner != null && owner.getId().equals(currentUser.getId());
        } catch (Exception e) {
            // Method not found or invocation failed
            return false;
        }
    }

    /**
     * Check if current user is admin or owner of entity
     */
    public void checkOwnerOrAdmin(Object entity) {
        if (!isAdmin() && !isOwner(entity)) {
            throw new PermissionDeniedException("You do not have permission to perform this action.");
        }
    }

    public boolean isAdmin() {
        User currentUser = getCurrentUser();
        return currentUser.getRole().equals("ADMIN");
    }

    // Check if current user's email is verified
    public boolean isVerified() {
        User currentUser = getCurrentUser();
        return currentUser.isEmailVerified();
    }

    public void checkEmailVerified(User user) {
        if (!user.isEmailVerified()) {
            throw new EmailNotVerifiedException();
        }
    }

    public void requireVerified() {
        if (!isVerified()) {
            throw new PermissionDeniedException("Email not verified. Please verify your email to access this feature.");
        }
    }

}