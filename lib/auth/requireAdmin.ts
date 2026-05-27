import { cache } from "react"
import { redirect } from "next/navigation"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export interface AdminProfile {
  id: string
  role: string
  first_name: string | null
  last_name: string | null
  email: string | null
}

export interface AdminContext {
  user: { id: string; email: string | null }
  profile: AdminProfile
}

type LoadResult =
  | { ok: true; ctx: AdminContext }
  | { ok: false; reason: "unconfigured" | "unauthenticated" | "forbidden" }

/**
 * Resolves the current admin context once per request. Wrapped in React
 * `cache()` so the layout and the page share a single auth + profile
 * round-trip instead of each doing their own.
 *
 * The role is read ONLY from the `profiles` table — never from
 * `user_metadata`, which the user can rewrite themselves.
 */
const loadAdminContext = cache(async (): Promise<LoadResult> => {
  const supabase = await createClient()
  if (!supabase) return { ok: false, reason: "unconfigured" }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, reason: "unauthenticated" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, first_name, last_name, email")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile || profile.role !== "admin") {
    return { ok: false, reason: "forbidden" }
  }

  return {
    ok: true,
    ctx: {
      user: { id: user.id, email: user.email ?? null },
      profile: profile as AdminProfile,
    },
  }
})

/**
 * Gate for server components / layouts. Redirects on failure and never
 * returns for a non-admin caller.
 */
export async function requireAdmin(): Promise<AdminContext> {
  const result = await loadAdminContext()
  if (result.ok) return result.ctx
  if (result.reason === "unauthenticated") {
    redirect("/auth/login?redirectTo=/dashboard/admin")
  }
  // forbidden or unconfigured: not a destination for this user.
  redirect("/")
}

/**
 * Gate for API route handlers. Returns a typed result so the route can
 * respond with 401/403 JSON instead of redirecting.
 */
export async function requireAdminApi(): Promise<
  { ok: true; ctx: AdminContext } | { ok: false; response: NextResponse }
> {
  const result = await loadAdminContext()
  if (result.ok) return { ok: true, ctx: result.ctx }
  const status = result.reason === "unauthenticated" ? 401 : 403
  return {
    ok: false,
    response: NextResponse.json({ error: result.reason }, { status }),
  }
}
