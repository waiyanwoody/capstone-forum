// app/u/[username]/UserPageClient.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { UserProfile } from "@/components/user-profile";
import { UserActivity } from "@/components/user-activity";
import type { Comment, Post } from "@/lib/types";
import { getCommentsByUserId } from "@/lib/api/comments";
import { getLikedPosts } from "@/lib/api/likes";
import { getSavedPosts } from "@/lib/api/saved";
import { useFetchProfile } from "@/hooks/use-fetch-profile";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/contexts/auth-context";

export default function UserPageClient({ username }: { username: string }) {
    const { profile, posts: userPosts, status, loading } = useFetchProfile(username);
    const { user } = useAuth();

    const isCurrentUser = () => {
        return username === user?.username;
    }

    const profileUserId = profile?.id;

    const repliesQuery = useQuery<Comment[]>({
        queryKey: ["user-comments", profileUserId],
        queryFn: async () => {
            const data = await getCommentsByUserId(profileUserId!, 0, 100);
            return data.content ?? [];
        },
        enabled: !!profileUserId,
    });

    const likedPostsQuery = useQuery<Post[]>({
        queryKey: ["liked-posts", username],
        queryFn: () => getLikedPosts(),
        enabled: isCurrentUser(),
    });

    const savedPostsQuery = useQuery<Post[]>({
        queryKey: ["saved-posts", username],
        queryFn: () => getSavedPosts(),
        enabled: isCurrentUser(),
    });

    const replies = repliesQuery.data ?? [];
    const likedPosts = likedPostsQuery.data ?? [];
    const savedPosts = savedPostsQuery.data ?? [];

  return (
    <ProtectedRoute>
      <AppShell showSidebar={false}>
        <div className="max-w-4xl mx-auto space-y-6">
          <UserProfile isCurrentUser={isCurrentUser()} user={profile} stats={status} />
          <UserActivity
            userPosts={userPosts}
            replies={replies}
            likedPosts={likedPosts}
            savedPosts={savedPosts}
          />
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
