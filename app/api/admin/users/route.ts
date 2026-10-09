import { randomBytes } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { requireSuperAdminApi } from "@/lib/auth/requireAdmin"
import { runAsInvite } from "@/lib/auth/inviteContext"
import { requireNeonDb } from "@/lib/db/client"
import { user as userTable } from "@/lib/db/schema/auth"

// User provisioning is backed by the Better Auth admin plugin on Neon.
const CREATABLE_ROLES = ["admin", "superadmin"] as const
type CreatableRole = (typeof CREATABLE_ROLES)[number]

// Where the emailed one-time link lands (app/auth/reset-password). Relative on
// purpose: Better Auth resolves it against BETTER_AUTH_URL and trusts relative
// paths. Without a redirect the emailed link cannot work. Not exported: route
// files may only export HTTP handlers.
const SET_PASSWORD_REDIRECT = "/auth/reset-password"

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

  // Only name, email and role are read. A password sent by any client is ignored.
  const { email, name, role } = (body ?? {}) as Record<string, unknown>
  const cleanEmail = String(email ?? "").trim().toLowerCase()
  const cleanName = String(name ?? "").trim()
  const cleanRole = String(role ?? "").trim()

  // Validated server-side: never trust the client to have gated any of this.
  if (cleanEmail.length > 254 || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 })
  }
  if (cleanName.length < 2 || cleanName.length > 100) {
    return NextResponse.json({ error: "Enter the person's full name." }, { status: 400 })
  }
  if (!CREATABLE_ROLES.includes(cleanRole as CreatableRole)) {
    return NextResponse.json({ error: "Role must be admin or superadmin." }, { status: 400 })
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

    // 256 random bits nobody ever sees. The invitee replaces it through the
    // emailed set-password link. Never logged, returned or emailed.
    const throwawayPassword = randomBytes(32).toString("base64url")

    // Called without request headers on purpose. With headers, the admin plugin
    // runs its own permission check, and the roles in lib/auth/permissions.ts
    // grant no `user` permissions, so it would refuse even a super admin. The
    // requireSuperAdminApi gate above is the authorization.
    const created = await auth.api.createUser({
      body: {
        email: cleanEmail,
        name: cleanName,
        password: throwawayPassword,
        role: cleanRole as CreatableRole,
        data: { emailVerified: true },
      },
    })
    const createdId = (created as { user?: { id?: string } })?.user?.id ?? null

    // A trusted super admin provisioned this address, so it counts as verified
    // (requireEmailVerification is on). `data` above sets it at insert; this
    // idempotent update guarantees it. Mirrors scripts/bootstrap-auth-users.ts.
    await db
      .update(userTable)
      .set({ emailVerified: true, updatedAt: new Date() })
      .where(eq(userTable.email, cleanEmail))

    // One-time set-password link through Better Auth's reset flow. Inside
    // runAsInvite, sendResetPassword (lib/auth/server.ts) sends the Dynasty
    // invite email and sets invite.emailed; Better Auth swallows email errors,
    // so that flag is the only reliable signal.
    const invite = { name: cleanName, emailed: false }
    try {
      await runAsInvite(invite, () =>
        auth.api.requestPasswordReset({
          body: { email: cleanEmail, redirectTo: SET_PASSWORD_REDIRECT },
        }),
      )
    } catch (linkError) {
      console.error("[admin/users] set-password link failed", linkError)
    }

    return NextResponse.json(
      {
        user: { id: createdId, email: cleanEmail, name: cleanName, role: cleanRole, emailVerified: true },
        emailed: invite.emailed,
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
