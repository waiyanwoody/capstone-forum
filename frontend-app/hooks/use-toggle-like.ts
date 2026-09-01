"use client";

import { useCallback, useState } from "react";
import { toast } from "react-hot-toast";
import { toggleLike, type LikeTargetType } from "@/lib/api/likes";

export function useToggleLike(
  targetId: number,
  initialLiked = false,
  initialCount = 0
) {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [isPending, setIsPending] = useState(false);

  const toggle = useCallback(async () => {
    if (!targetId || isPending) return;

    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((prev) => (wasLiked ? prev - 1 : prev + 1));
    setIsPending(true);

    try {
      const result = await toggleLike(targetId, "POST");
      setLiked(result.liked);
      setLikeCount(result.likeCount);
    } catch (error: any) {
      setLiked(wasLiked);
      setLikeCount(initialCount);
      toast.error(error.message || "Failed to like post");
    } finally {
      setIsPending(false);
    }
  }, [targetId, liked, isPending, initialCount]);

  return { liked, likeCount, toggle, isPending };
}
