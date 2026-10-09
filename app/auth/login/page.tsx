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
