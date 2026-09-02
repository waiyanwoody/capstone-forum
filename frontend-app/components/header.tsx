"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, Bell, MessageSquare, Menu, Plus, Moon, Sun, Monitor, LogOut, User, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/contexts/auth-context"
import { getUserAvatar } from "@/lib/utils"
import { useTheme } from "next-themes"
import { useUnreadCount } from "@/hooks/use-unread-count"
import { useChatStore } from "@/hooks/use-chat"

export function Header() {
  const [searchQuery, setSearchQuery] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const { user, isAuthenticated, logout } = useAuth()
  const { data: unreadCount = 0 } = useUnreadCount()
  const { unreadTotal: msgUnread } = useChatStore()
  const router = useRouter()

  const [shake, setShake] = useState(false)
  const prevUnread = useRef(unreadCount)
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (unreadCount > prevUnread.current) {
      setShake(true)
      if (shakeTimer.current) clearTimeout(shakeTimer.current)
      shakeTimer.current = setTimeout(() => setShake(false), 600)
    }
    prevUnread.current = unreadCount
  }, [unreadCount])

  useEffect(() => {
    return () => {
      if (shakeTimer.current) clearTimeout(shakeTimer.current)
    }
  }, [])

  const avatarUrl = getUserAvatar(user?.avatar_path);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
              F
            </div>
            <span className="hidden sm:inline">Forum</span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search discussions..."
                className="pl-10 pr-20 bg-muted border-border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-xs text-muted-foreground">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Button asChild className="hidden sm:flex bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Link href="/new">
                    <Plus className="h-4 w-4 mr-2" />
                    New Thread
                  </Link>
                </Button>

                {/* Theme Toggle */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="hidden sm:flex">
                      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                      <span className="sr-only">Toggle theme</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setTheme("light")}>
                      <Sun className="h-4 w-4 mr-2" />
                      Light
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("dark")}>
                      <Moon className="h-4 w-4 mr-2" />
                      Dark
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("system")}>
                      <Monitor className="h-4 w-4 mr-2" />
                      System
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Messages */}
                <Button variant="ghost" size="icon" className="relative hidden sm:flex" asChild>
                  <Link href="/messages" aria-label="Messages">
                    <MessageSquare className="h-5 w-5" />
                    {msgUnread > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white dark:ring-border">
                        {msgUnread > 99 ? "99+" : msgUnread}
                      </span>
                    )}
                    <span className="sr-only">Messages</span>
                  </Link>
                </Button>

                {/* Notifications */}
                <Button variant="ghost" size="icon" className={`relative hidden sm:flex ${shake ? "animate-shake" : ""}`} asChild>
                  <Link href="/notifications">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white dark:ring-border">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                    <span className="sr-only">Notifications</span>
                  </Link>
                </Button>

                {/* User Menu - Desktop */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full hidden sm:flex">
                        <Avatar className="h-8 w-8">
                        {user?.avatar_path? (
                          <AvatarImage src={avatarUrl ?? undefined} />
                        ) : (
                          <AvatarFallback>{user?.fullname?.charAt(0) || "U"}</AvatarFallback>
                        )}
                        </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{user?.fullname}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/u/${user?.username}`}>
                        <User className="h-4 w-4 mr-2" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/notifications">
                        <Bell className="h-4 w-4 mr-2" />
                        Notifications
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-error">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild className="hidden sm:flex">
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild className="hidden sm:flex bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Link href="/register">Get Started</Link>
                </Button>
              </>
            )}

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="sm:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-6">
                  {/* Mobile Search */}
                  <form onSubmit={handleSearch}>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search discussions..."
                        className="pl-10 bg-muted border-border"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </form>

                  {isAuthenticated ? (
                    <>
                      {/* User Info */}
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                        <Avatar className="h-10 w-10">
                          {user?.avatar_path? (
                          <AvatarImage src={avatarUrl ?? undefined} />
                        ) : (
                          <AvatarFallback>{user?.fullname?.charAt(0) || "U"}</AvatarFallback>
                        )}
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{user?.fullname}</p>
                          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                        </div>
                      </div>

                      {/* Navigation Links */}
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          className="justify-start"
                          asChild
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Link href="/new">
                            <Plus className="h-4 w-4 mr-2" />
                            New Thread
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          className="justify-start"
                          asChild
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Link href={`/u/${user?.username}`}>
                            <User className="h-4 w-4 mr-2" />
                            Profile
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          className="justify-start relative"
                          asChild
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Link href="/messages">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Messages
                            {msgUnread > 0 && (
                              <span className="absolute top-1.5 left-8 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
                                {msgUnread > 99 ? "99+" : msgUnread}
                              </span>
                            )}
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          className="justify-start relative"
                          asChild
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Link href="/notifications">
                            <Bell className="h-4 w-4 mr-2" />
                            Notifications
                            {unreadCount > 0 && (
                              <span className="absolute top-1.5 left-8 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
                                {unreadCount > 99 ? "99+" : unreadCount}
                              </span>
                            )}
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          className="justify-start"
                          asChild
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Link href="/settings">
                            <Settings className="h-4 w-4 mr-2" />
                            Settings
                          </Link>
                        </Button>
                      </div>

                      {/* Theme Toggle */}
                      <div className="border-t border-border pt-4">
                        <p className="text-sm font-medium mb-2 px-3">Theme</p>
                        <div className="flex flex-col gap-1">
                          <Button
                            variant={theme === "light" ? "secondary" : "ghost"}
                            className="justify-start"
                            onClick={() => setTheme("light")}
                          >
                            <Sun className="h-4 w-4 mr-2" />
                            Light
                          </Button>
                          <Button
                            variant={theme === "dark" ? "secondary" : "ghost"}
                            className="justify-start"
                            onClick={() => setTheme("dark")}
                          >
                            <Moon className="h-4 w-4 mr-2" />
                            Dark
                          </Button>
                          <Button
                            variant={theme === "system" ? "secondary" : "ghost"}
                            className="justify-start"
                            onClick={() => setTheme("system")}
                          >
                            <Monitor className="h-4 w-4 mr-2" />
                            System
                          </Button>
                        </div>
                      </div>

                      {/* Logout */}
                      <div className="border-t border-border pt-4">
                        <Button
                          variant="ghost"
                          className="justify-start text-error w-full"
                          onClick={() => {
                            logout()
                            setMobileMenuOpen(false)
                          }}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Sign Out
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Button asChild onClick={() => setMobileMenuOpen(false)}>
                        <Link href="/login">Sign in</Link>
                      </Button>
                      <Button asChild variant="outline" onClick={() => setMobileMenuOpen(false)}>
                        <Link href="/register">Get Started</Link>
                      </Button>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
