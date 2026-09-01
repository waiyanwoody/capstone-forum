package com.example.communityforum.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import org.springframework.web.util.UriUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;

@Service
public class FileStorageService {
    @Value("${file.upload-base-dir}")
    private String uploadBaseDir;

    // Upload file and return URL-encoded relative path (avatars/xxx%5D.jpg)
    public String upload(MultipartFile file, String folder) {
        try {
            Path uploadPath = Paths.get(uploadBaseDir, folder);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            String original = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
            // keep raw filename on disk
            String safeFileName = System.currentTimeMillis() + "_" + original.replaceAll("\\s+", "_");
            Path filePath = uploadPath.resolve(safeFileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // store ENCODED relative path so it matches URL (encode each segment)
            String encoded = encodePath(folder + "/" + safeFileName);
            return encoded;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file: " + e.getMessage(), e);
        }
    }

    // Build URL using already-encoded relative path (no re-encode)
    public String buildFileUrl(String relativePathEncoded) {
        String normalized = relativePathEncoded.replace("\\", "/");
        return ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/uploads/")
                .path(normalized)
                .build(true) // keep encoded as-is
                .toUriString();
    }

    // Delete file by decoding stored relative path back to filesystem path
    public void deleteFile(String relativePathEncoded) {
        try {
            String decoded = UriUtils.decode(relativePathEncoded, StandardCharsets.UTF_8);
            Path path = Paths.get(uploadBaseDir, decoded);
            Files.deleteIfExists(path);
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete file: " + relativePathEncoded, e);
        }
    }

    private String encodePath(String path) {
        String[] parts = path.replace("\\", "/").split("/");
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < parts.length; i++) {
            if (i > 0) sb.append('/');
            sb.append(UriUtils.encodePathSegment(parts[i], StandardCharsets.UTF_8));
        }
        return sb.toString();
    }
}