"use client";
import { useQuery } from "@tanstack/react-query";
import {
  getProfileByUsername,
  getPostsByUserId,
  getProfileStatus,
} from "@/lib/api/profile";
import { ApiHttpError } from "@/lib/http";
import { toast } from "react-hot-toast";
import { Post, ProfileStatus, UserPostsResponse, UserProfile } from "@/lib/types";

export type ProfileWithPosts = {
  profile: UserProfile | null;
  posts: Post[] | null;
  status: ProfileStatus | null;
  loading: {
    profile: boolean;
    posts: boolean;
    status: boolean;
  };
};

export const useFetchProfile = (username: string) => {
  // 1️. Fetch profile by username
  const profileQuery = useQuery<UserProfile, ApiHttpError>({
    queryKey: ["profile", username],
    queryFn: () => getProfileByUsername(username),
    enabled: !!username,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  // 2️. Fetch posts using userId
  const postsQuery = useQuery<UserPostsResponse, ApiHttpError>({
    queryKey: ["userPosts", profileQuery.data?.id],
    queryFn: () => getPostsByUserId(profileQuery.data!.id),
    enabled: !!profileQuery.data?.id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  // 3️. Fetch profile status using userId
  const statusQuery = useQuery<ProfileStatus, ApiHttpError>({
    queryKey: ["profileStatus", profileQuery.data?.id],
    queryFn: () => getProfileStatus(profileQuery.data!.id),
    enabled: !!profileQuery.data?.id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  // Optional: show toast on errors
  if (profileQuery.isError && profileQuery.error) {
    toast.error(
      profileQuery.error instanceof ApiHttpError
        ? profileQuery.error.message
        : "Failed to load profile"
    );
  }
  if (postsQuery.isError && postsQuery.error) {
    toast.error(
      postsQuery.error instanceof ApiHttpError
        ? postsQuery.error.message
        : "Failed to load posts"
    );
  }
  if (statusQuery.isError && statusQuery.error) {
    toast.error(
      statusQuery.error instanceof ApiHttpError
        ? statusQuery.error.message
        : "Failed to load profile status"
    );
  }

  return {
    profile: profileQuery.data || null,
    posts: postsQuery.data || null,
    status: statusQuery.data || null,
    loading: {
      profile: profileQuery.isLoading,
      posts: postsQuery.isLoading,
      status: statusQuery.isLoading,
    },
    error: {
      profile: profileQuery.error,
      posts: postsQuery.error,
      status: statusQuery.error,
    },
    profileQuery,
    postsQuery,
    statusQuery,
  };
};
