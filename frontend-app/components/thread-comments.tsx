"use client"

import { useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "react-hot-toast"
import { CommentForm } from "@/components/comment-form"
import { CommentTree } from "@/components/comment-tree"
import { getCommentsByPostId, markBestSolution } from "@/lib/api/comments"
import { useAuth } from "@/contexts/auth-context"
import type { Post } from "@/lib/types"

type ThreadCommentsProps = {
  post: Post
}

export function ThreadComments({ post }: ThreadCommentsProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["comments", post.id],
    queryFn: () => getCommentsByPostId(post.id),
  })

  const comments = data?.content ?? []
  const commentCount = data?.totalElements ?? 0

  // Scroll to the comment referenced by #comment-{id} (from a notification) once loaded
  useEffect(() => {
    const m = window.location.hash.match(/^#comment-(\d+)$/)
    if (m) {
      const t = setTimeout(() => {
        document.getElementById(`comment-${m[1]}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
        const el = document.getElementById(`comment-${m[1]}`)
        if (el) {
          el.classList.add("ring-2", "ring-primary/50")
          setTimeout(() => el.classList.remove("ring-2", "ring-primary/50"), 3000)
        }
      }, 150)
      return () => clearTimeout(t)
    }
  }, [isLoading, comments.length])

  const markSolutionMutation = useMutation({
    mutationFn: (commentId: number) => markBestSolution(commentId, post.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", post.id] })
      toast.success("Marked as best answer")
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to mark solution")
    },
  })

  if (isLoading) {
    return <p className="text-muted-foreground">Loading comments...</p>
  }

  if (isError) {
    return (
      <p className="text-destructive">
        Failed to load comments.
      </p>
    )
  }

  const isOwnerOrAdmin =
    !!user && (user.id === post.author.id || user.role === "ADMIN")

  const bestCommentId = post.bestCommentId ?? null

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">
        {commentCount} {commentCount === 1 ? "Reply" : "Replies"}
      </h2>

      <CommentForm postId={post.id} />

      {comments.length > 0 ? (
        <CommentTree
          comments={comments}
          postId={post.id}
          bestCommentId={bestCommentId}
          canModerate={isOwnerOrAdmin}
          onMarkSolution={(commentId) => markSolutionMutation.mutate(commentId)}
        />
      ) : (
        <p className="text-muted-foreground">
          No replies yet. Be the first to reply!
        </p>
      )}
    </div>
  )
}
