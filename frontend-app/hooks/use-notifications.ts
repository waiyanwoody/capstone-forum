"use client";

import { useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { ApiHttpError } from "@/lib/http";
import { getNotificationsByUserId } from "@/lib/api/notifications";
import type { Notification } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";

export function useNotifications() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery<Notification[], ApiHttpError>({
    queryKey: ["notifications", userId],
    queryFn: () => getNotificationsByUserId(userId!),
    enabled: !!userId,
    refetchOnWindowFocus: false,
    onError: (error) => {
      if (error instanceof ApiHttpError) {
        toast.error(error.message || "Failed to load notifications");
      }
    },
  });
}
