"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { X, Bold, Italic, Code, LinkIcon, Eye, Edit, Check, ChevronDown, ImagePlus } from "lucide-react"
import { MarkdownRenderer } from "./markdown-renderer"
import { useCreatePost } from "@/hooks/use-create-post"
import { useUpdatePost } from "@/hooks/use-update-post"
import {
  ALLOWED_TAGS,
  MAX_TAGS,
  POST_TYPES,
  typeToApi,
  type PostType,
} from "@/lib/constants"

type ThreadFormProps = {
  initialData?: {
    id?: number
    slug?: string
    title: string
    content: string
    tags: string[]
    type?: string
  }
  isEditing?: boolean
}

export function ThreadForm({ initialData, isEditing = false }: ThreadFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState(initialData?.title || "")
  const [content, setContent] = useState(initialData?.content || "")
  const [tags, setTags] = useState<string[]>(initialData?.tags || [])
  const [tagInput, setTagInput] = useState("")
  const [tagFocused, setTagFocused] = useState(false)
  const [type, setType] = useState<PostType>(
    (initialData?.type as PostType) || "Discussion"
  )
  const [previewMode, setPreviewMode] = useState<"write" | "preview">("write")

  const [images, setImages] = useState<{ url: string; name: string }[]>([])
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const MAX_IMAGES = 4

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const incoming = Array.from(files)
        .filter((f) => f.type.startsWith("image/"))
        .slice(0, MAX_IMAGES - images.length)
      if (incoming.length === 0) return
      const newImages = incoming.map((f) => ({
        url: URL.createObjectURL(f),
        name: f.name,
      }))
      setImages((prev) => [...prev, ...newImages].slice(0, MAX_IMAGES))
    },
    [images.length]
  )

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files?.length) {
      addFiles(e.dataTransfer.files)
    }
  }

  const removeImage = (url: string) => {
    setImages((prev) => prev.filter((img) => img.url !== url))
  }

  const handleSelectSuggestion = (tag: string) => {
    if (!tags.includes(tag) && tags.length < MAX_TAGS) {
      setTags([...tags, tag])
      setTagInput("")
      setTagFocused(true)
    }
  }

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault()
      const match = ALLOWED_TAGS.find(
        (t) => t.toLowerCase() === tagInput.trim().toLowerCase()
      )
      if (match) {
        handleSelectSuggestion(match)
      }
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const remaining = ALLOWED_TAGS.filter((t) => !tags.includes(t))

  const suggestions = tagInput.trim()
    ? remaining
        .filter((t) => t.toLowerCase().startsWith(tagInput.trim().toLowerCase()))
        .slice(0, 6)
    : remaining

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
      type: typeToApi(type),
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
    setType("Discussion")
    setPreviewMode("write")
    setImages((prev) => {
      prev.forEach((img) => URL.revokeObjectURL(img.url))
      return []
    })
    setDragOver(false)
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

      {/* Type */}
      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <div className="flex flex-wrap gap-2">
          {POST_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all active:scale-95 ${
                type === t
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-muted text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {type === t && <Check className="h-3.5 w-3.5" />}
              {t}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Discussion and Question posts can be marked as solved
        </p>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <div className="relative">
          <Input
            id="tags"
            type="text"
            placeholder="Start typing to choose from allowed tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            onFocus={() => setTagFocused(true)}
            onBlur={() => setTimeout(() => setTagFocused(false), 150)}
            className="bg-muted border-border"
            disabled={tags.length >= MAX_TAGS}
          />
          {tagFocused && suggestions.length > 0 && (
            <div className="absolute z-10 bottom-full mb-1 w-full rounded-lg border border-border bg-popover shadow-md">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSelectSuggestion(s)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                >
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
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
        <p className="text-xs text-muted-foreground">
          Choose up to {MAX_TAGS} tags from the allowed list ({tags.length}/{MAX_TAGS})
        </p>
      </div>

      {/* Images */}
      <div className="space-y-2">
        <Label>Images</Label>
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border bg-muted/50 hover:border-primary/40"
          }`}
        >
          <ImagePlus className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">
              Drag & drop images here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Up to {MAX_IMAGES} images ({images.length}/{MAX_IMAGES})
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files?.length) addFiles(e.target.files)
              e.target.value = ""
            }}
          />
        </div>

        {images.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((img) => (
              <div
                key={img.url}
                className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
              >
                <img src={img.url} alt={img.name} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeImage(img.url)
                  }}
                  className="absolute top-1.5 right-1.5 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Remove image"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
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
