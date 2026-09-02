"use client"

import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCheck } from "lucide-react"

export type NotificationTab = "all" | "unread"

type NotificationFiltersProps = {
  activeTab: NotificationTab
  unreadCount: number
  onTabChange: (tab: NotificationTab) => void
  onMarkAllRead: () => void
}

export function NotificationFilters({
  activeTab,
  unreadCount,
  onTabChange,
  onMarkAllRead,
}: NotificationFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
      <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as NotificationTab)} className="w-full sm:w-auto">
        <TabsList className="grid w-full sm:w-auto grid-cols-2 bg-muted">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread {unreadCount > 0 && `(${unreadCount})`}</TabsTrigger>
        </TabsList>
      </Tabs>

      <Button
        variant="outline"
        size="sm"
        className="gap-2 bg-transparent"
        onClick={onMarkAllRead}
        disabled={unreadCount === 0}
      >
        <CheckCheck className="h-4 w-4" />
        Mark all as read
      </Button>
    </div>
  )
}