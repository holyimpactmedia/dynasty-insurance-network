"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
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
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""
  // Better Auth sends an expired or used link here as ?error=INVALID_TOKEN.
  const [tokenRejected, setTokenRejected] = useState(false)
  const linkInvalid = !token || searchParams.get("error") === "INVALID_TOKEN" || tokenRejected
  const router = useRouter()

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { error } = await authClient.resetPassword({ newPassword: password, token })
      if (error) {
        // A used or expired token gets the same clear message and a way forward.
        if (error.code === "INVALID_TOKEN") {
          setTokenRejected(true)
          return
        }
        setError(error.message || "Could not update the password. Please try again.")
        return
      }
      router.push("/auth/login")
    } catch {
      setError("Could not reach the server. Check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Choose a new password">
      <CardContent>
        {linkInvalid ? (
          <div className="space-y-4">
            <div className="p-3 text-sm text-red-400 bg-red-900/30 border border-red-500/30 rounded-lg">
              This reset link is invalid or expired.
            </div>
            <Link href="/auth/forgot-password" className="block text-center text-sm text-[#D4AF37] hover:underline">
              Request a new link
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-400 bg-red-900/30 border border-red-500/30 rounded-lg">{error}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">New password</Label>
              <Input
                id="password"
                type="password"
                minLength={8}
                maxLength={128}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D4AF37] text-[#0A1128] hover:bg-[#D4AF37]/90 font-semibold"
            >
              {loading ? "Updating..." : "Update password"}
            </Button>
          </form>
        )}
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
