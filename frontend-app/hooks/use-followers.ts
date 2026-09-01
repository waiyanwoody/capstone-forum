import { useQuery } from "@tanstack/react-query";

import {
  getFollowers,
  UserResponse,
} from "@/lib/api/follow";

import { ApiHttpError } from "@/lib/http";

export const useFollowers = (userId: number) => {
  return useQuery<UserResponse[], ApiHttpError>({
    queryKey: ["followers", userId],
    queryFn: () => getFollowers(userId),
    enabled: !!userId,
  });
};