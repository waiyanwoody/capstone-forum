package com.example.communityforum.dto.stats;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PopularTagDTO {
    private String name;
    private long count;
}
