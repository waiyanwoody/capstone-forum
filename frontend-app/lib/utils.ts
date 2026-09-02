import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getUserAvatar = (url: string | undefined) => {
  if (!url || url === "/placeholder.svg") return null;
  // Assuming the API URL is stored in an environment variable
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const avatar = url.startsWith("http") ? url : `${apiUrl}/uploads/${url}`;
  console.log(avatar);

  return avatar;
};

// Backend emits naive LocalDateTime strings in UTC (no offset marker).
// JS parses "2026-09-01T16:02:02.193" as the browser's local zone, so we
// explicitly treat these as UTC by appending "Z" when no offset is present.
export function parseServerDate(value?: string | null): Date {
  if (!value) return new Date(0);
  const hasOffset = /(Z|[+-]\d{2}:?\d{2})$/.test(value);
  return new Date(hasOffset ? value : value + "Z");
};