"use client";

import { useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { ApiHttpError } from "@/lib/http";
import { getPosts } from "@/lib/api/posts";
import type { PaginatedResponse, Post } from "@/lib/types";

export type FilterTab = "all" | "trending" | "solved" | "following";

export const useFetchPosts = (pageSize = 10, filter: FilterTab = "all") => {
  const query = useInfiniteQuery<PaginatedResponse<Post>, ApiHttpError>({
    queryKey: ["posts", pageSize, filter],
    queryFn: ({ page = 0 }) => {
      if (filter === "solved") {
        return getPosts(page, pageSize, { solved: true });
      }
      return getPosts(page, pageSize);
    },
    getNextPageParam: (lastPage) => {
      // Return next page number, or undefined if no more pages
      return lastPage.number + 1 < lastPage.totalPages
        ? lastPage.number + 1
        : undefined;
    },
    initialPageParam: 0, // ✅ backend pages are 0-indexed
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (query.isError && query.error instanceof ApiHttpError) {
      toast.error(query.error.message || "Failed to load posts");
    } else if (query.isError) {
      toast.error("Something went wrong while fetching posts");
    }
  }, [query.isError, query.error]);

  return query;
};
