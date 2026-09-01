import { ApiHttpError } from "@/lib/http";
import { api } from "./client";
import type { Notification } from "@/lib/types";

export const getNotificationsByUserId = async (
  userId: number | string
): Promise<Notification[]> => {
  try {
    const response = await api.get(`/api/notifications/${userId}`);
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
