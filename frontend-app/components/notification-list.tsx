"use client"

import { useState } from "react"
import Link from "next/link"
import { MessageSquare, ThumbsUp, AtSign, CheckCircle2, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Notification } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"

type NotificationListProps = {
  notifications: Notification[]
}

export function NotificationList({ notifications }: NotificationListProps) {
  const [readIds, setReadIds] = useState<Set<string | number>>(new Set())

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "REPLY":
      case "COMMENT":
        return <MessageSquare className="h-5 w-5 text-primary" />
      case "LIKE":
        return <ThumbsUp className="h-5 w-5 text-primary" />
      case "MENTION":
        return <AtSign className="h-5 w-5 text-primary" />
      case "FOLLOW":
        return <UserPlus className="h-5 w-5 text-primary" />
      default:
        return null
    }
  }

  const notificationContent = notifications.map((notification) => {
    const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })
    const isRead = notification.read || readIds.has(notification.id)

    return (
      <div
        key={notification.id}
        className={`block p-4 rounded-lg border transition-all ${
          isRead ? "bg-card border-border" : "bg-primary/5 border-primary/20"
        }`}
      >
        <div className="flex gap-4">
          <div className="flex-shrink-0 mt-1">{getIcon(notification.type)}</div>

          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-sm text-pretty">{notification.message}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
              {!isRead && (
                <span className="inline-flex items-center gap-1 text-xs text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  New
                </span>
              )}
            </div>
          </div>

          {!isRead && (
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0"
              onClick={() => setReadIds((prev) => new Set(prev).add(notification.id))}
            >
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    )
  })

  return (
    <div className="space-y-2">
      {notifications.length > 0 ? notificationContent : (
        <p className="text-muted-foreground py-8 text-center">You're all caught up - no notifications yet.</p>
      )}
    </div>
  )
}
