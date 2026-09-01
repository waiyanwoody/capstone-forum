"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { X, Bold, Italic, Code, LinkIcon, ImageIcon, Eye, Edit } from "lucide-react"
import { MarkdownRenderer } from "./markdown-renderer"
import { useCreatePost } from "@/hooks/use-create-post"
import { useUpdatePost } from "@/hooks/use-update-post"

type ThreadFormProps = {
  initialData?: {
    id?: number
    slug?: string
    title: string
    content: string
    tags: string[]
  }
  isEditing?: boolean
}

export function ThreadForm({ initialData, isEditing = false }: ThreadFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState(initialData?.title || "")
  const [content, setContent] = useState(initialData?.content || "")
  const [tags, setTags] = useState<string[]>(initialData?.tags || [])
  const [tagInput, setTagInput] = useState("")
  const [previewMode, setPreviewMode] = useState<"write" | "preview">("write")

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault()
      if (!tags.includes(tagInput.trim()) && tags.length < 5) {
        setTags([...tags, tagInput.trim()])
        setTagInput("")
      }
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const insertMarkdown = (syntax: string, placeholder = "") => {
    const textarea = document.getElementById("content") as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    const textToInsert = selectedText || placeholder

    let newText = ""
    let cursorOffset = 0

    switch (syntax) {
      case "bold":
        newText = `**${textToInsert}**`
        cursorOffset = selectedText ? newText.length : 2
        break
      case "italic":
        newText = `*${textToInsert}*`
        cursorOffset = selectedText ? newText.length : 1
        break
      case "code":
        newText = `\`${textToInsert}\``
        cursorOffset = selectedText ? newText.length : 1
        break
      case "link":
        newText = `[${textToInsert || "link text"}](url)`
        cursorOffset = selectedText ? newText.length - 4 : 1
        break
      case "image":
        newText = `![${textToInsert || "alt text"}](image-url)`
        cursorOffset = selectedText ? newText.length - 11 : 2
        break
    }

    const newContent = content.substring(0, start) + newText + content.substring(end)
    setContent(newContent)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + cursorOffset, start + cursorOffset)
    }, 0)
  }

  const createPost = useCreatePost();
  const updatePost = useUpdatePost();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newPost = {
      title: title,
      content: content,
      tags: tags,
    };

    if (isEditing && initialData?.id) {
      updatePost.mutate(
        { id: initialData.id, payload: newPost },
        {
          onSuccess: () => {
            router.push(`/t/${initialData.slug || ""}`)
          },
        }
      )
      return
    }

    createPost.mutate(newPost, {
      onSuccess: (post) => {
        if (post?.slug) {
          router.push(`/t/${post.slug}`)
        } else {
          clearForm();
        }
      }
    });
  }

  const clearForm = () => {
    setTitle("")
    setContent("")
    setTags([])
    setTagInput("")
    setPreviewMode("write")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          type="text"
          placeholder="What's your question or topic?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="bg-muted border-border text-lg"
        />
        <p className="text-xs text-muted-foreground">
          Be specific and imagine you're asking a question to another person
        </p>
      </div>

      {/* Content with Preview */}
      <div className="space-y-2">
        <Label htmlFor="content">Description</Label>

        <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as "write" | "preview")}>
          <div className="flex items-center justify-between border border-border rounded-t-lg bg-muted p-2">
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => insertMarkdown("bold", "bold text")}
                disabled={previewMode === "preview"}
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => insertMarkdown("italic", "italic text")}
                disabled={previewMode === "preview"}
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => insertMarkdown("code", "code")}
                disabled={previewMode === "preview"}
              >
                <Code className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => insertMarkdown("link")}
                disabled={previewMode === "preview"}
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => insertMarkdown("image")}
                disabled={previewMode === "preview"}
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
            </div>

            <TabsList className="h-8 bg-background">
              <TabsTrigger value="write" className="text-xs gap-1.5">
                <Edit className="h-3 w-3" />
                Write
              </TabsTrigger>
              <TabsTrigger value="preview" className="text-xs gap-1.5">
                <Eye className="h-3 w-3" />
                Preview
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="write" className="mt-0">
            <Textarea
              id="content"
              placeholder="Provide all the details and context..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              className="min-h-[300px] resize-none bg-muted border-border rounded-t-none"
            />
          </TabsContent>

          <TabsContent value="preview" className="mt-0">
            <div className="min-h-[300px] p-4 bg-muted border border-border border-t-0 rounded-b-lg">
              {content ? (
                <MarkdownRenderer content={content} />
              ) : (
                <p className="text-muted-foreground italic">Nothing to preview yet. Start writing!</p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <p className="text-xs text-muted-foreground">Supports Markdown formatting</p>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          type="text"
          placeholder="Add up to 5 tags (press Enter)"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleAddTag}
          className="bg-muted border-border"
          disabled={tags.length >= 5}
        />
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1.5">
                {tag}
                <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">Add tags to help others find your thread ({tags.length}/5)</p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={!title.trim() || !content.trim() || tags.length === 0 || createPost.isPending || updatePost.isPending}>
          {createPost.isPending || updatePost.isPending ? (isEditing ? "Updating..." : "Creating...") : isEditing ? "Update Thread" : "Publish Thread"}
        </Button>
      </div>
    </form>
  )
}
