"use client";

import { useEffect, useState, useCallback } from "react";
import { Client, type IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { getAuthToken } from "@/lib/auth";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api/client";

// ---- Shared module-level presence store (single WS connection) ----
let sharedOnline = new Set<string>();
const listeners = new Set<() => void>();
let client: Client | null = null;
let tokenAtConnect: string | null = null;

function publish() {
  for (const f of listeners) f();
}

function bootstrapPresence() {
  api
    .get("/api/presence")
    .then((r) => {
      const names = (r.data?.online ?? []) as string[];
      sharedOnline = new Set([...sharedOnline, ...names]);
      publish();
    })
    .catch(() => {});
}

function ensureConnected() {
  const token = getAuthToken();
  if (!token || client) return;
  tokenAtConnect = token;

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080").replace(/\/$/, "");

  client = new Client({
    webSocketFactory: () => new SockJS(`${apiBase}/ws?token=${encodeURIComponent(token)}`),
    reconnectDelay: 5000,
    onConnect: () => {
      client!.subscribe("/topic/presence", (message: IMessage) => {
        try {
          const e = JSON.parse(message.body);
          const next = new Set(sharedOnline);
          if (e.online) next.add(e.username);
          else next.delete(e.username);
          sharedOnline = next;
          publish();
        } catch {
          // ignore
        }
      });
    },
    onWebSocketClose: () => {},
  });
  client.activate();
}

function disposeIfUnused() {
  // Keep the producer live for the page lifetime; reconnect is handled by stomp.
}

/**
 * Shared presence store: every consumer shares one STOMP connection and a single
 * Set of online usernames, so multiple components (avatars, chat) don't each open
 * their own websocket.
 */
export function usePresence() {
  const { isAuthenticated } = useAuth();
  const [online, setOnline] = useState<Set<string>>(sharedOnline);

  useEffect(() => {
    if (!isAuthenticated) return;
    const sub = () => setOnline(new Set(sharedOnline));
    listeners.add(sub);
    setOnline(new Set(sharedOnline));
    return () => {
      listeners.delete(sub);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      bootstrapPresence();
      ensureConnected();
    }
    // keep connected once started; auto-reconnect handles drops
  }, [isAuthenticated]);

  const isOnline = useCallback((username?: string | null) => !!username && sharedOnline.has(username), []);

  return { online, isOnline };
}
