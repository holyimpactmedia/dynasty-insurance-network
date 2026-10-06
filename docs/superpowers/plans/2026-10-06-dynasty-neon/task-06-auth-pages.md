# Task 6: Auth pages in the Dynasty look

Part of [docs/plan.md](../../../plan.md). Read its Global Constraints first.

**Goal:** login, forgot-password, reset-password (with a clear expired-link message) and error pages on Better Auth, all in Dynasty's existing navy-and-gold card; dashboard sign-out on Better Auth; the dashboard layout gated on `isPlatformConfigured()`; the setup screen naming the new variables.

**Files:**
- Create: `components/auth/AuthShell.tsx`, `app/auth/login/LoginForm.tsx`, `app/auth/forgot-password/page.tsx`, `app/auth/reset-password/page.tsx`
- Replace: `app/auth/login/page.tsx`, `app/auth/error/page.tsx`
- Modify: `components/dashboard/DashboardNav.tsx`, `app/dashboard/layout.tsx`, `components/dashboard/SetupRequired.tsx`
- Delete: `app/auth/callback/route.ts` (nothing starts an OAuth or magic-link flow; Better Auth sends errors to `callbackURL?error=` instead)

**Interfaces:**
- Consumes: Task 5 `authClient`, `requireAdmin`; Task 3 `isPlatformConfigured`; existing `@/lib/auth/safeRedirect`.
- Produces: `AuthShell({ children?, title: string, description?: ReactNode, icon?: ReactNode })` named export from `@/components/auth/AuthShell` (same API as the redesign's, Dynasty styling). Routes `/auth/login`, `/auth/forgot-password`, `/auth/reset-password?token=...`, `/auth/error?message=...`.

**Why:** the redesign pages use Union design tokens (`bg-surface-2`, `text-navy`, ...) that do not exist in Dynasty's CSS; copied as-is they render unstyled with no build error. Better Auth sends an expired or used reset link to `/auth/reset-password?error=INVALID_TOKEN`; the redesign page showed only a disabled button there (Review Focus 5).

- [ ] **Step 1: Dynasty AuthShell**

Create `components/auth/AuthShell.tsx`:

```tsx
import type { ReactNode } from "react"
import Image from "next/image"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Shared shell for every /auth screen, in the existing Dynasty look: navy
// gradient, dark glass card, gold accents, the Dynasty logo.
//
// Presentational and server-safe (no "use client"): the async error page, the
// client forgot/reset forms, and Suspense fallbacks can all render it.
//
// The card is dark glass, so children carry light-on-dark classes (labels
// text-gray-300; inputs bg-white/10 border-white/20 text-white
// placeholder:text-gray-500). The shadcn defaults assume a white card.
//
// `icon`, when given, takes the logo's place (the error screen shows a warning
// icon instead of the logo, as the original Dynasty error page did).
export function AuthShell({
  children,
  title,
  description,
  icon,
}: {
  children?: ReactNode
  title: string
  description?: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1128] via-[#1a2744] to-[#0A1128] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            {icon ?? (
              <Image src="/images/logo.avif" alt="Dynasty" width={180} height={60} className="h-12 w-auto" />
            )}
          </div>
          <div>
            <CardTitle className="text-2xl text-white">{title}</CardTitle>
            {description ? <CardDescription className="text-gray-400">{description}</CardDescription> : null}
          </div>
        </CardHeader>
        {children}
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Login page and form**

Replace `app/auth/login/page.tsx` entirely with:

```tsx
import { Suspense } from "react"
import LoginForm from "./LoginForm"
import { AuthShell } from "@/components/auth/AuthShell"
import { CardContent } from "@/components/ui/card"

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        // Same shell as the real form so the branded frame paints immediately.
        <AuthShell title="Agent Portal" description="Sign in to access your dashboard">
          <CardContent>
            <div className="space-y-4" aria-busy="true">
              <div className="h-10 rounded-md bg-white/10" />
              <div className="h-10 rounded-md bg-white/10" />
              <div className="h-11 rounded-md bg-white/10" />
            </div>
          </CardContent>
        </AuthShell>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
```

Create `app/auth/login/LoginForm.tsx`:

```tsx
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
            <div className="p-3 text-sm text-red-400 bg-red-900/30 border border-red-500/30 rounded-lg">{error}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="agent@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-300">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#D4AF37] text-[#0A1128] hover:bg-[#D4AF37]/90 font-semibold"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>

          <Link href="/auth/forgot-password" className="block text-center text-sm text-[#D4AF37] hover:underline">
            Forgot password?
          </Link>
        </form>

        <div className="mt-6 pt-6 border-t border-white/10">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <Shield className="h-4 w-4" />
            <span>Secure agent portal</span>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-300 block">Back to home</Link>
        </div>
      </CardContent>
    </AuthShell>
  )
}
```

- [ ] **Step 3: Forgot-password page**

Create `app/auth/forgot-password/page.tsx`:

```tsx
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
```

- [ ] **Step 4: Reset-password page with the expired-link message**

Create `app/auth/reset-password/page.tsx`:

```tsx
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
  const linkInvalid = !token || searchParams.get("error") === "INVALID_TOKEN"
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
```

- [ ] **Step 5: Error page**

Replace `app/auth/error/page.tsx` entirely with:

```tsx
import Link from "next/link"
import { AuthShell } from "@/components/auth/AuthShell"
import { Button } from "@/components/ui/button"
import { CardContent } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

