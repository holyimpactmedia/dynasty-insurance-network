"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { authClient } from "@/lib/auth/client"
import { AuthShell } from "@/components/auth/AuthShell"
import { Button } from "@/components/ui/button"
import { CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function ResetPasswordForm() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const token = useSearchParams().get("token") || ""
  const router = useRouter()

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await authClient.resetPassword({ newPassword: password, token })
    if (error) {
      setError(error.message || "This reset link is invalid or expired.")
      setLoading(false)
      return
    }
    router.push("/auth/login")
  }

  return (
    <AuthShell title="Choose a new password">
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">{error}</div>
          )}
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input id="password" type="password" minLength={8} maxLength={128} required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {/* Confirmation flow, not a conversion CTA: default variant is Union navy. */}
          <Button type="submit" disabled={loading || !token} className="w-full h-11">
            {loading ? "Updating…" : "Update password"}
          </Button>
        </form>
      </CardContent>
    </AuthShell>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthShell title="Choose a new password" />}>
      <ResetPasswordForm />
    </Suspense>
  )
}
