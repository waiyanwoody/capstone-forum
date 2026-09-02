import { getPostImages } from "@/lib/utils"

type PostImageStripProps = {
  content?: string | null
}

export function PostImageStrip({ content }: PostImageStripProps) {
  const images = getPostImages(content)
  if (!images.length) return null

  return (
    <div
      className="flex w-full max-w-sm flex-nowrap gap-2 overflow-hidden rounded-md"
      aria-label={`${images.length} post image${images.length === 1 ? "" : "s"}`}
    >
      {images.map((image, index) => (
        <img
          key={`${image.url}-${index}`}
          src={image.url}
          alt={image.alt}
          loading="lazy"
          className="h-20 w-20 shrink-0 rounded-md object-cover"
        />
      ))}
    </div>
  )
}
