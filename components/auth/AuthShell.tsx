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
