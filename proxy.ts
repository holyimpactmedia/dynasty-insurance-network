import { type NextRequest, NextResponse } from "next/server"
import { getSessionCookie } from "better-auth/cookies"
import { isPlatformConfigured } from "@/lib/platform/provider"

export async function proxy(request: NextRequest) {
  // Optimistic redirect only. Layouts and APIs perform authoritative checks.
  // Unconfigured platform: skip the redirect so the dashboard layout renders
  // SetupRequired instead of a login form that cannot succeed.
  if (
    request.nextUrl.pathname.startsWith("/dashboard") &&
    isPlatformConfigured() &&
    !getSessionCookie(request)
  ) {
    const login = new URL("/auth/login", request.url)
    login.searchParams.set("redirectTo", request.nextUrl.pathname)
    return NextResponse.redirect(login)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*"],
}
