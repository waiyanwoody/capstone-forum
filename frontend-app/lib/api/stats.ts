import { ApiHttpError } from "@/lib/http";
import { api } from "./client";

export type PopularTag = {
  name: string;
  count: number;
};

export type TopContributor = {
  id: number;
  username: string;
  fullname: string;
  avatarPath: string;
  postCount: number;
};

export const getPopularTags = async (limit = 10): Promise<PopularTag[]> => {
  try {
    const response = await api.get("/api/stats/popular-tags", { params: { limit } });
    return response.data;
  } catch (error: any) {
    const data = error.response?.data;
    if (error.response) {
      if (data && typeof data.status === "number") throw new ApiHttpError(data);
      throw new Error(`Request failed (${error.response.status})`);
    }
    throw new Error("Network error or server unreachable");
  }
};

export const getTopContributors = async (limit = 5): Promise<TopContributor[]> => {
  try {
    const response = await api.get("/api/stats/top-contributors", { params: { limit } });
    return response.data;
  } catch (error: any) {
    const data = error.response?.data;
    if (error.response) {
      if (data && typeof data.status === "number") throw new ApiHttpError(data);
      throw new Error(`Request failed (${error.response.status})`);
    }
    throw new Error("Network error or server unreachable");
  }
};
