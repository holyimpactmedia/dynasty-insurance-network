import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // If env vars are not set, skip Supabase session handling gracefully
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Protected routes - redirect to login if not authenticated
  const isProtectedPath = pathname.startsWith("/dashboard")

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    url.searchParams.set("redirectTo", pathname)
    return NextResponse.redirect(url)
  }

  // Admin authorization is intentionally NOT enforced here: middleware cannot
  // cheaply read the profiles table. The authoritative gate is requireAdmin()
  // in the dashboard layout (a server component that runs before any page).
  // Middleware only enforces authenticated-or-not.

  // Logged-in users on an auth page go to the dashboard; requireAdmin() will
  // bounce them back home if they are not an admin.
  // Signup is intentionally not exposed in the app; accounts are created from
  // Supabase only. /auth/login is the sole interactive auth page.
  const isAuthPath = pathname.startsWith("/auth/login")

  if (isAuthPath && user) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard/admin"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
