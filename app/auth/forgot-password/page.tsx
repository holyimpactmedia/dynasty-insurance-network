"use client"

import { useState } from "react"
import Link from "next/link"
import { authClient } from "@/lib/auth/client"
import { AuthShell } from "@/components/auth/AuthShell"
import { Button } from "@/components/ui/button"
import { CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    await authClient.requestPasswordReset({
      email: email.trim().toLowerCase(),
      redirectTo: "/auth/reset-password",
    })
    setSent(true)
    setLoading(false)
  }

  return (
    <AuthShell title="Reset password" description="Enter your internal portal email.">
      <CardContent className="space-y-5">
        {sent ? (
          <p className="text-sm text-success">If that account exists, a reset link has been sent.</p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {/* Confirmation flow, not a conversion CTA: default variant resolves to
                Union navy via --primary. Union red is reserved for primary actions. */}
            <Button type="submit" disabled={loading} className="w-full h-11">
              {loading ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}
        <Link href="/auth/login" className="block text-center text-sm text-navy hover:underline">Back to sign in</Link>
      </CardContent>
    </AuthShell>
  )
}
