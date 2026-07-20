import { type NextRequest, NextResponse } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

export async function proxy(request: NextRequest) {
  // Optimistic redirect only. Layouts and APIs perform authoritative checks.
  if (request.nextUrl.pathname.startsWith("/dashboard") && !getSessionCookie(request)) {
    const login = new URL("/auth/login", request.url)
    login.searchParams.set("redirectTo", request.nextUrl.pathname)
    return NextResponse.redirect(login)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*"],
}
