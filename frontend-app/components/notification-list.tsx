"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MessageSquare, ThumbsUp, AtSign, CheckCircle2, UserPlus, UserCheck, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Notification } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import { parseServerDate } from "@/lib/utils"
import { useToggleFollow } from "@/hooks/use-toggle-follow"
import { useAuth } from "@/contexts/auth-context"

type NotificationListProps = {
  notifications: Notification[]
  onMarkRead: (id: Notification["id"]) => void
}

export function NotificationList({ notifications, onMarkRead }: NotificationListProps) {
  const [readIds, setReadIds] = useState<Set<Notification["id"]>>(new Set())
  const [followTarget, setFollowTarget] = useState<Notification | null>(null)
  const toggleFollow = useToggleFollow()
  const { user } = useAuth()
  const router = useRouter()

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

  // COMMENT / LIKE notifications navigate to the target post (and scroll to the comment)
  const navigate = (notification: Notification) => {
    onMarkRead(notification.id)
    setReadIds((prev) => new Set(prev).add(notification.id))
    if (notification.type === "FOLLOW") {
      setFollowTarget(notification)
      return
    }
    if (notification.postSlug) {
      const hash = notification.commentId ? `#comment-${notification.commentId}` : ""
      router.push(`/t/${notification.postSlug}${hash}`)
    } else if (notification.postId) {
      router.push(`/t/${notification.postId}`)
    }
  }

  const handleAcceptFollow = async () => {
    if (!followTarget?.senderId) return
    try {
      await toggleFollow.mutateAsync(followTarget.senderId)
    } catch {
      // silently ignore
    }
    setFollowTarget(null)
  }

  return (
    <>
      <div className="space-y-2">
        {notifications.length > 0 ? (
          notifications.map((notification) => {
            const timeAgo = formatDistanceToNow(parseServerDate(notification.createdAt), { addSuffix: true })
            const isRead = notification.read || readIds.has(notification.id)
            const clickable = notification.type === "FOLLOW" || !!notification.postSlug || !!notification.postId

            const handleMarkRead = () => {
              if (isRead) return
              setReadIds((prev) => new Set(prev).add(notification.id))
              onMarkRead(notification.id)
            }

            return (
              <div
                key={notification.id}
                role={clickable ? "button" : undefined}
                tabIndex={clickable ? 0 : undefined}
                onClick={() => clickable && navigate(notification)}
                onKeyDown={(e) => clickable && e.key === "Enter" && navigate(notification)}
                className={`block p-4 rounded-lg border transition-all ${
                  isRead ? "bg-card border-border" : "bg-primary/5 border-primary/20"
                } ${clickable ? "cursor-pointer hover:border-primary/40 hover:bg-primary/5" : ""}`}
              >
                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">{getIcon(notification.type)}</div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${isRead ? "hidden" : "bg-primary"}`} />
                      <p className="text-sm text-pretty">{notification.message}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{timeAgo}</span>
                      {!isRead && (
                        <span className="inline-flex items-center gap-1 text-xs text-primary">New</span>
                      )}
                    </div>
                    {notification.type === "COMMENT" && notification.commentId && (
                      <span className="inline-flex items-center gap-1 text-xs text-primary">
                        View reply <span aria-hidden>→</span>
                      </span>
                    )}
                  </div>

                  {!isRead && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0"
                      aria-label="Mark as read"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMarkRead()
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <p className="text-muted-foreground py-8 text-center">You're all caught up - no notifications yet.</p>
        )}
      </div>

      {/* Follow accept/reject modal */}
      <Dialog open={!!followTarget} onOpenChange={(o) => !o && setFollowTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              New follower
            </DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">
                {followTarget?.senderFullname || followTarget?.senderUsername || "This user"}
              </span>{" "}
              started following you. Do you want to follow them back and become friends?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setFollowTarget(null)}>
              <X className="h-4 w-4 mr-2" />
              Not now
            </Button>
            <Button onClick={handleAcceptFollow} disabled={toggleFollow.isPending}>
              {toggleFollow.isPending ? "Accepting..." : (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Accept & become friends
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
