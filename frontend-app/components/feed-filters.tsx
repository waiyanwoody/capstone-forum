"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Filter, TrendingUp, Clock, CheckCircle2, Star } from "lucide-react"

export function FeedFilters() {
  const [activeTab, setActiveTab] = useState("all")
  const [sortBy, setSortBy] = useState("recent")

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
        <TabsList className="grid w-full sm:w-auto grid-cols-4 bg-muted">
          <TabsTrigger value="all" className="text-xs sm:text-sm">
            All
          </TabsTrigger>
          <TabsTrigger value="trending" className="text-xs sm:text-sm">
            <TrendingUp className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Trending</span>
          </TabsTrigger>
          <TabsTrigger value="solved" className="text-xs sm:text-sm">
            <CheckCircle2 className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Solved</span>
          </TabsTrigger>
          <TabsTrigger value="following" className="text-xs sm:text-sm">
            <Star className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Following</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">
              {sortBy === "recent" && "Recent"}
              {sortBy === "popular" && "Popular"}
              {sortBy === "oldest" && "Oldest"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setSortBy("recent")}>
            <Clock className="h-4 w-4 mr-2" />
            Most Recent
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setSortBy("popular")}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Most Popular
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setSortBy("oldest")}>
            <Clock className="h-4 w-4 mr-2" />
            Oldest First
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
