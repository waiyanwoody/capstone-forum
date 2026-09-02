"use client"

import { useEffect, useState } from "react"
import { use } from "react"
import { AppShell } from "@/components/app-shell"
import { ThreadForm } from "@/components/thread-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getPostBySlug } from "@/lib/api/posts"
import type { Post } from "@/lib/types"

type EditThreadPageProps = {
  params: Promise<{
    slug: string
  }>
}

export default function EditThreadPage({ params }: EditThreadPageProps) {
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
    return (
      <AppShell showSidebar={false}>
        <div className="p-6">Loading thread...</div>
      </AppShell>
    )
  }

  if (error || !post) {
    return (
      <AppShell showSidebar={false}>
        <div className="p-6 text-destructive">{error || "Thread not found"}</div>
      </AppShell>
    )
  }

  return (
    <AppShell showSidebar={false}>
      <div className="max-w-3xl mx-auto">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-2xl">Edit Thread</CardTitle>
            <CardDescription>Update your thread details</CardDescription>
          </CardHeader>
          <CardContent>
            <ThreadForm
              initialData={{
                id: post.id,
                slug: post.slug,
                title: post.title,
                content: post.content,
                tags: post.tags ?? [],
                type: post.type,
              }}
              isEditing
            />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
