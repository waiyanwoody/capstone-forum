"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageSquare, Send, Loader2, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ActiveAvatar } from "@/components/active-avatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useChatStore, type ChatMessage } from "@/hooks/use-chat";
import { useAuth } from "@/contexts/auth-context";
import { usePresence } from "@/hooks/use-presence";
import { getUserAvatar } from "@/lib/utils";
import { getFriends, type UserResponse } from "@/lib/api/follow";
import { api } from "@/lib/api/client";

export default function MessagesPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { connected, sessions, sendToPeer, hydrateSession, markPeerRead, clearActivePeer } = useChatStore();
  const { isOnline } = usePresence();
  const [friends, setFriends] = useState<UserResponse[]>([]);
  const [selected, setSelected] = useState<UserResponse | null>(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    getFriends()
      .then((f) => {
        setFriends(f);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isLoading, isAuthenticated, router]);

  // Load 24h history when a conversation opens
  useEffect(() => {
    if (!selected) {
      clearActivePeer();
      return;
    }
    markPeerRead(selected.username);
    let cancelled = false;
    api
      .get(`/api/chat/${selected.username}/history`)
      .then((r) => {
        if (cancelled) return;
        const raw = (r.data ?? []) as ChatMessage[];
        const me = user?.username;
        const history: ChatMessage[] = raw.map((m) => ({ ...m, own: m.senderUsername === me }));
        hydrateSession(selected.username, history);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [selected, hydrateSession, user?.username, markPeerRead, clearActivePeer]);

  const messages = selected ? sessions[selected.username] ?? [] : [];

  // Auto-scroll to newest message when it changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, selected]);

  // Focus composer when conversation opens
  useEffect(() => {
    if (selected) {
      const t = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [selected]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !draft.trim()) return;
    sendToPeer(selected.username, draft);
    setDraft("");
  };

  const activePeer = (m: ChatMessage) => (m.own ? m.recipientUsername : m.senderUsername);

  return (
    <AppShell showSidebar={false}>
      <div className="-mx-4 -mt-8 sm:-mx-6 lg:-mx-8">
        <div className="flex h-[calc(100dvh-4rem)] flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
          <div>
            <h1 className="flex items-center gap-2 text-lg font-semibold">
              <MessageSquare className="h-5 w-5" />
              Messages
            </h1>
            <p className={`text-xs ${connected ? "text-emerald-500" : "text-muted-foreground"}`}>
              {connected ? "Online · live" : "Connecting..."}
            </p>
          </div>
          {selected && (
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden"
              onClick={() => setSelected(null)}
              aria-label="Back to conversations"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Conversation list (friends) */}
          <aside
            className={`${
              selected ? "hidden" : "flex"
            } w-full flex-col border-r border-border sm:flex sm:w-72 lg:w-80`}
          >
            <div className="flex items-center gap-2 border-b border-border px-4 py-3 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Friends · start a conversation</span>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : friends.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-sm text-muted-foreground">
                  <Users className="h-8 w-8 opacity-40" />
                  <p>No friends yet.</p>
                  <p className="text-xs">
                    Follow each other to become friends, then message here.
                  </p>
                </div>
              ) : (
                friends.map((friend) => {
                  const isActive = selected?.username === friend.username;
                  const lastMsg = sessions[friend.username]?.at(-1);
                  return (
                    <button
                      key={friend.id}
                      onClick={() => setSelected(friend)}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                        isActive
                          ? "bg-primary/10"
                          : "hover:bg-muted/60"
                      }`}
                    >
                      <ActiveAvatar
                        username={friend.username}
                        fullname={friend.fullname}
                        avatarPath={friend.avatar_path}
                        className="h-10 w-10"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                          {friend.fullname}
                          {isOnline(friend.username) && (
                            <span className="inline-flex h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" aria-label="Online" />
                          )}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          @{friend.username}
                        </p>
                      </div>
                      {lastMsg && (
                        <span className="flex-shrink-0 text-[11px] text-muted-foreground">
                          {lastMsg.timestamp}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* Chat pane */}
          <section
            className={`${
              selected ? "flex" : "hidden"
            } min-w-0 flex-1 flex-col sm:flex`}
          >
            {!selected ? (
              <div className="hidden flex-1 flex-col items-center justify-center gap-3 text-center text-muted-foreground sm:flex">
                <MessageSquare className="h-12 w-12 opacity-30" />
                <p className="text-sm">Select a friend to start chatting</p>
                <p className="text-xs">Messages are session-only and disappear when you leave.</p>
              </div>
            ) : (
              <>
                {/* Pane header */}
                <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="sm:hidden"
                    onClick={() => setSelected(null)}
                    aria-label="Back"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <ActiveAvatar
                    username={selected.username}
                    fullname={selected.fullname}
                    avatarPath={selected.avatar_path}
                    className="h-9 w-9"
                  />
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                      {selected.fullname}
                      {isOnline(selected.username) && (
                        <span className="inline-flex h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" aria-label="Online" />
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">@{selected.username}</p>
                  </div>
                </div>

                {/* Messages */}
                <div ref={scrollRef} data-chat-scroll className="flex-1 space-y-3 overflow-y-auto bg-muted/20 p-4">
                  {messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                      <MessageSquare className="h-8 w-8 opacity-40" />
                      <p>Say hi to {selected.fullname}!</p>
                      <p className="text-xs">Messages disappear when you leave.</p>
                    </div>
                  ) : (
                    messages.map((msg, i) => (
                      <ChatBubble key={`${activePeer(msg)}-${msg.clientId ?? msg.timestamp}-${i}`} msg={msg} />
                    ))
                  )}
                </div>

                {/* Composer */}
                <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border bg-card p-3">
                  <input
                    ref={inputRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={`Message ${selected.fullname}...`}
                    maxLength={1000}
                    className="h-10 flex-1 rounded-full border border-border bg-muted px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="h-10 w-10 flex-shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    disabled={!draft.trim()}
                    aria-label="Send message"
                  >
                    {connected ? <Send className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
                  </Button>
                </form>
              </>
            )}
          </section>
        </div>
      </div>
      </div>
    </AppShell>
  );
}

function ChatBubble({ msg }: { msg: ChatMessage }) {
  const avatarUrl = msg.senderAvatar ? getUserAvatar(msg.senderAvatar) : null;
  const initial = (msg.senderFullname || msg.senderUsername).charAt(0).toUpperCase();

  return (
    <div className={`flex items-end gap-2 ${msg.own ? "flex-row-reverse" : ""}`}>
      <Avatar className={`h-7 w-7 flex-shrink-0 ${msg.own ? "hidden" : ""}`}>
        <AvatarImage src={avatarUrl ?? undefined} alt={msg.senderUsername} />
        <AvatarFallback className="text-[10px]">{initial}</AvatarFallback>
      </Avatar>

      <div className={`max-w-[75%] ${msg.own ? "items-end" : ""}`}>
        {!msg.own && (
          <p className="mb-0.5 px-1 text-[10px] font-medium text-muted-foreground">
            {msg.senderUsername}
          </p>
        )}
        <div
          className={`rounded-2xl px-3 py-2 text-sm break-words ${
            msg.own
              ? "rounded-br-sm bg-primary text-primary-foreground"
              : "rounded-bl-sm bg-card border border-border text-foreground"
          }`}
        >
          {msg.content}
        </div>
        <p className={`mt-0.5 px-1 text-[10px] text-muted-foreground ${msg.own ? "text-right" : ""}`}>
          {msg.timestamp}
        </p>
      </div>
    </div>
  );
}
