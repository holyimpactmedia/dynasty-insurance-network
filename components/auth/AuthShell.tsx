import type { ReactNode } from "react"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UnionLogo, dotGrid, redStripeField } from "@/components/union/brand"

// Shared shell for every /auth screen.
//
// Presentational and server-safe (no "use client"), so the async error page, the
// client-side forgot/reset forms, and Suspense fallbacks can all render it.
//
// It exists because the navy shell was previously copy-pasted across six places
// and had already drifted into two treatments: login + error carried the gradient
// and a dark glass card, while forgot-password + reset-password used a flat navy
// background with an unstyled default white card. The new treatment adds two
// positioned texture layers with a relative/overflow-hidden contract between
// them, which is not something to duplicate six more times.
//
// The card is deliberately opaque white rather than the old bg-white/5 glass: the
// glass is what made the old inputs illegible (placeholder text landed at roughly
// 2.6:1), and on white the shadcn Input/Label/Button defaults resolve correctly
// against the Union --input/--border/--ring tokens with no override classes at all.
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
    <div
      className="relative min-h-screen overflow-hidden flex items-center justify-center p-4"
      style={{
        background:
          "linear-gradient(165deg, var(--color-navy) 0%, var(--color-navy-deep) 100%)",
      }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0" style={dotGrid} />
      {/* Masthead accent only. redStripeField at full strength is an aggressive
          122deg red hatch, so it is capped in height and heavily faded. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-56 opacity-[0.07]"
        style={redStripeField}
      />

      <div className="relative w-full max-w-md">
        <div className="mb-7 flex justify-center">
          <UnionLogo size={44} onDark />
        </div>

        <Card className="rounded-2xl shadow-[0_30px_70px_-30px_rgba(4,16,31,0.7)]">
          <CardHeader className="text-center space-y-3">
            {icon ? <div className="flex justify-center">{icon}</div> : null}
            <div>
              <CardTitle className="font-display text-2xl text-navy">{title}</CardTitle>
              {description ? (
                <CardDescription className="mt-1.5">{description}</CardDescription>
              ) : null}
            </div>
          </CardHeader>
          {children}
        </Card>

        <p className="mt-6 text-center text-xs text-[#8ba0bb]">
          Internal portal · Holy Impact Media, LLC
        </p>
      </div>
    </div>
  )
}
