"use client";

import { useCallback, useEffect, useState } from "react";
import { Client, type IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { getAuthToken } from "@/lib/auth";
import { useAuth } from "@/contexts/auth-context";

export type ChatMessage = {
  id?: number;
  clientId?: string;
  senderUsername: string;
  senderFullname: string;
  senderAvatar?: string | null;
  recipientUsername?: string;
  content: string;
  timestamp: string;
  own?: boolean;
};

// ---- Shared module-level chat store (single WS connection) ----
// Mirrors the presence store so the top-nav "Messages" badge can read unread
// counts in real time while reusing the same connection as the chat page.

const echoPool = new Set<string>();

let connected = false;
let sessions: Record<string, ChatMessage[]> = {};
let unreadByPeer: Record<string, number> = {};
let activePeer: string | null = null;
let typingByPeer: Record<string, boolean> = {};
const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();
let client: Client | null = null;

const listeners = new Set<() => void>();
function publish() {
  for (const f of listeners) f();
}

function makeClientId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function appendToSession(peer: string, msg: ChatMessage) {
  const list = sessions[peer] ?? [];
  sessions = { ...sessions, [peer]: [...list, msg].slice(-200) };
}

const TYPING_HIDE_MS = 3000;
const TYPING_THROTTLE_MS = 1500;
const lastTypingSent = new Map<string, number>();

function isTypingFor(peer: string): boolean {
  return !!typingByPeer[peer];
}

function receiveTyping(peer: string) {
  if (!typingByPeer[peer]) {
    typingByPeer = { ...typingByPeer, [peer]: true };
    publish();
  }
  const existing = typingTimers.get(peer);
  if (existing) clearTimeout(existing);
  typingTimers.set(
    peer,
    setTimeout(() => {
      if (typingByPeer[peer]) {
        typingByPeer = { ...typingByPeer, [peer]: false };
        publish();
      }
      typingTimers.delete(peer);
    }, TYPING_HIDE_MS),
  );
}

let latestUsername: string | null = null;
function findCurrentUsername(): string | null {
  return latestUsername;
}

export function useChatStore() {
  const { user, isAuthenticated } = useAuth();
  const [snapshot, setSnapshot] = useState({ connected, sessions, unreadByPeer, typingByPeer });

  useEffect(() => {
    const sub = () => setSnapshot({ connected, sessions, unreadByPeer, typingByPeer });
    listeners.add(sub);
    sub();
    return () => {
      listeners.delete(sub);
    };
  }, []);

  useEffect(() => {
    latestUsername = user?.username ?? null;
    if (!isAuthenticated) return;
    ensureConnected();
  }, [isAuthenticated, user?.username]);

  /** Mark all messages from a peer as read (called when their conversation is open/in view). */
  const markPeerRead = useCallback((peer: string) => {
    if (activePeer !== peer) activePeer = peer;
    if (unreadByPeer[peer]) {
      unreadByPeer = { ...unreadByPeer, [peer]: 0 };
      publish();
    }
  }, []);

  /** Clear the active peer (e.g. leaving the chat page or closing a conversation). */
  const clearActivePeer = useCallback(() => {
    activePeer = null;
  }, []);

  /** Seed a peer's session with persisted history (24h), avoiding duplicates. */
  const hydrateSession = useCallback((peer: string, history: ChatMessage[]) => {
    const existing = sessions[peer] ?? [];
    const known = new Set(existing.map((m) => m.content + m.senderUsername + m.clientId));
    const merged = [
      ...history.filter((m) => !known.has(m.content + m.senderUsername + m.clientId)),
      ...existing,
    ];
    sessions = { ...sessions, [peer]: merged.slice(-200) };
    publish();
  }, []);

  const sendToPeer = useCallback(
    (peer: string, raw: string) => {
      const content = raw.trim();
      if (!content || !isAuthenticated || !peer) return;

      const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const clientId = makeClientId();
      const optimistic: ChatMessage = {
        clientId,
        senderUsername: user?.username ?? "me",
        senderFullname: user?.fullname ?? (user?.username ?? "me"),
        senderAvatar: user?.avatar_path,
        recipientUsername: peer,
        content,
        timestamp,
        own: true,
      };

      // Register the echo so the server reply is suppressed
      echoPool.add(content + clientId);
      if (echoPool.size > 200) {
        const first = echoPool.values().next().value;
        if (typeof first === "string") echoPool.delete(first);
      }

      appendToSession(peer, optimistic);
      setTimeout(publish, 0);

      try {
        client?.publish({
          destination: "/app/chat.send",
          body: JSON.stringify({ content, clientId, recipientUsername: peer }),
        });
      } catch {
        // connection may be racing; the optimistic message keeps UX snappy
      }
    },
    [user?.username, user?.fullname, user?.avatar_path, isAuthenticated],
  );

  /** Publish a throttled "typing..." signal to a peer (rate-limited so we don't spam). */
  const sendTyping = useCallback(
    (peer: string) => {
      if (!isAuthenticated || !peer || !connected) return;
      const now = Date.now();
      if ((lastTypingSent.get(peer) ?? 0) + TYPING_THROTTLE_MS > now) return;
      lastTypingSent.set(peer, now);
      try {
        client?.publish({
          destination: "/app/chat.typing",
          body: JSON.stringify({ recipientUsername: peer }),
        });
      } catch {
        // ignore transient connection issues
      }
    },
    [isAuthenticated, connected],
  );

  const unreadTotal = Object.values(snapshot.unreadByPeer).reduce((a, b) => a + b, 0);
  const connectedNow = snapshot.connected;

  return {
    connected: connectedNow,
    sessions: snapshot.sessions,
    unreadByPeer: snapshot.unreadByPeer,
    typingByPeer: snapshot.typingByPeer,
    isTypingFor,
    unreadTotal,
    sendToPeer,
    sendTyping,
    hydrateSession,
    markPeerRead,
    clearActivePeer,
  };
}

function ensureConnected() {
  const token = getAuthToken();
  if (!token || client) return;
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080").replace(/\/$/, "");

  client = new Client({
    webSocketFactory: () => new SockJS(`${apiBase}/ws?token=${encodeURIComponent(token)}`),
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    onConnect: () => {
      connected = true;
      publish();
      client!.subscribe("/user/queue/messages", (message: IMessage) => {
        try {
          const body = JSON.parse(message.body) as ChatMessage;
          const me = findCurrentUsername();
          const peer = body.senderUsername === me ? body.recipientUsername : body.senderUsername;
          if (!peer) return;

          const own = body.senderUsername === me;
          const withFlag: ChatMessage = { ...body, own };
          const key = body.content + body.clientId;

          // Suppress the echo of our own optimistically-rendered message
          if (own && echoPool.has(key)) {
            echoPool.delete(key);
            return;
          }

          appendToSession(peer, withFlag);

          // Count as unread only if it's from someone else AND we're not viewing that conversation
          if (!own && activePeer !== peer) {
            unreadByPeer = { ...unreadByPeer, [peer]: (unreadByPeer[peer] ?? 0) + 1 };
          }

          publish();
        } catch {
          // ignore malformed payload
        }
      });

      // Realtime "typing..." indicator from the peer (e.g. "<user> is typing...")
      client!.subscribe("/user/queue/typing", (message: IMessage) => {
        try {
          const body = JSON.parse(message.body);
          const peer = body?.senderUsername;
          if (typeof peer === "string" && peer) receiveTyping(peer);
        } catch {
          // ignore malformed payload
        }
      });
    },
    onDisconnect: () => {
      connected = false;
      publish();
    },
    onWebSocketClose: () => {
      connected = false;
      publish();
    },
    onWebSocketError: () => {
      // auto-reconnect; connection state recovers on next connect
    },
  });

  client.activate();
}
