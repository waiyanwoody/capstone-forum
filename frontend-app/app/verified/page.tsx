"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import Link from "next/link"

export default function VerifiedPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "ok" | "fail">("loading")
  const [reason, setReason] = useState<string>("")

  useEffect(() => {
    const statusParam = searchParams.get("status")
    const reasonParam = searchParams.get("reason")

    if (statusParam === "ok") {
      setStatus("ok")
    } else if (statusParam === "fail") {
      setStatus("fail")
      setReason(reasonParam || "Verification failed")
    } else {
      // Invalid status, redirect to home
      setTimeout(() => router.push("/"), 2000)
    }
  }, [searchParams, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Verifying your email...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === "ok" ? (
              <div className="rounded-full bg-green-500/10 p-3">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              </div>
            ) : (
              <div className="rounded-full bg-destructive/10 p-3">
                <XCircle className="h-12 w-12 text-destructive" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl">{status === "ok" ? "Email Verified!" : "Verification Failed"}</CardTitle>
          <CardDescription>
            {status === "ok"
              ? "Your email has been successfully verified. You can now access all features."
              : reason || "We couldn't verify your email address."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "ok" ? (
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/">Go to Home</Link>
              </Button>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/settings">Update Profile</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/register">Try Again</Link>
              </Button>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/">Go to Home</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
