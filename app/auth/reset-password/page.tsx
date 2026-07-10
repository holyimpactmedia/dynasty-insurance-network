"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { authClient } from "@/lib/auth/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
    <div className="min-h-screen bg-[#0A1128] flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 space-y-5">
        <h1 className="text-2xl font-bold">Choose a new password</h1>
        <form onSubmit={submit} className="space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input id="password" type="password" minLength={8} maxLength={128} required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" disabled={loading || !token} className="w-full">
            {loading ? "Updating…" : "Update password"}
          </Button>
        </form>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A1128]" />}>
      <ResetPasswordForm />
    </Suspense>
  )
}
