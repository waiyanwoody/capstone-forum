"use client"

import { AppShell } from "@/components/app-shell"
import { NotificationList } from "@/components/notification-list"
import { NotificationFilters } from "@/components/notification-filters"
import { useNotifications } from "@/hooks/use-notifications"

export default function NotificationsPage() {
  const { data, isLoading, isError } = useNotifications()

  return (
    <AppShell showSidebar={false}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Notifications</h1>
        </div>

        <NotificationFilters />

        {isLoading ? (
          <p className="text-muted-foreground">Loading notifications...</p>
        ) : isError ? (
          <p className="text-destructive">Failed to load notifications.</p>
        ) : (
          <NotificationList notifications={data ?? []} />
        )}
      </div>
    </AppShell>
  )
}
