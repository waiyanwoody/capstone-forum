"use client"

import { use, useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { ThreadDetail } from "@/components/thread-detail"
import { ThreadComments } from "@/components/thread-comments"
import { ThreadSidebar } from "@/components/thread-sidebar"
import { getPostBySlug } from "@/lib/api/posts"
import type { Post } from "@/lib/types"

type ThreadPageProps = {
  params: Promise<{
    slug: string
  }>
}

export default function ThreadPage({ params }: ThreadPageProps) {
  const { slug } = use(params)

  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const data = await getPostBySlug(slug)
        setPost(data)
      } catch (err: any) {
        setError(err.message || "Failed to load thread")
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [slug])

  if (loading) {
    return <div className="p-6">Loading thread...</div>
  }

  if (error || !post) {
    return (
      <div className="p-6 text-destructive">
        {error || "Thread not found"}
      </div>
    )
  }

  return (
    <AppShell sidebar={<ThreadSidebar post={post} />}>
      <div className="space-y-6">
        <ThreadDetail post={post} />

        <ThreadComments post={post} />
      </div>
    </AppShell>
  )
}