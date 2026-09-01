import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiHttpError } from "@/lib/http";
import { toast } from "react-hot-toast";
import type { Post } from "@/lib/types";
import { updatePost } from "@/lib/api/posts";
import type { CreatePostPayload } from "@/hooks/use-create-post";

export const useUpdatePost = () => {
  const queryClient = useQueryClient();

  return useMutation<Post, ApiHttpError, { id: number; payload: CreatePostPayload }>({
    mutationFn: ({ id, payload }) => updatePost(id, payload),
    onSuccess: (updatedPost) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Thread updated successfully!");
      console.log("Updated post:", updatedPost);
    },
    onError: (error) => {
      if (error instanceof ApiHttpError) {
        toast.error(error.message || "Something went wrong");
      } else {
        toast.error("Failed to update thread");
      }
    },
  });
};
