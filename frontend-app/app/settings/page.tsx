import { AppShell } from "@/components/app-shell"
import { SettingsForm } from "@/components/settings-form"

export default function SettingsPage() {
  return (
    <AppShell showSidebar={false}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>

        <SettingsForm />
      </div>
    </AppShell>
  )
}
