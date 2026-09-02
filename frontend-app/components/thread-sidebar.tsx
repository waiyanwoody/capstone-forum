import Link from "next/link"
import { Calendar, MessageSquare, ThumbsUp, Eye, User } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import type { Post } from "@/lib/types"
import { format } from "date-fns"
import { parseServerDate } from "@/lib/utils"

type ThreadSidebarProps = {
  post: Post
}

export function ThreadSidebar({ post }: ThreadSidebarProps) {
  return (
    <div className="space-y-6">
      {/* Thread Stats */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">Thread Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* <div className="flex items-center gap-3 text-sm">
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Likes</span>
            <span className="ml-auto font-medium">{post.likeCount}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Replies</span>
            <span className="ml-auto font-medium">{post.commentCount ?? post.replyCount}</span>
          </div> */}
          <div className="flex items-center gap-3 text-sm">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Views</span>
            <span className="ml-auto font-medium">{post.viewCount ?? 0}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Created</span>
            <span className="ml-auto font-medium text-xs">{format(parseServerDate(post.createdAt), "MMM d, yyyy")}</span>
          </div>
        </CardContent>
      </Card>

      {/* Author Card */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Author
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Link
            href={`/u/${post.author.username}`}
            className="flex items-start gap-3 hover:opacity-80 transition-opacity"
          >
            <Avatar className="h-12 w-12">
              <AvatarImage src={post.author.avatar_path ?? undefined} />
              <AvatarFallback>
  {(post.author.fullname || post.author.username || "?")[0].toUpperCase()}
</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{post.author.fullname}</p>
              <p className="text-sm text-muted-foreground">@{post.author.username}</p>
              {post.author.bio && <p className="text-xs text-muted-foreground mt-2 text-pretty">{post.author.bio}</p>}
            </div>
          </Link>
        </CardContent>
      </Card>

      {/* Related Tags */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">Related Tags</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
