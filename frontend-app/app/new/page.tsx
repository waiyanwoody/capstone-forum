import { AppShell } from "@/components/app-shell"
import { ThreadForm } from "@/components/thread-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function NewThreadPage() {
  return (
    <AppShell showSidebar={false}>
      <div className="max-w-3xl mx-auto">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-2xl">Create a New Thread</CardTitle>
            <CardDescription>Share your question or start a discussion with the community</CardDescription>
          </CardHeader>
          <CardContent>
            <ThreadForm />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
