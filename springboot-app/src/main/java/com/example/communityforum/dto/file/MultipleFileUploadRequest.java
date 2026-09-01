package com.example.communityforum.dto.file;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Data
public class MultipleFileUploadRequest {
    private String folder;
    private List<MultipartFile> files;
}
