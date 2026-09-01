import type { PaginatedResponse } from "@/lib/types";
import type { Comment, CreateCommentPayload } from "@/lib/types";
import { ApiHttpError } from "@/lib/http";
import { api } from "./client";

export const createComment = async (
  payload: CreateCommentPayload
): Promise<Comment> => {
  try {
    const response = await api.post("/api/comments", payload);
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

export const getComments = async (
  page?: number,
  pageSize?: number,
  postId?: number
): Promise<PaginatedResponse<Comment>> => {
  try {
    const params = new URLSearchParams();

    if (page !== undefined) {
      params.append("page", page.toString());
    }

    if (pageSize !== undefined) {
      params.append("size", pageSize.toString());
    }

    if (postId !== undefined) {
      params.append("postId", postId.toString());
    }

    const response = await api.get(`/api/comments?${params.toString()}`);

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



export const getCommentsByUserId = async (
  userId: number | string,
  page = 0,
  pageSize = 100
): Promise<PaginatedResponse<Comment>> => {
  try {
    const params = new URLSearchParams();
    if (page !== undefined) params.append("page", page.toString());
    if (pageSize !== undefined) params.append("size", pageSize.toString());

    const response = await api.get(`/api/comments/user/${userId}?${params.toString()}`);
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

export const getCommentsByPostId = async (
  postId: number
): Promise<PaginatedResponse<Comment>> => {
  try {
    const response = await api.get("/api/comments", {
      params: {
        postId,
        page: 0,
        size: 100,
        sort: "createdAt,ASC",
      },
    });

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

export const updateComment = async (
  id: number,
  payload: CreateCommentPayload
): Promise<Comment> => {
  try {
    const response = await api.put(`/api/comments/${id}`, payload);
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

export const deleteComment = async (id: number): Promise<void> => {
  try {
    await api.delete(`/api/comments/${id}`);
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

export const markBestSolution = async (
  commentId: number,
  postId: number
): Promise<Comment> => {
  try {
    const response = await api.post(`/api/comments/${commentId}/mark-best`, null, {
      params: { postId },
    });
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

