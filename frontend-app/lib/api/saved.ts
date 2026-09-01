import { ApiHttpError } from "@/lib/http";
import { api } from "./client";
import type { Post } from "@/lib/types";

export const toggleSave = async (postId: number): Promise<boolean> => {
  try {
    const response = await api.post(`/api/saved/${postId}/toggle`);
    return Boolean(response.data?.saved);
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

export const getSavedPosts = async (): Promise<Post[]> => {
  try {
    const response = await api.get("/api/saved");
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
