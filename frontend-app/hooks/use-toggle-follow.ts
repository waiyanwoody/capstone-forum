import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { toggleFollow, ToggleFollowResponse } from "@/lib/api/follow";
import { ApiHttpError } from "@/lib/http";

export const useToggleFollow = () => {
  const queryClient = useQueryClient();

  return useMutation<ToggleFollowResponse, ApiHttpError, number>({
    mutationFn: toggleFollow,
    onSuccess: (data) => {
      // Optionally refresh profile or user list
      queryClient.invalidateQueries({ queryKey: ["profileStatus", data.followingId] });
      toast.success(data.followed ? "Followed successfully!" : "Unfollowed successfully!");
    },
    onError: (error) => {
      if (error instanceof ApiHttpError) {
        toast.error(error.message || "Something went wrong");
      } else {
        toast.error("Failed to toggle follow");
      }
    },
  });
};
