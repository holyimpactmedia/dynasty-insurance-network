import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { requireSuperAdminApi } from "@/lib/auth/requireAdmin"
import { requireNeonDb } from "@/lib/db/client"
import { user as userTable } from "@/lib/db/schema/auth"
import { sendPortalInvite } from "@/lib/email/sendPortalInvite"

// User provisioning is backed by the Better Auth admin plugin on Neon.
const CREATABLE_ROLES = ["admin", "superadmin"] as const
type CreatableRole = (typeof CREATABLE_ROLES)[number]

export async function GET() {
  const access = await requireSuperAdminApi()
  if (!access.ok) return access.response
  try {
    const db = requireNeonDb()
    const users = await db
      .select({
        id: userTable.id,
        email: userTable.email,
        name: userTable.name,
        role: userTable.role,
        emailVerified: userTable.emailVerified,
        createdAt: userTable.createdAt,
      })
      .from(userTable)
      .orderBy(userTable.createdAt)
    return NextResponse.json({ users }, { headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    console.error("[admin/users] list failed", error)
    return NextResponse.json({ error: "Unable to load users" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const access = await requireSuperAdminApi()
  if (!access.ok) return access.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const { email, name, role, password } = (body ?? {}) as Record<string, unknown>
  const cleanEmail = String(email ?? "").trim().toLowerCase()
  const cleanName = String(name ?? "").trim()
  const cleanRole = String(role ?? "").trim()
  const cleanPassword = String(password ?? "")

  // Validated server-side: never trust the client to have gated any of this.
  if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 })
  }
  if (cleanName.length < 2) {
    return NextResponse.json({ error: "Enter the person's full name." }, { status: 400 })
  }
  if (!CREATABLE_ROLES.includes(cleanRole as CreatableRole)) {
    return NextResponse.json({ error: "Role must be admin or superadmin." }, { status: 400 })
  }
  if (cleanPassword.length < 8) {
    return NextResponse.json({ error: "Temporary password must be at least 8 characters." }, { status: 400 })
  }

  try {
    const { auth } = await import("@/lib/auth/server")
    const db = requireNeonDb()

    // Pre-check for a friendly 409; createUser would also reject a duplicate.
    const [existing] = await db
      .select({ id: userTable.id })
      .from(userTable)
      .where(eq(userTable.email, cleanEmail))
      .limit(1)
    if (existing) {
      return NextResponse.json({ error: "A user with that email already exists." }, { status: 409 })
    }

    const created = await auth.api.createUser({
      body: {
        email: cleanEmail,
        name: cleanName,
        password: cleanPassword,
        role: cleanRole as CreatableRole,
      },
    })
    const createdId = (created as { user?: { id?: string } })?.user?.id ?? null

    // The portal requires email verification before a password login works
    // (auth/server.ts). These accounts are provisioned by a trusted super
    // admin, so mark verified here so the new user can sign in immediately
    // with the temporary password. Mirrors scripts/bootstrap-auth-users.ts.
    await db
      .update(userTable)
      .set({ emailVerified: true, updatedAt: new Date() })
      .where(eq(userTable.email, cleanEmail))

    // Best-effort welcome email with the login link (never the password).
    const baseUrl =
      process.env.BETTER_AUTH_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      new URL(request.url).origin
    let emailed = false
    try {
      await sendPortalInvite({ to: cleanEmail, name: cleanName, loginUrl: `${baseUrl}/auth/login` })
      emailed = true
    } catch (mailError) {
      console.error("[admin/users] invite email failed", mailError)
    }

    return NextResponse.json(
      {
        user: { id: createdId, email: cleanEmail, name: cleanName, role: cleanRole, emailVerified: true },
        emailed,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[admin/users] create failed", error)
    const message =
      error instanceof Error && /exist|unique|duplicate/i.test(error.message)
        ? "A user with that email already exists."
        : "Unable to create the user."
    const status = message.startsWith("A user") ? 409 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
