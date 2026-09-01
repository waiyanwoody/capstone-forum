package com.example.communityforum.dto.file;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class FileUploadRequestDTO {
    private String folder; // e.g. "profile", "post"
    private MultipartFile file;
}
