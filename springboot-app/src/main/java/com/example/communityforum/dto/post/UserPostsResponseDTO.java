package com.example.communityforum.dto.post;

import com.example.communityforum.dto.user.UserSummaryDTO;
import lombok.*;
import java.util.List;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPostsResponseDTO {
    private UserSummaryDTO author;
    private List<PostSummaryDTO> posts;
    private int page;
    private int pageSize;
    private long totalPosts;
}
