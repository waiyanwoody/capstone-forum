"use client"

import { useState, useEffect, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { AppShell } from "@/components/app-shell"
import { Sidebar } from "@/components/sidebar"
import { PostCard } from "@/components/post-card"
import { Loader2, TrendingUp, CheckCircle2, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useFetchPosts, type FilterTab } from "@/hooks/use-fetch-post"
import { getPostsByFollowing } from "@/lib/api/posts"
import { ProtectedRoute } from "@/components/protected-route"
import type { Post } from "@/lib/types"

export default function HomePage() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all")

  const {
    data: posts,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isError,
  } = useFetchPosts(10, activeFilter === "following" ? "all" : activeFilter)

  const followingQuery = useQuery<Post[]>({
    queryKey: ["following-posts"],
    queryFn: () => getPostsByFollowing(),
    enabled: activeFilter === "following",
  })

  const observerTarget = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scrollRoot = document.querySelector("main") as HTMLElement | null
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { root: scrollRoot, rootMargin: "150px", threshold: 0.1 },
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const followingPosts = followingQuery.data ?? []

  return (
    <ProtectedRoute>
    <AppShell sidebar={<Sidebar />}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-balance">Discussions</h1>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Button
            variant={activeFilter === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveFilter("all")}
            className={
              activeFilter === "all"
                ? "bg-card hover:bg-card/80 text-foreground border border-border"
                : "text-muted-foreground hover:text-foreground hover:bg-card/50"
            }
          >
            All
          </Button>
          <Button
            variant={activeFilter === "trending" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveFilter("trending")}
            className={
              activeFilter === "trending"
                ? "bg-card hover:bg-card/80 text-foreground border border-border"
                : "text-muted-foreground hover:text-foreground hover:bg-card/50"
            }
          >
            <TrendingUp className="h-4 w-4 mr-1.5" />
            Trending
          </Button>
          <Button
            variant={activeFilter === "solved" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveFilter("solved")}
            className={
              activeFilter === "solved"
                ? "bg-card hover:bg-card/80 text-foreground border border-border"
                : "text-muted-foreground hover:text-foreground hover:bg-card/50"
            }
          >
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            Solved
          </Button>
          <Button
            variant={activeFilter === "following" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveFilter("following")}
            className={
              activeFilter === "following"
                ? "bg-card hover:bg-card/80 text-foreground border border-border"
                : "text-muted-foreground hover:text-foreground hover:bg-card/50"
            }
          >
            <Star className="h-4 w-4 mr-1.5" />
            Following
          </Button>
        </div>

        <div className="space-y-4">
          {activeFilter === "following" ? (
            followingPosts.length > 0 ? (
              followingPosts.map((post) => <PostCard key={post.id} post={post} />)
            ) : !followingQuery.isLoading && !followingQuery.isFetching ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>You are not following anyone yet</p>
                <p className="text-sm mt-2">Follow users to see their posts here</p>
              </div>
            ) : null
          ) : (
            posts?.pages.map((page, pageIndex) =>
              page.content.map(post => (
                <PostCard key={`${pageIndex}-${post.id}`} post={post} />
              ))
            )
          )}
        </div>

        {activeFilter !== "following" && hasNextPage && (
          <div ref={observerTarget} className="flex justify-center py-8">
            {isFetchingNextPage && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>loading more posts...</span>
              </div>
            )}
          </div>
        )}

        {activeFilter !== "following" && !hasNextPage && posts && posts.pages.length > 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>You've reached the end!</p>
          </div>
        )}
      </div>
      </AppShell>
      </ProtectedRoute>
  )
}
