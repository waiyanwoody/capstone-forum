package com.example.communityforum.events;

import lombok.*;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NewFollowerEvent {
    Long followerId;  // who followed
    Long followingId;  // who got followed (receiver)
}