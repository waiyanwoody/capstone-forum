"use client"

import { CommentCard } from "./comment-card"
import type { Comment } from "@/lib/types"

type CommentTreeProps = {
  comments: Comment[]
  depth?: number
  postId: number
  bestCommentId?: number | null
  canModerate: boolean
  onMarkSolution?: (commentId: number) => void
}

export function CommentTree({
  comments,
  depth = 0,
  postId,
  bestCommentId,
  canModerate,
  onMarkSolution,
}: CommentTreeProps) {
  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id}>
          <CommentCard
            comment={comment}
            depth={depth}
            postId={postId}
            canModerate={canModerate}
            isBest={bestCommentId === comment.id || comment.best === true}
            onMarkSolution={onMarkSolution}
          />

          {comment.replies && comment.replies.length > 0 && (
            <div className="ml-8 mt-4 border-l-2 border-border pl-4">
              <CommentTree
                comments={comment.replies}
                depth={depth + 1}
                postId={postId}
                bestCommentId={bestCommentId}
                canModerate={canModerate}
                onMarkSolution={onMarkSolution}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
