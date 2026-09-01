import { useQuery } from "@tanstack/react-query";

import { getComments } from "@/lib/api/comments";

import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  updateComment,
  deleteComment,
} from "@/lib/api/comments";

import type { CreateCommentPayload } from "@/lib/types";

export const useComments = (
  postId: number,
  page = 0,
  pageSize = 10
) => {
  return useQuery({
    queryKey: ["comments", postId, page, pageSize],

    queryFn: () => getComments(page, pageSize, postId),

    enabled: !!postId,
  });
};

export const useUpdateComment = (postId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: CreateCommentPayload;
    }) => updateComment(id, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["comments", postId],
      });
    },
  });
};

export const useDeleteComment = (postId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteComment(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["comments", postId],
      });
    },
  });
};