// Fixed copy only. The page no longer echoes a ?message= value, so nobody can
// craft a Dynasty-branded page that says whatever they want.
export default function AuthErrorPage() {
  return (
    <AuthShell
      title="Authentication Error"
      description="There was a problem signing you in. Please try again."
      icon={
        <div className="p-3 rounded-full bg-red-500/20">
          <AlertTriangle className="h-8 w-8 text-red-400" />
        </div>
      }
    >
      <CardContent className="space-y-4">
        <Button asChild className="w-full bg-[#D4AF37] text-[#0A1128] hover:bg-[#D4AF37]/90">
          <Link href="/auth/login">Try Again</Link>
        </Button>
        <Button asChild variant="outline" className="w-full bg-transparent border-white/20 text-white hover:bg-white/10">
          <Link href="/">Back to Home</Link>
        </Button>
      </CardContent>
    </AuthShell>
  )
}
```

(`bg-transparent` fixes main's white-on-white outline button; the outline variant sets `bg-background`.)

- [ ] **Step 6: Delete the Supabase OAuth callback**

```bash
git rm app/auth/callback/route.ts
```

- [ ] **Step 7: Sign-out on Better Auth**

In `components/dashboard/DashboardNav.tsx`, replace `import { createClient } from "@/lib/supabase/client"` with `import { authClient } from "@/lib/auth/client"`. Replace:

```tsx
    setIsLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
```

with:

```tsx
    setIsLoggingOut(true)
    await authClient.signOut()
```

Keep everything else in the nav (Dynasty logo image, `bg-[#1e3a8a]` active button, gold initials). The Users and Settings entries arrive in Task 9.

- [ ] **Step 8: Gate the dashboard layout on configuration**

In `app/dashboard/layout.tsx`, replace:

```tsx
import { createClient } from "@/lib/supabase/server"
import DashboardNav from "@/components/dashboard/DashboardNav"
import { SetupRequired } from "@/components/dashboard/SetupRequired"
import { requireAdmin } from "@/lib/auth/requireAdmin"
```

with:

```tsx
import DashboardNav from "@/components/dashboard/DashboardNav"
import { SetupRequired } from "@/components/dashboard/SetupRequired"
import { requireAdmin } from "@/lib/auth/requireAdmin"
import { isPlatformConfigured } from "@/lib/platform/provider"
```

Replace:

```tsx
  // Graceful empty state when Supabase env vars are missing.
  const supabase = await createClient()
  if (!supabase) return <SetupRequired page="dashboard" />

  // Authoritative gate: authenticated AND role 'admin' in the profiles table.
  // Redirects non-admins; never returns otherwise.
```

with:

```tsx
  // Fail closed: a missing DATABASE_URL, BETTER_AUTH_SECRET or site URL renders
  // the setup screen instead of a login that cannot work.
  if (!isPlatformConfigured()) return <SetupRequired page="dashboard" />

  // Authoritative gate: authenticated AND an admin/superadmin role on the
  // Better Auth session. Redirects non-admins; never returns otherwise.
```

- [ ] **Step 9: Setup screen names the new variables**

In `components/dashboard/SetupRequired.tsx`, replace `<h1 className="text-2xl font-bold text-white">Supabase Not Configured</h1>` with `<h1 className="text-2xl font-bold text-white">Database Not Configured</h1>`.

Replace:

```tsx
            The {page} dashboard needs Supabase environment variables to load. Set
            <code className="mx-1 px-1.5 py-0.5 rounded bg-white/10 text-[#D4AF37] text-xs">NEXT_PUBLIC_SUPABASE_URL</code>
            and
            <code className="mx-1 px-1.5 py-0.5 rounded bg-white/10 text-[#D4AF37] text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
```

with:

```tsx
            The {page} screen needs the database and sign-in settings to load. Set
            <code className="mx-1 px-1.5 py-0.5 rounded bg-white/10 text-[#D4AF37] text-xs">DATABASE_URL</code>,
            <code className="mx-1 px-1.5 py-0.5 rounded bg-white/10 text-[#D4AF37] text-xs">BETTER_AUTH_SECRET</code>
            and
            <code className="mx-1 px-1.5 py-0.5 rounded bg-white/10 text-[#D4AF37] text-xs">BETTER_AUTH_URL</code>
```

Replace `<Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10">` with `<Button asChild variant="outline" className="bg-transparent border-white/20 text-white hover:bg-white/10">`.

- [ ] **Step 10: Mechanical checks**

```bash
pnpm exec tsc --noEmit && pnpm test && pnpm lint && pnpm check:guards && pnpm build
```

- [ ] **Step 11: Look at each page (read-only, no sign-in)**

Start the dev server (`preview_start` with name `dev`; `.env.local` from Task 4 is present). In the browser pane, at desktop and at mobile (375 wide), open and screenshot:
1. `/auth/login`: Dynasty logo, "Agent Portal", gold "Sign In", "Forgot password?" link. No unstyled elements.
2. `/auth/forgot-password`: same card, email field, gold button. Do not submit (it would email a real account on production data).
3. `/auth/reset-password`: "This reset link is invalid or expired." with "Request a new link".
4. `/auth/reset-password?token=x&error=INVALID_TOKEN`: same message.
5. `/auth/error`: warning icon, fixed text, both buttons readable (no white-on-white).
6. `/dashboard/admin` with no session: redirected to `/auth/login?redirectTo=%2Fdashboard%2Fadmin`.
Check the console for errors. Do not sign in here: the real accounts live on production data (Global Constraints).

- [ ] **Step 12: Commit**

```bash
git add components/auth app/auth components/dashboard/DashboardNav.tsx components/dashboard/SetupRequired.tsx app/dashboard/layout.tsx
git commit -m "feat(auth): Dynasty auth pages on Better Auth, expired-link message, fail-closed dashboard layout"
```
