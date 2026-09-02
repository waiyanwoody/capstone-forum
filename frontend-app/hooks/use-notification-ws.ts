"use client";

import { useEffect, useRef } from "react";
import { Client, type IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useQueryClient, type QueryClient, type InfiniteData } from "@tanstack/react-query";
import { getAuthToken } from "@/lib/auth";
import { useAuth } from "@/contexts/auth-context";
import type { Post, PaginatedResponse } from "@/lib/types";

function handleNewPost(queryClient: QueryClient, post: Post) {
  if (!post?.id) return;

  const queries = queryClient.getQueryCache().findAll({ queryKey: ["posts"] });
  for (const query of queries) {
    const key = query.queryKey as [string, number, string];
    if (key[0] !== "posts" || key.length < 3) continue;

    const filter = key[2];
    if (filter === "following") continue;
    if (filter === "solved" && !post.isSolved) continue;

    queryClient.setQueryData<InfiniteData<PaginatedResponse<Post>> | undefined>(
      query.queryKey,
      (old) => {
        if (!old?.pages?.length) return old;
        const page0 = old.pages[0];
        if (!page0 || page0.content.some((p) => p.id === post.id)) return old;
        const pages = old.pages.map((p) => ({ ...p }));
        pages[0] = {
          ...page0,
          content: [post, ...page0.content],
          numberOfElements: page0.content.length + 1,
          empty: false,
          last: false,
        };
        return { ...old, pages };
      }
    );
  }

  // Following tab is author-filtered server-side; refetch so the new post appears only if the author is followed
  queryClient.invalidateQueries({ queryKey: ["following-posts"] });
}

function handlePostUpdate(queryClient: QueryClient, updated: Post) {
  if (!updated?.id) return;

  const queries = queryClient.getQueryCache().findAll({ queryKey: ["posts"] });
  for (const query of queries) {
    const key = query.queryKey as [string, number, string];
    if (key[0] !== "posts" || key.length < 3) continue;

    queryClient.setQueryData<InfiniteData<PaginatedResponse<Post>> | undefined>(
      query.queryKey,
      (old) => {
        if (!old?.pages?.length) return old;
        let changed = false;
        const pages = old.pages.map((p) => ({
          ...p,
          content: p.content.map((post) => {
            if (post.id === updated.id) {
              changed = true;
              return { ...post, ...updated };
            }
            return post;
          }),
        }));
        return changed ? { ...old, pages } : old;
      }
    );

    // Solved-filtered lists derive membership server-side; refetch so toggles move posts in/out
    if (key[2] === "solved") {
      queryClient.invalidateQueries({ queryKey: query.queryKey });
    }
  }

  // Following tab is server-filtered (author + solved badge)
  queryClient.invalidateQueries({ queryKey: ["following-posts"] });
}

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
        client.subscribe(`/user/queue/notifications`, (message: IMessage) => {
          JSON.parse(message.body);
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
          queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
        });

        client.subscribe(`/topic/new-posts`, (message: IMessage) => {
          try {
            const post = JSON.parse(message.body) as Post;
            handleNewPost(queryClient, post);
          } catch {
            // ignore malformed payload
          }
        });

        client.subscribe(`/topic/post-updates`, (message: IMessage) => {
          try {
            const post = JSON.parse(message.body) as Post;
            handlePostUpdate(queryClient, post);
          } catch {
            // ignore malformed payload
          }
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
