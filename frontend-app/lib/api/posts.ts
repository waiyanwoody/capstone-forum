import type { PaginatedResponse, Post, PostDetail } from "@/lib/types";
import { ApiHttpError } from "@/lib/http";
import { api } from "./client";
import { CreatePostPayload } from "@/hooks/use-create-post";

export const createPost = async (payload: CreatePostPayload): Promise<Post> => {
  try {
    const response = await api.post("/api/posts", payload);
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

/**
 * Fetch posts from backend.
 * Supports optional pagination: /api/posts?page=1&size=10
 * Supports optional filters: solved, pinned, trending
 */
export const getPosts = async (
  page?: number,
  pageSize?: number,
  options?: { solved?: boolean; pinned?: boolean }
): Promise<PaginatedResponse<Post>> => {
  try {
    const params = new URLSearchParams();
    if (page !== undefined && page !== null) params.append("page", page.toString());
    if (pageSize) params.append("size", pageSize.toString());
    if (options?.solved) params.append("solved", "true");
    if (options?.pinned) params.append("pinned", "true");

    const response = await api.get(`/api/posts?${params.toString()}`);
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

export const getRecommendedPosts = async (
  page?: number,
  pageSize?: number
): Promise<PaginatedResponse<Post>> => {
  try {
    const params = new URLSearchParams();
    if (page !== undefined && page !== null) params.append("page", page.toString());
    if (pageSize) params.append("size", pageSize.toString());

    const response = await api.get(`/api/posts/recommended?${params.toString()}`);
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

export const getPostsByFollowing = async (): Promise<Post[]> => {
  try {
    const response = await api.get("/api/posts/following");
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

export const getPostById = async (id: number): Promise<Post> => {
  try {
    const response = await api.get(`/api/posts/${id}`);
    const data = response.data;

    return {
      id: data.id,
      title: data.title,
      slug: data.slug,
      content: data.content,
      tags: data.tags ?? [],
      author: {
        id: data.author.id,
        username: data.author.username,
        fullname: data.author.fullname,
        avatar_path: data.author.avatar_path,
      },
      createdAt: data.createdAt,
      likeCount: data.likeCount,
      liked: data.liked,
      commentCount: 0,
      isSaved: false,
    };
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

export const updatePost = async (
  id: number,
  payload: CreatePostPayload
): Promise<Post> => {
  try {
    const response = await api.put(`/api/posts/${id}`, payload);
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

export const deletePost = async (id: number): Promise<void> => {
  try {
    await api.delete(`/api/posts/${id}`);
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

export const getPostBySlug = async (slug: string): Promise<Post> => {
  try {
    const response = await api.get(`/api/posts/slug/${slug}`);
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

export const toggleSolved = async (id: number): Promise<Post> => {
  try {
    const response = await api.post(`/api/posts/${id}/solved`);
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
