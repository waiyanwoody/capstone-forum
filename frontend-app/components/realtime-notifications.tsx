"use client";

import { useNotificationWebSocket } from "@/hooks/use-notification-ws";

export function RealtimeNotifications() {
  useNotificationWebSocket();
  return null;
}
