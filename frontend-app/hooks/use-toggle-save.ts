"use client";

import { useCallback, useState } from "react";
import { toast } from "react-hot-toast";
import { toggleSave } from "@/lib/api/saved";

export function useToggleSave(postId: number, initialSaved = false) {
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, setIsPending] = useState(false);

  const toggle = useCallback(async () => {
    if (!postId || isPending) return;

    const wasSaved = saved;
    setSaved(!wasSaved);
    setIsPending(true);

    try {
      const savedNow = await toggleSave(postId);
      setSaved(savedNow);
    } catch (error: any) {
      setSaved(wasSaved);
      toast.error(error.message || "Failed to save post");
    } finally {
      setIsPending(false);
    }
  }, [postId, saved, isPending]);

  return { saved, toggle, isPending };
}
