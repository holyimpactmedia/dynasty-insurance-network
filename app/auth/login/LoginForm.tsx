"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Shield, Eye, EyeOff } from "lucide-react"
import { authClient } from "@/lib/auth/client"
import { safeRedirect } from "@/lib/auth/safeRedirect"
import { AuthShell } from "@/components/auth/AuthShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CardContent } from "@/components/ui/card"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = safeRedirect(searchParams.get("redirectTo"))

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error: signInError } = await authClient.signIn.email({
        email: email.trim().toLowerCase(),
        password,
        callbackURL: redirectTo,
      })
      if (signInError) {
        setError(signInError.message || "Unable to sign in.")
        setIsLoading(false)
        return
      }

      router.push(redirectTo)
      router.refresh()
    } catch {
      setError("Something went wrong reaching the auth service. Try again in a moment.")
      setIsLoading(false)
    }
  }

  return (
    <AuthShell title="Agent Portal" description="Sign in to access your dashboard">
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">{error}</div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="agent@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input id="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required className="pr-10" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-navy">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" disabled={isLoading} className="w-full h-11 bg-red text-white font-bold hover:bg-red/90">
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
          <Link href="/auth/forgot-password" className="block text-center text-sm text-navy hover:underline">Forgot password?</Link>
        </form>
        <div className="mt-6 pt-6 border-t border-line">
          <div className="flex items-center justify-center gap-2 text-sm text-body">
            <Shield className="h-4 w-4" />
            <span>Secure agent portal</span>
          </div>
        </div>
        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-ink-muted hover:text-navy block">Back to home</Link>
        </div>
      </CardContent>
    </AuthShell>
  )
}
