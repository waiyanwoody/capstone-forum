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