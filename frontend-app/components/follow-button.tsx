"use client";

import { useToggleFollow } from "@/hooks/use-toggle-follow";
import { Loader2, UserCheck, UserPlus } from "lucide-react";
import React, { useEffect, useState } from "react";

interface FollowButtonProps {
  userId: number;
    followed: boolean | undefined; // initial followed status from parent
    friend: boolean | undefined;
}

const FollowButton: React.FC<FollowButtonProps> = ({ userId, followed, friend }) => {
  const [isFollowed, setIsFollowed] = useState(followed);
  const toggleFollowMutation = useToggleFollow();

  // Sync internal state whenever parent prop changes
  useEffect(() => {
    setIsFollowed(followed);
  }, [followed]);

    const [isFriend, setIsFriend] = useState(friend);
    useEffect(() => setIsFriend(isFriend), [friend]);

  const handleClick = () => {
    toggleFollowMutation.mutate(
      userId, 
      {
          onSuccess: (data) => {
              setIsFollowed(data.followed)
              setIsFriend(data.isFriend)
        },
      }
    );
  };

  return (
    <button
      onClick={handleClick}
      disabled={toggleFollowMutation.isPending}
      className={`flex items-center gap-2 px-4 py-1 cursor-pointer rounded transition-colors duration-200 
                  ${isFollowed ? "bg-gray-300 text-gray-800" : "bg-blue-500 text-white"}`}
    >
      {toggleFollowMutation.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
        ) : isFriend ? (
        <>
            <UserCheck className="h-4 w-4" />
            Friend
        </>
        ) : isFollowed ? (
        <>
            <UserCheck className="h-4 w-4" />
            Following
        </>
        ) : (
        <>
            <UserPlus className="h-4 w-4" />
            Follow
        </>
        )}
    </button>
  );
};

export default FollowButton;
