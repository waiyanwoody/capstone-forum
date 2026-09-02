"use client"

import type { ReactNode } from "react"
import { Header } from "./header"

type AppShellProps = {
  children: ReactNode
  sidebar?: ReactNode
  showSidebar?: boolean
}

export function AppShell({ children, sidebar, showSidebar = true }: AppShellProps) {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        {/* Main content scrolls */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto">
          <div className="flex gap-8 min-h-full">
            <div className="flex-1 min-w-0">{children}</div>

            {showSidebar && sidebar && (
              <aside className="hidden lg:block w-80 shrink-0 self-start sticky top-8 max-h-[calc(100svh-6rem)] overflow-y-auto no-scrollbar">
                {sidebar}
              </aside>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
