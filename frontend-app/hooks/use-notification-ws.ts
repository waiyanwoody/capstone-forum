"use client";

import { useEffect, useRef } from "react";
import { Client, type IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useQueryClient } from "@tanstack/react-query";
import { getAuthToken } from "@/lib/auth";
import { useAuth } from "@/contexts/auth-context";

export function useNotificationWebSocket() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080").replace(/\/$/, "");

    const client = new Client({
      webSocketFactory: () =>
        new SockJS(`${apiBase}/ws?token=${encodeURIComponent(token)}`),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        client.subscribe(`/user/${user?.username}/queue/notifications`, (message: IMessage) => {
          JSON.parse(message.body);
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        });
      },
      onWebSocketError: () => {
        // ignore transient connection errors; client auto-reconnects
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [user?.id, user?.username, queryClient]);

  return null;
}
