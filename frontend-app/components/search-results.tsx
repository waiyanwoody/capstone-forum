import { PostCard } from "./post-card"
import type { Post } from "@/lib/types"

type SearchResultsProps = {
  posts: Post[]
  query: string
}

export function SearchResults({ posts, query }: SearchResultsProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No results found for "{query}"</p>
        <p className="text-sm text-muted-foreground mt-2">Try adjusting your search terms</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
