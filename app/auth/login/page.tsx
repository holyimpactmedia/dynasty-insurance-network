import { Suspense } from "react"
import LoginForm from "./LoginForm"
import { AuthShell } from "@/components/auth/AuthShell"
import { CardContent } from "@/components/ui/card"
import { getPlatformProvider } from "@/lib/platform/provider"

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        // Same shell as the real form so the branded frame is painted immediately
        // instead of flashing an unbranded navy slab.
        <AuthShell title="Agent Portal" description="Sign in to access your dashboard">
          <CardContent>
            <div className="space-y-4" aria-busy="true">
              <div className="h-10 rounded-md bg-surface-2" />
              <div className="h-10 rounded-md bg-surface-2" />
              <div className="h-11 rounded-md bg-surface-2" />
            </div>
          </CardContent>
        </AuthShell>
      }
    >
      <LoginForm provider={getPlatformProvider()} />
    </Suspense>
  )
}
