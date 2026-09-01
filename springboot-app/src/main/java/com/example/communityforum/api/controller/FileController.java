package com.example.communityforum.api.controller;

import com.example.communityforum.dto.file.FileUploadRequestDTO;
import com.example.communityforum.dto.file.FileUploadResponseDTO;
import com.example.communityforum.dto.file.MultipleFileUploadRequest;
import com.example.communityforum.exception.FileValidationException;
import com.example.communityforum.service.FileStorageService;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Tag(name = "File Management", description = "Endpoints for uploading and managing files")
@RestController
@RequestMapping("/api/files")
public class FileController {

    @Autowired
    private FileStorageService fileStorageService;

    public FileController(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    @Value("${spring.servlet.multipart.max-file-size:10MB}")
    private String maxFileSize;

    private long maxFileSizeBytes;

    @PostConstruct
    public void init() {
        // Convert "10MB" to bytes
        maxFileSizeBytes = parseSizeToBytes(maxFileSize);
    }

    /**
     * Upload a single file (e.g., avatar, post image)
     */
    @PostMapping("/upload")
    public ResponseEntity<FileUploadResponseDTO> uploadFile(@ModelAttribute FileUploadRequestDTO request) {
//        ResponseEntity<String> validationError = validateFile(request.getFile()); // throw exception if invalid
        FileUploadResponseDTO response = processFileUpload(request.getFile(),request.getFolder());
        return ResponseEntity.ok(response);
    }

    /**
     * Upload multiple files (e.g., multiple post images)
     */
    @PostMapping("/upload/multiple")
    public ResponseEntity<List<FileUploadResponseDTO>> uploadMultipleFile(@ModelAttribute MultipleFileUploadRequest request) {
        List<FileUploadResponseDTO> response =  request.getFiles().stream()
                .map(file -> processFileUpload(file,request.getFolder()))
                .toList();

        return ResponseEntity.ok(response);
    }

    /**
     * Helper method to handle upload and response creation.
     */
    private FileUploadResponseDTO processFileUpload(MultipartFile file, String folder) {
        String savedPath = fileStorageService.upload(file,folder);
        String fileName = extractFileName(savedPath);
        String downloadUrl = fileStorageService.buildFileUrl(savedPath);

        return new FileUploadResponseDTO(fileName, savedPath, downloadUrl);
    }

    private String extractFileName(String path){
        return path.substring(path.lastIndexOf('/') + 1);
    }

    private ResponseEntity<String> validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new FileValidationException("File is empty");
        }

        if (file.getSize() > maxFileSizeBytes) {
            throw new FileValidationException("File size exceeds " + maxFileSize);
        }

        String contentType = file.getContentType();
        if (!(contentType.equals("image/jpeg") || contentType.equals("image/png") || contentType.equals("image/gif"))) {
            throw new FileValidationException("Only JPEG, PNG, and GIF are allowed");
        }

        String fileName = file.getOriginalFilename();
        if (!fileName.matches(".*\\.(jpg|jpeg|png|gif)$")) {
            throw new FileValidationException("Invalid file extension");
        }

        return null;
    }


    // Convert "10MB" or "5KB" to bytes
    private long parseSizeToBytes(String size) {
        size = size.toUpperCase().trim();
        if (size.endsWith("KB")) {
            return Long.parseLong(size.replace("KB", "")) * 1024;
        } else if (size.endsWith("MB")) {
            return Long.parseLong(size.replace("MB", "")) * 1024 * 1024;
        } else if (size.endsWith("GB")) {
            return Long.parseLong(size.replace("GB", "")) * 1024 * 1024 * 1024;
        } else {
            return Long.parseLong(size);
        }
    }

}
