import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

import { followUser } from "@/lib/api/follow";
import { ApiHttpError } from "@/lib/http";

export const useFollowUser = () => {
  const queryClient = useQueryClient();

  return useMutation<string, ApiHttpError, number>({
    mutationFn: followUser,

    onSuccess: () => {
      toast.success("Followed successfully!");

      queryClient.invalidateQueries({
        queryKey: ["profileStatus"],
      });
    },

    onError: (error) => {
      if (error instanceof ApiHttpError) {
        toast.error(error.message || "Something went wrong");
      } else {
        toast.error("Failed to follow user");
      }
    },
  });
};