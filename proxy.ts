import { type NextRequest, NextResponse } from "next/server"
import { getSessionCookie } from "better-auth/cookies"
import { updateSession } from "@/lib/supabase/middleware"
import { getPlatformProvider } from "@/lib/platform/provider"

export async function proxy(request: NextRequest) {
  if (getPlatformProvider() === "neon") {
    // Optimistic redirect only. Layouts and APIs perform authoritative checks.
    if (request.nextUrl.pathname.startsWith("/dashboard") && !getSessionCookie(request)) {
      const login = new URL("/auth/login", request.url)
      login.searchParams.set("redirectTo", request.nextUrl.pathname)
      return NextResponse.redirect(login)
    }
    return NextResponse.next()
  }
  return await updateSession(request)
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*"],
}
