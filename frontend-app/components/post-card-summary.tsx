"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { MessageSquare, ThumbsUp, Pin, CheckCircle2, Clock } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Post, PostSummary, UserSummary } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import { getPostPreview, getUserAvatar, parseServerDate } from "@/lib/utils"
import { postTypeLabel } from "@/lib/constants"
import { PostImageStrip } from "@/components/post-image-strip"

type PostCardProps = {
  post: PostSummary
  author: UserSummary
}

export function PostCardSummary({ post,author }: PostCardProps) {

  const timeAgo = formatDistanceToNow(parseServerDate(post.createdAt), { addSuffix: true })
  const avatarUrl = getUserAvatar(author.avatar_path);
  const router = useRouter()

  const goToPost = () => {
    if (post.slug) router.push(`/t/${post.slug}`)
  }

  return (
    <article
      onClick={goToPost}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          goToPost()
        }
      }}
      role="link"
      tabIndex={0}
      className="group relative bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {/* Pinned indicator */}
      {post.isPinned && (
        <div className="absolute top-4 right-4">
          <Pin className="h-4 w-4 text-primary" />
        </div>
      )}

      <div className="flex gap-4">
        {/* Author Avatar */}
        {/* <Link href={`/u/${author?.username}`} className="flex-shrink-0">
          <Avatar className="h-12 w-12 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
            <AvatarImage src={avatarUrl ?? undefined} alt={author?.username} />
            <AvatarFallback>{author?.username.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Link> */}

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Title & Status */}
          <div className="flex items-start gap-2">
            <Link
              href={`/t/${post.slug}`}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 text-lg font-semibold text-foreground hover:text-primary transition-colors text-balance"
            >
              {post.title}
            </Link>
            {post.type && (
              <span className="rounded-full bg-muted/80 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex-shrink-0 mt-1">
                {postTypeLabel(post.type)}
              </span>
            )}
            {post.isSolved && <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />}
          </div>

          {/* Excerpt */}
          <PostImageStrip content={post.excerpt} />
          <p className="text-sm text-muted-foreground line-clamp-2 text-pretty">{getPostPreview(post.excerpt)}</p>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {/* <Link href={`/u/${author?.username}`} className="font-medium hover:text-foreground transition-colors">
              {author?.username}
            </Link> */}
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {timeAgo}
            </span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {post.tags?.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
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
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ThumbsUp className="h-4 w-4" />
            <span className="text-sm font-medium">{post.likeCount}</span>
          </Button>
          <Link
            href={`/t/${post.slug}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="text-sm font-medium">{post.commentCount}</span>
          </Link>
        </div>
      </div>
    </article>
  )
}
