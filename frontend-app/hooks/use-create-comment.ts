import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

import { ApiHttpError } from "@/lib/http";
import type { CreateCommentPayload } from "@/lib/types";
import { createComment } from "@/lib/api/comments";

export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCommentPayload) =>
      createComment(payload),

    onSuccess: (comment) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", comment.postId],
      });

      toast.success("Comment added successfully");
    },

    onError: (error) => {
      if (error instanceof ApiHttpError) {
        toast.error(error.message);
      } else {
        toast.error(error.message || "Failed to add comment");
      }
    },
  });
};