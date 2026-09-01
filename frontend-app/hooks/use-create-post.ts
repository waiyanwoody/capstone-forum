import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiHttpError } from "@/lib/http";
import { toast } from "react-hot-toast";
import type { Post } from "@/lib/types";
import { createPost } from "@/lib/api/posts";

export interface CreatePostPayload {
  title: string;
  content: string;
  tags: string[];
}

export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation<Post, ApiHttpError, CreatePostPayload>({
    mutationFn: createPost,
    onSuccess: (newPost) => {
      // Refresh posts after new one added
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Post created successfully!");
      console.log("Created post:", newPost);
    },
    onError: (error) => {
      if (error instanceof ApiHttpError) {
        toast.error(error.message || "Something went wrong");

        // Optional: show validation errors from backend
        if (error.errors) {
          Object.entries(error.errors).forEach(([field, msg]) => {
            console.log(`Validation error → ${field}: ${msg}`);
          });
        }
      } else {
        toast.error("Failed to create post");
      }
    },
  });
};
