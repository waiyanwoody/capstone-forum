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

export const getUnreadCount = async (userId: number | string): Promise<number> => {
  try {
    const response = await api.get(`/api/notifications/${userId}/unread-count`);
    return response.data;
  } catch (error: any) {
    throw new Error("Failed to load unread notification count");
  }
};

export const markAllNotificationsRead = async (
  userId: number | string
): Promise<number> => {
  try {
    const response = await api.post(`/api/notifications/${userId}/read-all`);
    return response.data;
  } catch (error: any) {
    throw new Error("Failed to mark notifications as read");
  }
};

export const markNotificationRead = async (
  notificationId: number | string
): Promise<number> => {
  try {
    const response = await api.post(`/api/notifications/${notificationId}/read`);
    return response.data;
  } catch (error: any) {
    throw new Error("Failed to mark notification as read");
  }
};
