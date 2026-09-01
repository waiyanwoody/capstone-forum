import { ApiErrorResponse, ApiHttpError, parseOrFallback } from "../http";
import { Post, ProfileStatus, User, UserPostsResponse, UserProfile } from "../types";
import { api } from "./client";

export interface ProfileRequest {
  fullname?: string;
  username?: string;
  bio?: string;
  avatar?: File | null;
}

export const getProfileByUsername = async (username: string): Promise<UserProfile> => {
  try {
    const response = await api.get(`/api/profile/${username}`);
    return response.data; // success
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

/**
 * Fetch posts by user ID
 */
export const getPostsByUserId = async (
  userId: number | string
): Promise<UserPostsResponse> => {
  try {
    const response = await api.get(`/api/user/${userId}/posts`);
    return response.data; // expected to return array of posts
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

/**
 * Fetch profile status by user ID
 */
export const getProfileStatus = async (userId: number | string): Promise<ProfileStatus> => {
  try {
    const response = await api.get(`/api/profile/${userId}/stats`);
    return response.data; // expected to return profile status object
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

export const updateProfile = async (data: ProfileRequest): Promise<User> => {
  const formData = new FormData();


    formData.append("fullname", data.fullname || "");
    formData.append("username", data.username || "");
    formData.append("bio", data.bio || "");

    // image upload
    if (data.avatar) formData.append("avatar", data.avatar);
  
    console.log("the size of image:" ,data?.avatar?.size)
  
    try {
      const response = await api.put("/api/profile/with-avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data; //  success
    } catch (error: any) {
      const data = error.response.data;
      //  Handle backend errors gracefully
      if (error.response) {
        if (data && typeof data.status === "number") {
          throw new ApiHttpError(data);
        }
        // fallback if backend response isn’t in expected format
        throw new Error(`Request failed (${error.response.status})`);
      }

      // network or unexpected error
      throw new Error("Network error or server unreachable");
    }
};
