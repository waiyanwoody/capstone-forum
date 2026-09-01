import { ApiHttpError } from "@/lib/http";
import { api } from "./client";
import type { Post } from "@/lib/types";

export type LikeTargetType = "POST" | "COMMENT";

export type LikeToggleResult = {
  liked: boolean;
  likeCount: number;
};

export const toggleLike = async (
  targetId: number,
  targetType: LikeTargetType
): Promise<LikeToggleResult> => {
  try {
    const response = await api.post("/api/likes/toggle", {
      targetId,
      targetType,
    });
    const data = response.data;
    return {
      liked: Boolean(data?.liked),
      likeCount: Number(data?.likeCount ?? 0),
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

export const getLikedPosts = async (): Promise<Post[]> => {
  try {
    const response = await api.get("/api/posts/liked");
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

