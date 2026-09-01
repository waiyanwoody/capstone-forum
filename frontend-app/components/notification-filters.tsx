"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCheck } from "lucide-react"

export function NotificationFilters() {
  const [activeTab, setActiveTab] = useState("all")

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
        <TabsList className="grid w-full sm:w-auto grid-cols-3 bg-muted">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
          <TabsTrigger value="mentions">Mentions</TabsTrigger>
        </TabsList>
      </Tabs>

      <Button variant="outline" size="sm" className="gap-2 bg-transparent">
        <CheckCheck className="h-4 w-4" />
        Mark all as read
      </Button>
    </div>
  )
}
