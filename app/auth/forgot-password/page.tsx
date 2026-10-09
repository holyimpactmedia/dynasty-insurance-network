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
  const [error, setError] = useState<string | null>(null)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { error: requestError } = await authClient.requestPasswordReset({
        email: email.trim().toLowerCase(),
        redirectTo: "/auth/reset-password",
      })
      // Better Auth answers the same whether or not the account exists, so only
      // a transport or setup failure reaches this branch.
      if (requestError) {
        setError("Password reset is unavailable right now. Try again in a moment.")
        return
      }
      setSent(true)
    } catch {
      setError("Something went wrong reaching the auth service. Try again in a moment.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Reset password" description="Enter the email you use for the agent portal.">
      <CardContent className="space-y-5">
        {sent ? (
          <p className="text-sm text-green-400">If that account exists, a reset link has been sent.</p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-400 bg-red-900/30 border border-red-500/30 rounded-lg">{error}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D4AF37] text-[#0A1128] hover:bg-[#D4AF37]/90 font-semibold"
            >
              {loading ? "Sending..." : "Send reset link"}
            </Button>
          </form>
        )}
        <Link href="/auth/login" className="block text-center text-sm text-gray-500 hover:text-gray-300">
          Back to sign in
        </Link>
      </CardContent>
    </AuthShell>
  )
}
