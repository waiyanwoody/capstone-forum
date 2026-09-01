"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { requestPasswordReset } from "@/lib/auth"
import { Loader2, Mail, CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"

export function ForgotPasswordForm() {
  const [identifier, setIdentifier] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await requestPasswordReset(identifier)
      setSuccess(true)

      // Redirect to reset password page after 2 seconds
      setTimeout(() => {
        router.push(`/reset-password?identifier=${encodeURIComponent(identifier)}`)
      }, 2000)
    } catch (err: any) {
      console.log('error:', err);
      if (err.name === 'ApiHttpError') {
        const fieldErrors = err.errors as Record<string, string> | undefined
       
        if (!fieldErrors || Object.keys(fieldErrors).length === 0) {
          setError(err.message || 'Email Request failed')
        }
      } else {
        setError('Failed to request email. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-4 text-center p-6 rounded-lg bg-success/10 border border-success/20">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-success" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-success">Check your email</h3>
          <p className="text-sm text-muted-foreground">
            We've sent a 6-digit code to your email. Redirecting you to enter the code...
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-red-500 text-sm">{error}</div>}

      <div className="space-y-2">
        <Label htmlFor="identifier">Email or Username</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="identifier"
            type="text"
            placeholder="you@example.com or username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            disabled={isLoading}
            className="bg-muted border-border pl-10"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Enter the email address or username associated with your account.
        </p>
      </div>

      <Button
        type="submit"
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Sending code...
          </>
        ) : (
          "Send reset code"
        )}
      </Button>

      <div className="text-xs text-center text-muted-foreground p-3 bg-muted/50 rounded-lg">
        Demo: Use <span className="font-mono">demo@example.com</span> or <span className="font-mono">johndoe</span>
      </div>
    </form>
  )
}
