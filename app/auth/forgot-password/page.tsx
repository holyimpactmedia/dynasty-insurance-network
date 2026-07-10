"use client"

import { useState } from "react"
import Link from "next/link"
import { authClient } from "@/lib/auth/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
    <div className="min-h-screen bg-[#0A1128] flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Reset password</h1>
          <p className="text-sm text-gray-500 mt-1">Enter your internal portal email.</p>
        </div>
        {sent ? (
          <p className="text-sm text-green-700">If that account exists, a reset link has been sent.</p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}
        <Link href="/auth/login" className="block text-center text-sm text-blue-600">Back to sign in</Link>
      </Card>
    </div>
  )
}
