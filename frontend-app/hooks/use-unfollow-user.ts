import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

import { unfollowUser } from "@/lib/api/follow";
import { ApiHttpError } from "@/lib/http";

export const useUnfollowUser = () => {
  const queryClient = useQueryClient();

  return useMutation<string, ApiHttpError, number>({
    mutationFn: unfollowUser,

    onSuccess: () => {
      toast.success("Unfollowed successfully!");

      queryClient.invalidateQueries({
        queryKey: ["profileStatus"],
      });
    },

    onError: (error) => {
      if (error instanceof ApiHttpError) {
        toast.error(error.message || "Something went wrong");
      } else {
        toast.error("Failed to unfollow user");
      }
    },
  });
};