package com.example.communityforum.service;

import org.springframework.web.multipart.MultipartFile;

public interface StorageService {
    String upload(MultipartFile file, String folder);

    String buildFileUrl(String relativePathEncoded);

    void deleteFile(String relativePathEncoded);
}
