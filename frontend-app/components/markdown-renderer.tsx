type MarkdownRendererProps = {
  content: string
}

const imageMarkdownPattern = /^!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)$/

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="space-y-4 text-pretty">
      {content.split("\n").map((line, index) => {
        const image = line.trim().match(imageMarkdownPattern)

        if (image) {
          return (
            <img
              key={`${image[2]}-${index}`}
              src={image[2]}
              alt={image[1] || "Post image"}
              loading="lazy"
              className="max-h-[32rem] max-w-full rounded-lg object-contain"
            />
          )
        }

        return line ? (
          <p key={index} className="whitespace-pre-wrap">
            {line}
          </p>
        ) : null
      })}
    </div>
  )
}
