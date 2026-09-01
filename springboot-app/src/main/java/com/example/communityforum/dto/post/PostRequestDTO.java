package com.example.communityforum.dto.post;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter@Setter
@Data
public class PostRequestDTO {

    @NotBlank(message = "title is required")
    private String title;

    @NotBlank(message = "content cannot be blank")
    private String content;

    private List<String> tags;

}
