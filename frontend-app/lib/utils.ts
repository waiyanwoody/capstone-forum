import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getUserAvatar = (url: string | undefined) => {
  if (!url || url === "/placeholder.svg") return null;

   // If the URL is already a full absolute URL, return it directly
  if (url.startsWith("http")) return url;

  const storageType = process.env.NEXT_PUBLIC_STORAGE_TYPE; // e.g., 's3' or 'local'

  if (storageType === "s3") {
    const s3Url = process.env.NEXT_PUBLIC_S3_API_URL;
    return s3Url ? `${s3Url}/${url}` : url;
  }

  // Default / Fallback: redirect to localhost
  const localApiUrl = process.env.NEXT_PUBLIC_LOCAL_API_URL || "http://localhost:8080";
  return `${localApiUrl}/uploads/${url}`;
};

// Backend emits naive LocalDateTime strings in UTC (no offset marker).
// JS parses "2026-09-01T16:02:02.193" as the browser's local zone, so we
// explicitly treat these as UTC by appending "Z" when no offset is present.
export function parseServerDate(value?: string | null): Date {
  if (!value) return new Date(0);
  const hasOffset = /(Z|[+-]\d{2}:?\d{2})$/.test(value);
  return new Date(hasOffset ? value : value + "Z");
};

export function getPostPreview(excerpt?: string | null): string {
  const text = (excerpt ?? "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return text || "Image attachment";
}

export function getPostImages(content?: string | null): { alt: string; url: string }[] {
  if (!content) return [];

  return content
    .split("\n")
    .map((line) => line.trim().match(/^!\[([^\]]*)\]\((.+)\)$/))
    .filter((match): match is RegExpMatchArray => match !== null)
    .slice(0, 4)
    .map((match) => ({
      alt: match[1] || "Post image",
      url: encodeURI(match[2].trim()),
    }));
}