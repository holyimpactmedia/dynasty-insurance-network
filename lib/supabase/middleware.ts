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

  // Admin-only routes — non-admins get redirected to their agent dashboard
  const adminPaths = ["/dashboard/admin", "/dashboard/projections", "/dashboard/routing"]
  const isAdminPath = adminPaths.some((p) => pathname.startsWith(p))

  if (isAdminPath && user) {
    const role = (user.user_metadata as { role?: string } | null)?.role
    if (role !== "admin") {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard/agent"
      return NextResponse.redirect(url)
    }
  }

  // If user is logged in and tries to access auth pages, redirect to dashboard
  const authPaths = ["/auth/login", "/auth/signup"]
  const isAuthPath = authPaths.some((p) => pathname.startsWith(p))

  if (isAuthPath && user) {
    const url = request.nextUrl.clone()
    const role = (user.user_metadata as { role?: string } | null)?.role
    url.pathname = role === "admin" ? "/dashboard/admin" : "/dashboard/agent"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
