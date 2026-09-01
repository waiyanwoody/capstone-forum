"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SlidersHorizontal } from "lucide-react"

export function SearchFilters() {
  const [activeTab, setActiveTab] = useState("posts")
  const [sortBy, setSortBy] = useState("relevance")

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
        <TabsList className="grid w-full sm:w-auto grid-cols-3 bg-muted">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
        </TabsList>
      </Tabs>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">
              {sortBy === "relevance" && "Relevance"}
              {sortBy === "recent" && "Recent"}
              {sortBy === "popular" && "Popular"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setSortBy("relevance")}>Most Relevant</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setSortBy("recent")}>Most Recent</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setSortBy("popular")}>Most Popular</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
