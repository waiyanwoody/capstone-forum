"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ThumbsUp, Bookmark, Share2, MoreHorizontal, CheckCircle2, Clock } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { useToggleLike } from "@/hooks/use-toggle-like"
import { useToggleSave } from "@/hooks/use-toggle-save"
import { deletePost, toggleSolved } from "@/lib/api/posts"
import type { Post } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"

type ThreadDetailProps = {
  post: Post
}

export function ThreadDetail({ post }: ThreadDetailProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSolved, setIsSolved] = useState(post.isSolved ?? false)
  const [solvedPending, setSolvedPending] = useState(false)
  const { liked, likeCount, toggle, isPending } = useToggleLike(
    post.id,
    post.liked ?? false,
    post.likeCount ?? 0
  )
  const { saved, toggle: toggleSave, isPending: isSavePending } = useToggleSave(
    post.id,
    post.isSaved ?? false
  )
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })

  const isOwnerOrAdmin =
    !!user && (String(user.id) === String(post.author.id) || user.role === "ADMIN")

  const handleToggleSolved = async () => {
    if (solvedPending) return
    setSolvedPending(true)
    try {
      const updated = await toggleSolved(post.id)
      setIsSolved(updated.isSolved ?? !isSolved)
    } catch (error: any) {
      window.alert(error.message || "Failed to update solved status")
    } finally {
      setSolvedPending(false)
    }
  }

  const handleDelete = async () => {
    if (isDeleting) return
    const confirmed = window.confirm("Are you sure you want to delete this thread?")
    if (!confirmed) return

    setIsDeleting(true)
    try {
      await deletePost(post.id)
      router.push("/")
    } catch (error: any) {
      window.alert(error.message || "Failed to delete thread")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <article className="bg-card border border-border rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href={`/u/${post.author.username}`}>
          <Avatar className="h-12 w-12">
            <AvatarImage src={post.author.avatar_path ?? undefined} alt={post.author.fullname} />
            <AvatarFallback>
  {(post.author.fullname || post.author.username)
    .slice(0, 2)
    .toUpperCase()}
</AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/u/${post.author.username}`} className="font-semibold hover:text-primary transition-colors">
              {post.author.fullname}
            </Link>
            <span className="text-sm text-muted-foreground">@{post.author.username}</span>
            {/* {post.isSolved && (
              <Badge variant="outline" className="gap-1 border-green-500/50 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-3 w-3" />
                Solved
              </Badge>
            )} */}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{timeAgo}</span>
          </div>
        </div>

        {isOwnerOrAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/t/${post.slug}/edit`)}>Edit</DropdownMenuItem>
              <DropdownMenuItem>Report</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Title */}
      <div className="flex items-start gap-3">
        <h1 className="text-3xl font-bold text-balance">{post.title}</h1>
        {isSolved && (
          <Badge variant="outline" className="gap-1 border-green-500/60 text-green-600 dark:text-green-400 whitespace-nowrap mt-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Solved
          </Badge>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {post.tags.map((tag) => (
          <Badge key={tag} variant="secondary">
            {tag}
          </Badge>
        ))}
      </div>

      {/* Content */}
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <MarkdownRenderer content={post.content} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-border">
        <Button
          variant={liked ? "default" : "outline"}
          size="sm"
          className="gap-2 transition-all active:scale-95"
          onClick={toggle}
          disabled={isPending}
        >
          <ThumbsUp
            className={`h-4 w-4 transition-transform ${liked ? "scale-110 animate-in zoom-in-50 duration-200" : ""}`}
          />
          <span>{likeCount}</span>
        </Button>

        <Button
          variant={saved ? "default" : "outline"}
          size="sm"
          className="gap-2 transition-all active:scale-95"
          onClick={toggleSave}
          disabled={isSavePending}
        >
          <Bookmark
            className={`h-4 w-4 transition-all ${saved ? "fill-current scale-110 animate-in zoom-in-50 duration-200" : ""}`}
          />
          {saved ? "Saved" : "Save"}
        </Button>

        {isOwnerOrAdmin && (
          <Button
            variant={isSolved ? "default" : "outline"}
            size="sm"
            className={`gap-2 transition-all active:scale-95 ${isSolved ? "border-green-500/60 text-green-600 dark:text-green-400" : ""}`}
            onClick={handleToggleSolved}
            disabled={solvedPending}
          >
            {solvedPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className={`h-4 w-4 ${isSolved ? "fill-current" : ""}`} />
            )}
            {isSolved ? "Mark Unsolved" : "Mark as Solved"}
          </Button>
        )}

        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </div>
    </article>
  )
}
