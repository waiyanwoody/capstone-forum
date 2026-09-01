import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import QueryProvider from "./providers/query-provider"
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "next-themes"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { RealtimeNotifications } from "@/components/realtime-notifications";

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Forum - Community Discussions",
  description: "A modern forum for developers and creators",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark">
            <AuthProvider>
            <QueryProvider>
              <RealtimeNotifications />
              {children}
              <Toaster position="bottom-right" reverseOrder={false} />
              <ReactQueryDevtools initialIsOpen={false} />
            </QueryProvider>
            </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
