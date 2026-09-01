"use client"

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

  const comments = data?.content ?? []
  const count = data?.totalElements ?? 0

  const isOwnerOrAdmin =
    !!user && (user.id === post.author.id || user.role === "ADMIN")

  const bestCommentId = post.bestCommentId ?? null

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">
        {count} {count === 1 ? "Reply" : "Replies"}
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
