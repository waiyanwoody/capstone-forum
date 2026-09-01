import { useQuery } from "@tanstack/react-query";

import {
  getFollowing,
  UserResponse,
} from "@/lib/api/follow";

import { ApiHttpError } from "@/lib/http";

export const useFollowing = (userId: number) => {
  return useQuery<UserResponse[], ApiHttpError>({
    queryKey: ["following", userId],
    queryFn: () => getFollowing(userId),
    enabled: !!userId,
  });
};