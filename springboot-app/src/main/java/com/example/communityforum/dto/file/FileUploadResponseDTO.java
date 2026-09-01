package com.example.communityforum.dto.file;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class FileUploadResponseDTO {
    private String fileName;
    private String filePath;
    private String downloadUrl;
}
