type MarkdownRendererProps = {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Simple markdown rendering - in a real app, use a library like react-markdown
  return <div className="whitespace-pre-wrap text-pretty">{content}</div>
}
