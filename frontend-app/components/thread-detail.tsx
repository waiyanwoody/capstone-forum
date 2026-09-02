"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ThumbsUp,
  Bookmark,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { MarkdownRenderer } from "@/components/markdown-renderer"
import { LikersDialog } from "@/components/likers-dialog"

import { useToggleLike } from "@/hooks/use-toggle-like"
import { useToggleSave } from "@/hooks/use-toggle-save"

import { deletePost, toggleSolved } from "@/lib/api/posts"
import type { Post } from "@/lib/types"

import { formatDistanceToNow } from "date-fns"
import { parseServerDate } from "@/lib/utils"
import { postIsSolvable, postTypeLabel } from "@/lib/constants"
import { useAuth } from "@/contexts/auth-context"

type ThreadDetailProps = {
  post: Post
}

export function ThreadDetail({ post }: ThreadDetailProps) {
  const router = useRouter()
  const { user } = useAuth()

  const [isDeleting, setIsDeleting] = useState(false)
  const [isSolved, setIsSolved] = useState(post.isSolved ?? false)
  const [solvedPending, setSolvedPending] = useState(false)
  const [likersOpen, setLikersOpen] = useState(false)

  const {
    liked,
    likeCount,
    toggle,
    isPending,
  } = useToggleLike(
    post.id,
    post.liked ?? false,
    post.likeCount ?? 0,
  )

  const {
    saved,
    toggle: toggleSave,
    isPending: isSavePending,
  } = useToggleSave(
    post.id,
    post.isSaved ?? false,
  )

  const timeAgo = formatDistanceToNow(
    parseServerDate(post.createdAt),
    { addSuffix: true },
  )

  const isOwnerOrAdmin =
    !!user &&
    (
      String(user.id) === String(post.author.id) ||
      user.role === "ADMIN"
    )

  // --------------------------------------------------
  // Toggle solved
  // --------------------------------------------------

  const handleToggleSolved = async () => {
    if (solvedPending) return

    setSolvedPending(true)

    try {
      const updated = await toggleSolved(post.id)

      setIsSolved(
        updated.isSolved ?? !isSolved,
      )
    } catch (error: any) {
      window.alert(
        error.message || "Failed to update solved status",
      )
    } finally {
      setSolvedPending(false)
    }
  }

  // --------------------------------------------------
  // Delete
  // --------------------------------------------------

  const handleDelete = async () => {
    if (isDeleting) return

    const confirmed = window.confirm(
      "Are you sure you want to delete this thread?",
    )

    if (!confirmed) return

    setIsDeleting(true)

    try {
      await deletePost(post.id)

      router.push("/")
    } catch (error: any) {
      window.alert(
        error.message || "Failed to delete thread",
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <article
      className="
        w-full
        rounded-lg
        border
        border-border
        bg-card
        p-4
        sm:p-6
        space-y-5
        sm:space-y-6
      "
    >
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
        {/* Avatar */}

        <Link
          href={`/u/${post.author.username}`}
          className="shrink-0"
        >
          <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
            <AvatarImage
              src={post.author.avatar_path ?? undefined}
              alt={post.author.fullname}
            />

            <AvatarFallback>
              {(post.author.fullname || post.author.username)
                .slice(0, 2)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>

        {/* Author information */}

        <div className="min-w-0 flex-1">
          {/* Name + username + type */}

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link
              href={`/u/${post.author.username}`}
              className="
                truncate
                font-semibold
                transition-colors
                hover:text-primary
              "
            >
              {post.author.fullname}
            </Link>

            <span className="truncate text-sm text-muted-foreground">
              @{post.author.username}
            </span>

            {post.type && (
              <span
                className="
                  rounded-full
                  bg-muted/80
                  px-2
                  py-0.5
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-wide
                  text-muted-foreground
                  sm:text-[11px]
                "
              >
                {postTypeLabel(post.type)}
              </span>
            )}
          </div>

          {/* Time + views */}

          <div
            className="
              mt-1
              flex
              flex-wrap
              items-center
              gap-x-3
              gap-y-1
              text-xs
              text-muted-foreground
              sm:text-sm
            "
          >
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>{timeAgo}</span>
            </span>

            <span className="text-muted-foreground/40">
              ·
            </span>

            <span className="inline-flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 shrink-0" />

              <span>
                {post.viewCount ?? 0}{" "}
                {post.viewCount === 1
                  ? "view"
                  : "views"}
              </span>
            </span>
          </div>
        </div>

        {/* More menu */}

        {isOwnerOrAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 sm:h-9 sm:w-9"
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() =>
                  router.push(`/t/${post.slug}/edit`)
                }
              >
                Edit
              </DropdownMenuItem>

              <DropdownMenuItem>
                Report
              </DropdownMenuItem>

              <DropdownMenuItem
                className="text-destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting
                  ? "Deleting..."
                  : "Delete"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* ==================================================
          TITLE
      ================================================== */}

      <div
        className="
          flex
          flex-col
          items-start
          gap-2
          sm:flex-row
          sm:items-start
          sm:gap-3
        "
      >
        <h1
          className="
            min-w-0
            flex-1
            text-2xl
            font-bold
            leading-tight
            text-balance
            sm:text-3xl
          "
        >
          {post.title}
        </h1>

        {isSolved && (
          <Badge
            variant="outline"
            className="
              shrink-0
              gap-1
              border-green-500/60
              text-green-600
              dark:text-green-400
            "
          >
            <CheckCircle2
              className="h-3.5 w-3.5 fill-current"
            />

            <span>
              Solved
            </span>
          </Badge>
        )}
      </div>

      {/* ==================================================
          TAGS
      ================================================== */}

      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {post.tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-xs sm:text-sm"
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* ==================================================
          CONTENT
      ================================================== */}

      <div
        className="
          prose
          prose-sm
          max-w-none
          prose-slate
          dark:prose-invert
          sm:prose-base
        "
      >
        <MarkdownRenderer
          content={post.content}
        />
      </div>

      {/* ==================================================
          ACTIONS
      ================================================== */}

      <div
        className="
          flex
          flex-wrap
          items-center
          gap-2
          border-t
          border-border
          pt-4
        "
      >
        {/* ==================================================
            LIKE
        ================================================== */}

        <Button
          variant={liked ? "default" : "outline"}
          size="sm"
          className="
            gap-2
            transition-all
            active:scale-95
          "
          onClick={toggle}
          disabled={isPending}
        >
          <ThumbsUp
            className={`
              h-4 w-4
              transition-all
              ${
                liked
                  ? "fill-current scale-110 animate-in zoom-in-50 duration-200"
                  : ""
              }
            `}
          />

          <span>
            {likeCount}
          </span>
        </Button>

        {/* ==================================================
            LIKED BY
        ================================================== */}

        {likeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="
              min-w-0
              flex-1
              justify-start
              text-muted-foreground
              sm:flex-none
            "
            onClick={() =>
              setLikersOpen(true)
            }
          >
            <span className="truncate">
              Liked by {likeCount}
            </span>
          </Button>
        )}

        {/* Likers dialog */}

        <LikersDialog
          open={likersOpen}
          onOpenChange={setLikersOpen}
          postId={post.id}
          likeCount={likeCount}
        />

        {/* ==================================================
            SAVE
        ================================================== */}

        <Button
          variant={saved ? "default" : "outline"}
          size="sm"
          className="
            gap-2
            transition-all
            active:scale-95
          "
          onClick={toggleSave}
          disabled={isSavePending}
        >
          <Bookmark
            className={`
              h-4 w-4
              transition-all
              ${
                saved
                  ? "fill-current scale-110 animate-in zoom-in-50 duration-200"
                  : ""
              }
            `}
          />

          <span>
            {saved
              ? "Saved"
              : "Save"}
          </span>
        </Button>

        {/* ==================================================
            SOLVED
        ================================================== */}

        {isOwnerOrAdmin &&
          postIsSolvable(post.type) && (
            <Button
              variant={
                isSolved
                  ? "default"
                  : "outline"
              }
              size="sm"
              className={`
                gap-2
                transition-all
                active:scale-95
                ${
                  isSolved
                    ? "border-green-500/60 text-green-600 dark:text-green-400"
                    : ""
                }
              `}
              onClick={
                handleToggleSolved
              }
              disabled={
                solvedPending
              }
            >
              {solvedPending ? (
                <Loader2
                  className="
                    h-4 w-4
                    animate-spin
                  "
                />
              ) : (
                <CheckCircle2
                  className={`
                    h-4 w-4
                    transition-all
                    ${
                      isSolved
                        ? "fill-current scale-110 animate-in zoom-in-50 duration-200"
                        : ""
                    }
                  `}
                />
              )}

              {/* Desktop */}

              <span className="hidden sm:inline">
                {isSolved
                  ? "Mark Unsolved"
                  : "Mark as Solved"}
              </span>

              {/* Mobile */}

              <span className="sm:hidden">
                {isSolved
                  ? "Unsolve"
                  : "Solved"}
              </span>
            </Button>
          )}
      </div>
    </article>
  )
}
