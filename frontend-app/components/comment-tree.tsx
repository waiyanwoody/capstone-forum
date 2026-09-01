"use client"

import { CommentCard } from "./comment-card"
import { MAX_COMMENT_DEPTH, type Comment } from "@/lib/types"

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
  // Backend allows replies up to MAX_COMMENT_DEPTH levels (root = 1).
  // Reply button is hidden when this comment is already at the deepest level:
  // canReply = depth (0-based) < MAX_COMMENT_DEPTH - 1
  const canReply = depth < MAX_COMMENT_DEPTH - 1

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id}>
          <CommentCard
            comment={comment}
            depth={depth}
            postId={postId}
            canModerate={canModerate}
            canReply={canReply}
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
