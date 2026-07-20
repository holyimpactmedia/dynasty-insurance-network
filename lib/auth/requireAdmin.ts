import { cache } from "react"
import { redirect } from "next/navigation"
import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { isPlatformConfigured } from "@/lib/platform/provider"

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
  /** True when the profile role is exactly 'superadmin'. */
  isSuperAdmin: boolean
}

const ADMIN_ROLES = ["admin", "superadmin"] as const

type LoadResult =
  | { ok: true; ctx: AdminContext }
  | { ok: false; reason: "unconfigured" | "unauthenticated" | "forbidden" }

/**
 * Resolves the current admin context once per request. Wrapped in React
 * `cache()` so the layout and the page share a single auth round-trip instead
 * of each doing their own. The role comes from the Better Auth session
 * (`user.role`), which is server-signed and not client-writable.
 */
const loadAdminContext = cache(async (): Promise<LoadResult> => {
  if (!isPlatformConfigured()) return { ok: false, reason: "unconfigured" }
  const { auth } = await import("@/lib/auth/server")
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return { ok: false, reason: "unauthenticated" }

  const role = session.user.role || "user"
  if (!ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number])) {
    return { ok: false, reason: "forbidden" }
  }

  const name = session.user.name?.trim() || ""
  const [firstName, ...rest] = name.split(/\s+/).filter(Boolean)
  const profile: AdminProfile = {
    id: session.user.id,
    role,
    first_name: firstName || null,
    last_name: rest.join(" ") || null,
    email: session.user.email,
  }
  return {
    ok: true,
    ctx: {
      user: { id: session.user.id, email: session.user.email },
      profile,
      isSuperAdmin: role === "superadmin",
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
 * Gate for super-admin-only server components / pages (e.g. the Settings
 * panel). Redirects on failure and never returns for a non-super-admin
 * caller. Admins (non-super) are sent back to the dashboard they can see.
 */
export async function requireSuperAdmin(): Promise<AdminContext> {
  const result = await loadAdminContext()
  if (result.ok && result.ctx.isSuperAdmin) return result.ctx
  if (!result.ok && result.reason === "unauthenticated") {
    redirect("/auth/login?redirectTo=/dashboard/settings")
  }
  // Authenticated admins who are not super admins, or anyone else: not a
  // destination for them. Send admins to their dashboard, others home.
  redirect(result.ok ? "/dashboard/admin" : "/")
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

/**
 * Gate for super-admin-only API route handlers (e.g. user provisioning).
 * Authenticated non-super admins get 403, not 401 — they are known, just not
 * allowed. Returns typed JSON responses instead of redirecting.
 */
export async function requireSuperAdminApi(): Promise<
  { ok: true; ctx: AdminContext } | { ok: false; response: NextResponse }
> {
  const result = await loadAdminContext()
  if (result.ok && result.ctx.isSuperAdmin) return { ok: true, ctx: result.ctx }
  const status = !result.ok && result.reason === "unauthenticated" ? 401 : 403
  return {
    ok: false,
    response: NextResponse.json(
      { error: result.ok ? "forbidden" : result.reason },
      { status },
    ),
  }
}
