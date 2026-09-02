"use client"

import { useState } from "react"

import Link from "next/link"

import {
  MessageSquare,
  MoreHorizontal,
  CheckCircle2,
  ThumbsUp,
} from "lucide-react"

import { ActiveAvatar } from "@/components/active-avatar"
import { parseServerDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { MarkdownRenderer } from "@/components/markdown-renderer"
import { CommentForm } from "./comment-form"

import type { Comment } from "@/lib/types"

import {
  useUpdateComment,
  useDeleteComment,
} from "@/hooks/use-comments"

import { toggleLike } from "@/lib/api/likes"
import { formatDistanceToNow } from "date-fns"

type CommentCardProps = {
  comment: Comment
  depth?: number
  postId: number
  canModerate: boolean
  canReply?: boolean
  isBest?: boolean
  onMarkSolution?: (commentId: number) => void
}

export function CommentCard({
  comment,
  depth = 0,
  postId,
  canModerate,
  canReply = true,
  isBest = false,
  onMarkSolution,
}: CommentCardProps) {

  const [showReply, setShowReply] = useState(false)

  // Edit state
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)

  // React Query mutations
  const updateMutation = useUpdateComment(comment.postId)
  const deleteMutation = useDeleteComment(comment.postId)

  // Local like state
  const [isLiked, setIsLiked] = useState(comment.liked ?? false)
  const [likeCount, setLikeCount] = useState(comment.likeCount ?? 0)
  const [likePending, setLikePending] = useState(false)

  const handleLike = async () => {
    if (likePending) return
    const wasLiked = isLiked
    setIsLiked(!wasLiked)
    setLikeCount((prev) => (wasLiked ? prev - 1 : prev + 1))
    setLikePending(true)
    try {
      const result = await toggleLike(comment.id, "COMMENT")
      setIsLiked(result.liked)
      setLikeCount(result.likeCount)
    } catch {
      setIsLiked(wasLiked)
      setLikeCount(comment.likeCount ?? 0)
    } finally {
      setLikePending(false)
    }
  }

  const timeAgo = comment.createdAt
    ? formatDistanceToNow(
        parseServerDate(
          comment.createdAt.replace(
            /\.(\d{3})\d+$/,
            ".$1"
          )
        ),
        { addSuffix: true }
      )
    : "Unknown date"

  // Handle update
  const handleUpdate = () => {
    const content = editContent.trim()

    if (!content) return

    updateMutation.mutate(
      {
        id: comment.id,
        payload: {
          postId: comment.postId,
          content,
          parentCommentId: null,
        },
      },
      {
        onSuccess: () => {
          setIsEditing(false)
        },
      }
    )
  }

  // Handle delete
  const handleDelete = () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this comment?"
    )

    if (!confirmed) return

    deleteMutation.mutate(comment.id)
  }

  // Cancel editing
  const handleCancelEdit = () => {
    setEditContent(comment.content)
    setIsEditing(false)
  }

  return (
    <div id={`comment-${comment.id}`} className={`bg-card border rounded-lg p-4 space-y-4 ${isBest ? "border-green-500/60 bg-green-50/40 dark:bg-green-900/10" : "border-border"}`}>

      {/* Best reply badge */}
      {isBest && (
        <Badge variant="outline" className="gap-1 border-green-500/60 text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-3 w-3" />
          Best Answer
        </Badge>
      )}

      {/* Header */}
      <div className="flex items-start gap-3">

        {/* Avatar */}
        <Link href={`/u/${comment.authorUsername}`}>
          <ActiveAvatar
            username={comment.authorUsername}
            fullname={comment.authorFullname}
            avatarPath={comment.authorAvatar}
            className="h-10 w-10"
          />
        </Link>

        {/* Author information */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">

            <Link
              href={`/u/${comment.authorUsername}`}
              className="font-semibold text-sm hover:text-primary transition-colors"
            >
              {comment.authorFullname}
            </Link>

            <span className="text-xs text-muted-foreground">
              @{comment.authorUsername}
            </span>

            <span className="text-xs text-muted-foreground">
              {timeAgo}
            </span>

          </div>
        </div>

        {/* More menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={deleteMutation.isPending}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">

            {canModerate && (
              <DropdownMenuItem onClick={() => onMarkSolution?.(comment.id)}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {isBest ? "Remove as Solution" : "Mark as Solution"}
              </DropdownMenuItem>
            )}

            {/* Edit */}
            <DropdownMenuItem
              onClick={() => {
                setEditContent(comment.content)
                setIsEditing(true)
              }}
              disabled={updateMutation.isPending}
            >
              Edit
            </DropdownMenuItem>

            <DropdownMenuItem>
              Report
            </DropdownMenuItem>

            {/* Delete */}
            <DropdownMenuItem
              className="text-destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending
                ? "Deleting..."
                : "Delete"}
            </DropdownMenuItem>

          </DropdownMenuContent>
        </DropdownMenu>

      </div>

      {/* Comment content / Edit form */}
      {isEditing ? (
        <div className="space-y-3">

          <textarea
            value={editContent}
            onChange={(e) =>
              setEditContent(e.target.value)
            }
            className="w-full min-h-[100px] rounded-md border border-border bg-background p-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Edit your comment..."
            disabled={updateMutation.isPending}
          />

          <div className="flex items-center gap-2">

            {/* Save */}
            <Button
              size="sm"
              onClick={handleUpdate}
              disabled={
                updateMutation.isPending ||
                !editContent.trim()
              }
            >
              {updateMutation.isPending
                ? "Saving..."
                : "Save"}
            </Button>

            {/* Cancel */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelEdit}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>

          </div>

        </div>
      ) : (
        <div className="prose prose-sm prose-slate dark:prose-invert max-w-none">
          <MarkdownRenderer content={comment.content} />
        </div>
      )}

      {/* Actions */}
      {!isEditing && (
        <div className="flex items-center gap-2">

          <Button
            variant="ghost"
            size="sm"
            className={`gap-1.5 h-8 ${isLiked ? "text-primary" : ""}`}
            onClick={handleLike}
            disabled={likePending}
          >
            <ThumbsUp className={`h-3.5 w-3.5 ${isLiked ? "fill-current" : ""}`} />
            <span className="text-xs">{likeCount > 0 ? likeCount : "Like"}</span>
          </Button>

          {canReply ? (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 h-8"
              onClick={() => setShowReply(!showReply)}
            >
              <MessageSquare className="h-3.5 w-3.5" />

              <span className="text-xs">
                Reply
              </span>
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground italic">
              Max reply depth reached
            </span>
          )}

        </div>
      )}

      {/* Reply form */}
      {showReply && !isEditing && (
        <div className="pt-4 border-t border-border">

          <CommentForm
            postId={comment.postId}
            parentCommentId={comment.id}
            onCancel={() => setShowReply(false)}
            compact
          />

        </div>
      )}

    </div>
  )
}
