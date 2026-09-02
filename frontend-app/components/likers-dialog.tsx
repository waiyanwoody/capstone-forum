"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ThumbsUp, Loader2, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getPostLikers } from "@/lib/api/likes"
import { getUserAvatar } from "@/lib/utils"
import type { UserResponse } from "@/lib/api/follow"

type LikersDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  postId: number
  likeCount: number
}

export function LikersDialog({ open, onOpenChange, postId, likeCount }: LikersDialogProps) {
  const [users, setUsers] = useState<UserResponse[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    setUsers([])
    getPostLikers(postId)
      .then((list) => {
        if (!cancelled) {
          setUsers(list)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, postId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ThumbsUp className="h-4 w-4 text-primary" />
            {likeCount > 0 ? `Liked by ${likeCount}` : "Likes"}
          </DialogTitle>
          <DialogDescription>People who liked this post</DialogDescription>
        </DialogHeader>

        <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
              <User className="h-6 w-6 opacity-40" />
              No likes yet
            </div>
          ) : (
            users.map((u) => (
              <Link
                key={u.id}
                href={`/u/${u.username}`}
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={getUserAvatar(u.avatar_path ?? undefined) ?? undefined} alt={u.username} />
                  <AvatarFallback>{u.fullname?.charAt(0) || u.username?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{u.fullname}</p>
                  <p className="truncate text-xs text-muted-foreground">@{u.username}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
