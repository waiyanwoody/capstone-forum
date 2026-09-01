"use client"

import Link from "next/link"
import { TrendingUp, Users, Tag, PenSquare, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useQuery } from "@tanstack/react-query"
import { getPopularTags, getTopContributors } from "@/lib/api/stats"
import { getUserAvatar } from "@/lib/utils"

export function Sidebar() {
  const { user } = useAuth()

  const popularTagsQuery = useQuery({
    queryKey: ["popular-tags"],
    queryFn: () => getPopularTags(10),
    placeholderData: (prev) => prev,
  })

  const contributorsQuery = useQuery({
    queryKey: ["top-contributors"],
    queryFn: () => getTopContributors(5),
    placeholderData: (prev) => prev,
  })

  const popularTags = popularTagsQuery.data ?? []
  const topContributors = contributorsQuery.data ?? []

  return (
    <div className="space-y-6">
      {/* Popular Tags */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" />
            Popular Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          {popularTagsQuery.isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading tags...
            </div>
          ) : popularTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {popularTags.map((tag) => (
                <Badge
                  key={tag.name}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {tag.name}
                  <span className="ml-1 text-xs opacity-70">{tag.count}</span>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No tags yet</p>
          )}
        </CardContent>
      </Card>

      {/* Top Contributors */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Top Contributors
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contributorsQuery.isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading contributors...
            </div>
          ) : topContributors.length > 0 ? (
            <div className="space-y-4">
              {topContributors.map((c) => {
                const avatar = getUserAvatar(c.avatarPath ?? undefined)
                return (
                  <Link
                    key={c.username}
                    href={`/u/${c.username}`}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={avatar ?? undefined} alt={c.username} />
                      <AvatarFallback>{(c.fullname || c.username)[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.fullname}</p>
                      <p className="text-xs text-muted-foreground">@{c.username}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">{c.postCount} posts</div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No contributors yet</p>
          )}
        </CardContent>
      </Card>

      {user ? (
        <Card className="border-border bg-gradient-to-br from-primary/10 to-primary/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PenSquare className="h-4 w-4 text-primary" />
              Start a Discussion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4 text-pretty">
              Have a question or want to share something? Create a new thread and engage with the community.
            </p>
            <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/new">Create Thread</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border bg-gradient-to-br from-primary/10 to-primary/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Join the Community
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4 text-pretty">
              Share your knowledge and learn from others in our growing community.
            </p>
            <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/register">Get Started</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
