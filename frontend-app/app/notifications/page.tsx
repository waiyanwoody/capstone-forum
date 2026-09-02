"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { AppShell } from "@/components/app-shell"
import { NotificationList } from "@/components/notification-list"
import { NotificationFilters, type NotificationTab } from "@/components/notification-filters"
import { useNotifications } from "@/hooks/use-notifications"
import { markAllNotificationsRead, markNotificationRead } from "@/lib/api/notifications"
import { useAuth } from "@/contexts/auth-context"
import type { Notification } from "@/lib/types"

export default function NotificationsPage() {
  const { data, isLoading, isError } = useNotifications()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<NotificationTab>("all")

  const notifications = data ?? []
  const unreadCount = notifications.filter((n) => !n.read).length

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] })
    queryClient.invalidateQueries({ queryKey: ["notifications-unread"] })
  }

  const handleMarkAllRead = async () => {
    if (!user?.id || unreadCount === 0) return
    try {
      await markAllNotificationsRead(user.id)
    } finally {
      invalidate()
    }
  }

  const handleMarkRead = async (id: Notification["id"]) => {
    try {
      await markNotificationRead(id)
    } finally {
      invalidate()
    }
  }

  const filtered =
    activeTab === "unread" ? notifications.filter((n) => !n.read) : notifications

  return (
    <AppShell showSidebar={false}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Notifications</h1>
        </div>

        <NotificationFilters
          activeTab={activeTab}
          unreadCount={unreadCount}
          onTabChange={setActiveTab}
          onMarkAllRead={() => handleMarkAllRead()}
        />

        {isLoading ? (
          <p className="text-muted-foreground">Loading notifications...</p>
        ) : isError ? (
          <p className="text-destructive">Failed to load notifications.</p>
        ) : (
          <NotificationList notifications={filtered} onMarkRead={handleMarkRead} />
        )}
      </div>
    </AppShell>
  )
}