import { ApiHttpError } from "@/lib/http";
import { api } from "./client";

export interface ToggleFollowResponse {
  followingId: number;
  followed: boolean;
  isFriend: boolean;
}

export interface UserResponse {
  id: number;
  fullname: string;
  username: string;
  email: string;
  bio?: string;
  avatar_path?: string;
  role: string;
  created_at: string;
  email_verified: boolean;
  email_verified_at?: string;
}

// Follow
export const followUser = async (
  followingId: number
): Promise<string> => {
  try {
    const response = await api.post(
      `/api/follows/${followingId}`
    );

    return response.data;
  } catch (error: any) {
    const data = error.response?.data;

    if (error.response) {
      if (data && typeof data.status === "number") {
        throw new ApiHttpError(data);
      }

      throw new Error(
        `Request failed (${error.response.status})`
      );
    }

    throw new Error("Network error or server unreachable");
  }
};

// Unfollow
export const unfollowUser = async (
  followingId: number
): Promise<string> => {
  try {
    const response = await api.delete(
      `/api/follows/${followingId}`
    );

    return response.data;
  } catch (error: any) {
    const data = error.response?.data;

    if (error.response) {
      if (data && typeof data.status === "number") {
        throw new ApiHttpError(data);
      }

      throw new Error(
        `Request failed (${error.response.status})`
      );
    }

    throw new Error("Network error or server unreachable");
  }
};

// Toggle
export const toggleFollow = async (
  followingId: number
): Promise<ToggleFollowResponse> => {
  try {
    const response = await api.post(
      `/api/follows/${followingId}/toggle`
    );

    return response.data;
  } catch (error: any) {
    const data = error.response?.data;

    if (error.response) {
      if (data && typeof data.status === "number") {
        throw new ApiHttpError(data);
      }

      throw new Error(
        `Request failed (${error.response.status})`
      );
    }

    throw new Error("Network error or server unreachable");
  }
};

// Followers
export const getFollowers = async (
  userId: number
): Promise<UserResponse[]> => {
  try {
    const response = await api.get(
      `/api/follows/followers/${userId}`
    );

    return response.data;
  } catch (error: any) {
    const data = error.response?.data;

    if (error.response) {
      if (data && typeof data.status === "number") {
        throw new ApiHttpError(data);
      }

      throw new Error(
        `Request failed (${error.response.status})`
      );
    }

    throw new Error("Network error or server unreachable");
  }
};

// Following
export const getFollowing = async (
  userId: number
): Promise<UserResponse[]> => {
  try {
    const response = await api.get(
      `/api/follows/following/${userId}`
    );

    return response.data;
  } catch (error: any) {
    const data = error.response?.data;

    if (error.response) {
      if (data && typeof data.status === "number") {
        throw new ApiHttpError(data);
      }

      throw new Error(
        `Request failed (${error.response.status})`
      );
    }

    throw new Error("Network error or server unreachable");
  }
};

// Friends (mutual follows) of the current user — the chat conversation list
export const getFriends = async (): Promise<UserResponse[]> => {
  try {
    const response = await api.get(`/api/follows/friends`);
    return response.data;
  } catch (error: any) {
    const data = error.response?.data;

    if (error.response) {
      if (data && typeof data.status === "number") {
        throw new ApiHttpError(data);
      }
      throw new Error(`Request failed (${error.response.status})`);
    }
    throw new Error("Network error or server unreachable");
  }
};