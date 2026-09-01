"use client"

import { useState } from "react"
import Link from "next/link"
import { MessageSquare, ThumbsUp, Pin, CheckCircle2, Clock } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Post, PostSummary, UserSummary } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import { getUserAvatar } from "@/lib/utils"
import { toggleLike } from "@/lib/api/likes"

type PostCardProps = {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.liked ?? false)
  const [likeCount, setLikeCount] = useState(post.likeCount ?? 0)
  const [likePending, setLikePending] = useState(false)

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
  const avatarUrl = getUserAvatar(post?.author.avatar_path);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (likePending || !post.id) return
    const wasLiked = isLiked
    setIsLiked(!wasLiked)
    setLikeCount((prev) => (wasLiked ? prev - 1 : prev + 1))
    setLikePending(true)
    try {
      const result = await toggleLike(post.id, "POST")
      setIsLiked(result.liked)
      setLikeCount(result.likeCount)
    } catch {
      setIsLiked(wasLiked)
      setLikeCount(post.likeCount ?? 0)
    } finally {
      setLikePending(false)
    }
  }

  return (
    <Link
      href={`/t/${post.slug}`}
      className="group relative block bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-all"
    >
      {/* Pinned indicator */}
      {post.isPinned && (
        <div className="absolute top-4 right-4">
          <Pin className="h-4 w-4 text-primary" />
        </div>
      )}

      <div className="flex gap-4">
        {/* post?.Author Avatar */}
        <Link href={`/u/${post?.author?.username}`} onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
          <Avatar className="h-12 w-12 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
            <AvatarImage src={avatarUrl ?? undefined} alt={post?.author?.username} />
            <AvatarFallback>{post?.author?.username.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Title & Status */}
          <div className="flex items-start gap-2">
            <h3 className="flex-1 text-lg font-semibold text-foreground group-hover:text-primary transition-colors text-balance">
              {post.title}
            </h3>
            {post.isSolved && <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />}
          </div>

          {/* Excerpt */}
          <p className="text-sm text-muted-foreground line-clamp-2 text-pretty">{post.excerpt}</p>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <Link href={`/u/${post?.author?.username}`} onClick={(e) => e.stopPropagation()} className="font-medium hover:text-foreground transition-colors">
              {post?.author?.username}
            </Link>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {timeAgo}
            </span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {post.tags?.map((tag, index) => (
              <Badge key={`${tag}-${index}`} variant="secondary" className="text-xs">
              {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="hidden sm:flex flex-col items-end gap-3 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={likePending}
            className={`flex items-center gap-2 ${isLiked ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            <ThumbsUp className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
            <span className="text-sm font-medium">{likeCount}</span>
          </Button>
          <span className="flex items-center gap-2 text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            <span className="text-sm font-medium">{post.commentCount}</span>
          </span>
        </div>
      </div>
    </Link>
  )
}
