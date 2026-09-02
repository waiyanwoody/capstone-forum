"use client";

import { useQuery } from "@tanstack/react-query";
import { getUnreadCount } from "@/lib/api/notifications";
import { useAuth } from "@/contexts/auth-context";

export function useUnreadCount() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery<number>({
    queryKey: ["notifications-unread", userId],
    queryFn: () => getUnreadCount(userId!),
    enabled: !!userId,
    refetchOnWindowFocus: true,
    staleTime: 10_000,
  });
}
