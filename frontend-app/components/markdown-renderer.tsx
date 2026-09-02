 "use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

type MarkdownRendererProps = {
  content: string
}

const imageMarkdownPattern = /^!\[([^\]]*)\]\((.+)\)$/
type ContentBlock =
  | { type: "text"; line: string; index: number }
  | { type: "images"; images: { alt: string; url: string; index: number }[] }

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const lines = content.split("\n")
  const blocks: ContentBlock[] = []

  for (let index = 0; index < lines.length; index++) {
    const image = lines[index].trim().match(imageMarkdownPattern)
    if (!image) {
      blocks.push({ type: "text", line: lines[index], index })
      continue
    }

    const images = [{ alt: image[1], url: image[2].trim(), index }]
    while (images.length < 4 && index + 1 < lines.length) {
      let nextIndex = index + 1
      while (nextIndex < lines.length && !lines[nextIndex].trim()) nextIndex++
      const nextImage = lines[nextIndex]?.trim().match(imageMarkdownPattern)
      if (!nextImage) break
      index = nextIndex
      images.push({ alt: nextImage[1], url: nextImage[2].trim(), index })
    }
    blocks.push({ type: "images", images })
  }

  return (
    <div className="space-y-4 text-pretty">
      {blocks.map((block) =>
        block.type === "images" ? (
          <ImageGallery key={block.images[0].index} images={block.images} />
        ) : block.line ? (
          <p key={block.index} className="whitespace-pre-wrap">{block.line}</p>
        ) : null
      )}
    </div>
  )
}

function ImageGallery({
  images,
}: {
  images: { alt: string; url: string; index: number }[]
}) {
  const [selectedImage, setSelectedImage] = useState<{
    alt: string
    url: string
  } | null>(null)

  const count = Math.min(images.length, 4)

  const gridClass =
    count === 1
      ? "grid-cols-1"
      : count === 2
        ? "grid-cols-2"
        : count === 3
          ? "grid-cols-3"
          : "grid-cols-2"

  return (
    <>
      <div
        className={`grid ${gridClass} gap-2 overflow-hidden rounded-lg`}
      >
        {images.slice(0, 4).map((image) => (
          <button
            key={`${image.url}-${image.index}`}
            type="button"
            onClick={() => setSelectedImage(image)}
            aria-label={`View ${image.alt || "post image"} full size`}
            className={`group relative overflow-hidden bg-muted ${
              count === 1
                ? "aspect-video w-full"
                : count === 2
                  ? "aspect-video w-full"
                  : "aspect-[4/3] w-full"
            }`}
          >
            <img
              src={image.url}
              alt={image.alt || "Post image"}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      <Dialog
        open={!!selectedImage}
        onOpenChange={(open) => {
          if (!open) setSelectedImage(null)
        }}
      >
        <DialogContent className="max-w-6xl border-none bg-black/90 p-2 sm:p-4">
          <DialogTitle className="sr-only">
            {selectedImage?.alt || "Post image"}
          </DialogTitle>

          {selectedImage && (
            <img
              src={selectedImage.url}
              alt={selectedImage.alt || "Post image"}
              className="max-h-[85vh] w-full object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
