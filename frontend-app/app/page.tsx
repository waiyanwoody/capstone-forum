"use client"

import { useState, useEffect, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { AppShell } from "@/components/app-shell"
import { Sidebar } from "@/components/sidebar"
import { PostCard } from "@/components/post-card"
import { Loader2, TrendingUp, CheckCircle2, Star } from "lucide-react"
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
          <div>
            <h1 className="text-2xl font-bold text-balance sm:text-3xl">Discussions</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Join the conversation — {posts?.pages[0]?.totalElements ?? 0} threads and growing
            </p>
          </div>
        </div>

        <div className="inline-flex max-w-full items-center gap-1 rounded-full border border-border bg-card p-1 shadow-sm">
          <button
            onClick={() => setActiveFilter("all")}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              activeFilter === "all"
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            All
            <span
              className={`rounded-full px-1.5 text-xs font-semibold ${
                activeFilter === "all" ? "bg-white/20" : "bg-muted"
              }`}
            >
              {posts?.pages[0]?.totalElements ?? 0}
            </span>
          </button>
          <button
            onClick={() => setActiveFilter("trending")}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              activeFilter === "trending"
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Trending
          </button>
          <button
            onClick={() => setActiveFilter("solved")}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              activeFilter === "solved"
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Solved
          </button>
          <button
            onClick={() => setActiveFilter("following")}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              activeFilter === "following"
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Star className="h-3.5 w-3.5" />
            Following
          </button>
        </div>

        <div className="space-y-4">
          {activeFilter === "following" ? (
            followingPosts.length > 0 ? (
              followingPosts.map((post, i) => (
                <div key={post.id} className="animate-card-rise" style={{ animationDelay: `${Math.min(i, 10) * 60}ms` }}>
                  <PostCard post={post} />
                </div>
              ))
            ) : !followingQuery.isLoading && !followingQuery.isFetching ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>You are not following anyone yet</p>
                <p className="text-sm mt-2">Follow users to see their posts here</p>
              </div>
            ) : null
          ) : (
            posts?.pages.map((page, pageIndex) =>
              page.content.map((post, i) => (
                <div key={`${pageIndex}-${post.id}`} className="animate-card-rise" style={{ animationDelay: `${Math.min(i, 10) * 60}ms` }}>
                  <PostCard post={post} />
                </div>
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
