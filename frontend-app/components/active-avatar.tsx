"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { usePresence } from "@/hooks/use-presence"
import { getUserAvatar } from "@/lib/utils"

type ActiveAvatarProps = {
  username?: string | null
  fullname?: string | null
  avatarPath?: string | null
  className?: string
  showStatus?: boolean
}

/**
 * Avatar with a green "online" dot when the user has a live session.
 * The dot renders only when showStatus is true and the user is active.
 */
export function ActiveAvatar({ username, fullname, avatarPath, className, showStatus = true }: ActiveAvatarProps) {
  const { isOnline } = usePresence()
  const active = showStatus && isOnline(username)

  return (
    <span className="relative inline-flex flex-shrink-0">
      <Avatar className={className}>
        <AvatarImage src={getUserAvatar(avatarPath ?? undefined) ?? undefined} alt={username ?? "user"} />
        <AvatarFallback>{(fullname || username)?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
      </Avatar>
      {active && (
        <span
          className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-background"
          aria-label="Online"
        />
      )}
    </span>
  )
}
