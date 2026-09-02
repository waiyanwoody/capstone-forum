"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MessageSquare, ThumbsUp, Pin, CheckCircle2, Clock, Eye } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ActiveAvatar } from "@/components/active-avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Post } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import { getUserAvatar, parseServerDate } from "@/lib/utils"
import { postTypeLabel } from "@/lib/constants"
import { toggleLike } from "@/lib/api/likes"

type PostCardProps = {
  post: Post
}

const TAG_ACCENTS = [
  "bg-primary/10 text-primary",
  "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "bg-rose-500/10 text-rose-600 dark:text-rose-400",
]

export function PostCard({ post }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.liked ?? false)
  const [likeCount, setLikeCount] = useState(post.likeCount ?? 0)
  const [likePending, setLikePending] = useState(false)
  const router = useRouter()

  const timeAgo = formatDistanceToNow(parseServerDate(post.createdAt), { addSuffix: true })
  const avatarUrl = getUserAvatar(post?.author.avatar_path)

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

  const goToPost = () => {
    if (post.slug) router.push(`/t/${post.slug}`)
  }

  const accent = (post.tags?.length ?? 0) > 0 ? TAG_ACCENTS[post.id % TAG_ACCENTS.length] : ""

  return (
    <div
      onClick={goToPost}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          goToPost()
        }
      }}
      role="link"
      tabIndex={0}
      className="group relative flex w-full gap-4 rounded-xl border border-border bg-card p-0 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_8px_30px_-10px_rgba(0,0,0,0.18)] hover:translate-y-[-2px] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-5"
    >
      {/* Left accent rail */}
      <span
        className={`hidden w-1 self-stretch rounded-l-xl transition-colors duration-200 sm:block ${
          post.isSolved
            ? "bg-emerald-500"
            : post.isPinned
              ? "bg-primary"
              : "bg-transparent group-hover:bg-primary/40"
        }`}
      />

      {/* Author avatar column (desktop) */}
      <Link
        href={`/u/${post?.author?.username}`}
        onClick={(e) => e.stopPropagation()}
        className="hidden sm:block flex-shrink-0 pt-1"
      >
        <ActiveAvatar
          username={post?.author?.username}
          fullname={post?.author?.fullname}
          avatarPath={post?.author?.avatar_path}
          className="h-11 w-11 ring-2 ring-border transition-all duration-200 group-hover:ring-primary/30"
        />
      </Link>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-2.5 p-4 pl-0 sm:p-0">
        {/* Top row: status chips + pin */}
        <div className="flex flex-wrap items-center gap-1.5">
          {post.type && (
            <span className="inline-flex items-center rounded-full bg-muted/80 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              {postTypeLabel(post.type)}
            </span>
          )}
          {post.isSolved && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3 w-3" /> Solved
            </span>
          )}
          {post.isPinned && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
              <Pin className="h-3 w-3" /> Pinned
            </span>
          )}

          {/* Mobile avatar + author inline */}
          <span className="flex items-center gap-1.5 sm:hidden ml-auto">
            <Avatar className="h-6 w-6">
              <AvatarImage src={avatarUrl ?? undefined} alt={post?.author?.username} />
              <AvatarFallback className="text-[9px]">{post?.author?.username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium text-muted-foreground">{post?.author?.username}</span>
          </span>
        </div>

        {/* Title + excerpt */}
        <Link href={`/t/${post.slug}`} onClick={(e) => e.stopPropagation()} className="block no-underline">
          <h3 className="text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-lg sm:leading-snug text-balance">
            {post.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground text-pretty">{post.excerpt}</p>
        </Link>

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.slice(0, 3).map((tag, index) => (
              <span
                key={`${tag}-${index}`}
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  TAG_ACCENTS[index % TAG_ACCENTS.length]
                }`}
              >
                {tag}
              </span>
            ))}
            {post.tags.length > 3 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                +{post.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer meta */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/60 pt-2.5 text-xs text-muted-foreground sm:flex-nowrap">
          <span className="hidden items-center gap-1 sm:inline-flex">
            <Clock className="h-3.5 w-3.5" />
            {timeAgo}
          </span>
          <span className="flex items-center gap-1 sm:hidden">
            <Link href={`/u/${post?.author?.username}`} onClick={(e) => e.stopPropagation()} className="font-medium hover:text-foreground">
              {post?.author?.username}
            </Link>
            <span className="opacity-50">·</span>
            <span>{timeAgo}</span>
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={likePending}
            className={`h-7 gap-1.5 px-2 ${isLiked ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            <ThumbsUp className={`h-3.5 w-3.5 ${isLiked ? "fill-current" : ""}`} />
            <span className="text-xs font-medium">{likeCount}</span>
          </Button>

          <span className="flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="font-medium">{post.commentCount ?? 0}</span>
            <span className="hidden text-muted-foreground/80 sm:inline">replies</span>
          </span>

          {(post.viewCount ?? 0) > 0 && (
            <span className="flex items-center gap-1.5 opacity-80">
              <Eye className="h-3.5 w-3.5" />
              <span className="font-medium">{post.viewCount}</span>
              <span className="hidden text-muted-foreground/80 sm:inline">views</span>
            </span>
          )}

          {/* Activity side label */}
          <span className="ml-auto hidden items-center gap-1.5 text-[11px] text-muted-foreground/80 sm:flex">
            <span className={`h-1.5 w-1.5 rounded-full ${post.commentCount ? "bg-emerald-500" : "bg-muted"}`} />
            {post.commentCount ? "Active" : "No replies yet"}
          </span>
        </div>
      </div>
    </div>
  )
}
