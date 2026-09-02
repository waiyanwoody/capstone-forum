"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Calendar, Settings } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { format } from "date-fns"
import { getUserAvatar, parseServerDate } from "@/lib/utils"
import { ProfileStatus, UserProfile as UserProfileModel } from "@/lib/types"
import FollowButton from "./follow-button"

type UserProfileProps = {
  user: UserProfileModel | null
  isCurrentUser: boolean 
  stats: ProfileStatus | null
}

export function UserProfile({ user,isCurrentUser,stats }: UserProfileProps) {

  const avatarUrl = getUserAvatar(user?.avatar_path);

  if (user === null) {
    return;
  }


  return (
    <Card className="border-border bg-card">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-6">
          <Avatar className="h-24 w-24 ring-4 ring-primary/10">
            <AvatarImage src={avatarUrl ?? undefined} alt={user.fullname} />
            <AvatarFallback className="text-2xl">{user.fullname.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">{user.fullname}</h1>
                <p className="text-muted-foreground">@{user.username}</p>
              </div>

              <div className="flex gap-2 ">
                {!isCurrentUser ? <FollowButton userId={Number(user.id)} followed={user.followed} friend={user.isFriend} /> : 
                  <Button className="cursor-pointer" variant="outline" size="sm" asChild>
                  <Link href="/settings">
                    <Settings className="h-4 w-4" />
                  </Link>
                </Button>
                }
               
                
              </div>
            </div>

            {user.bio && <p className="text-sm text-pretty">{user.bio}</p>}

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {user.created_at && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {format(parseServerDate(user.created_at), "MMMM yyyy")}</span>
                </div>
              )}
            </div>

            {user.badges && user.badges.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {user.badges.map((badge) => (
                  <Badge key={badge.id} variant="secondary" className="gap-1.5">
                    <span>{badge.icon}</span>
                    {badge.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.followingCount}</div>
              <div className="text-xs text-muted-foreground">Following</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.followerCount}</div>
              <div className="text-xs text-muted-foreground">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.postCount}</div>
              <div className="text-xs text-muted-foreground">Posts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.postLikeCount}</div>
              <div className="text-xs text-muted-foreground">Post Likes</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
