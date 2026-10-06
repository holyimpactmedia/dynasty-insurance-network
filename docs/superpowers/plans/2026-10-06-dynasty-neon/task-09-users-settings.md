# Task 9: Users and Settings

Part of [docs/plan.md](../../../plan.md). Read its Global Constraints first.

**Goal:** a super-admin-only Users page that invites an admin by name, email and role and emails them a one-time set-password link (no password ever typed, shown or shared); a super-admin-only Settings page (Projections on/off); both in the dashboard nav for super admins only.

**Files:**
- Create (new): `lib/auth/inviteContext.ts`, `app/api/admin/users/route.ts`, `app/api/admin/users/route.test.ts`, `lib/email/sendPortalInvite.ts`, `lib/email/sendPortalInvite.test.ts`, `components/dashboard/UsersPanel.tsx`
- Create (copy, then edit): `app/dashboard/users/page.tsx`
- Create (copy verbatim): `app/dashboard/settings/page.tsx`, `app/dashboard/settings/loading.tsx`, `components/dashboard/SettingsPanel.tsx`
- Modify: `lib/auth/server.ts` (invite hook), `components/dashboard/DashboardNav.tsx`, `app/dashboard/layout.tsx`, `app/api/admin/auth-guard.test.ts` (known routes)

**Interfaces:**
- Consumes: Task 5 `auth`, `requireSuperAdmin`, `requireSuperAdminApi`; Task 4 `requireNeonDb`, `user` table; Task 8 `getProjectionsEnabled`, `SETTING_KEYS`; `formatFromAddress`.
- Produces:
  - `runAsInvite<T>(context: { name: string; emailed: boolean }, fn: () => Promise<T>): Promise<T>` and `getInviteContext()` from `@/lib/auth/inviteContext`
  - `sendPortalInvite({ to, name, setPasswordUrl }): Promise<boolean>` (false = email not configured; throws if Resend rejects)
  - `GET /api/admin/users` returns `{ users: { id, email, name, role, emailVerified, createdAt }[] }` (super admin only)
  - `POST /api/admin/users` with `{ email, name, role: "admin" | "superadmin" }` returns 201 `{ user: { id, email, name, role, emailVerified: true }, emailed: boolean }`; 400 invalid; 401 no session; 403 not super admin; 409 duplicate. Any `password` in the body is ignored.

**Why:** owner decision (2026-10-05): invites use a set-password link instead of a temporary password. Verified Better Auth 1.6 facts this relies on: the server call is `auth.api.requestPasswordReset({ body: { email, redirectTo } })`; the emailed link checks the token then redirects to `redirectTo?token=...` (or `?error=INVALID_TOKEN`); tokens last 1 hour by default; Better Auth catches and only logs errors thrown inside `sendResetPassword`, so the route learns the email outcome through the invite context; `createUser` called without request headers skips the admin plugin's own permission check (Dynasty's roles grant `user: []`, so with headers even a super admin would get 403), which is why `requireSuperAdminApi` is the authorization.

**Tradeoff (named):** the AsyncLocalStorage invite context ties the route and `lib/auth/server.ts` through one small module and requires the Node runtime on that route (the default). Alternatives rejected: building tokens through Better Auth internals (breaks on upgrade); tagging `redirectTo` with `?invite=1` (anyone could trigger invite-styled emails, and email failure stays invisible).

**Owner choice left at the default:** invite and reset links last 1 hour. Raising `resetPasswordTokenExpiresIn` to 24 hours makes invites friendlier but lengthens every forgot-password link too.

- [ ] **Step 1: Invite context**

Create `lib/auth/inviteContext.ts`:

```ts
import { AsyncLocalStorage } from "node:async_hooks"

/**
 * Marks a Better Auth password-reset request as a super admin invite.
 * app/api/admin/users runs requestPasswordReset inside runAsInvite; the
 * sendResetPassword hook in lib/auth/server.ts reads this context, sends the
 * invite email instead of the reset email, and records whether it went out.
 * Scoped per request, so a public forgot-password request can never trigger
 * the invite email.
 */
export interface InviteContext {
  name: string
  emailed: boolean
}

const inviteStorage = new AsyncLocalStorage<InviteContext>()

export function runAsInvite<T>(context: InviteContext, fn: () => Promise<T>): Promise<T> {
  return inviteStorage.run(context, fn)
}

export function getInviteContext(): InviteContext | undefined {
  return inviteStorage.getStore()
}
```

- [ ] **Step 2: Invite email test first**

Create `lib/email/sendPortalInvite.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { send } = vi.hoisted(() => ({ send: vi.fn() }))
vi.mock("resend", () => ({
  Resend: class {
    emails = { send }
  },
}))

import { sendPortalInvite } from "./sendPortalInvite"

const LINK =
  "https://www.dynastyinsurancenetwork.com/api/auth/reset-password/tok123?callbackURL=%2Fauth%2Freset-password"

describe("sendPortalInvite", () => {
  beforeEach(() => {
    send.mockReset()
    send.mockResolvedValue({ data: { id: "email-1" }, error: null })
    vi.stubEnv("RESEND_API_KEY", "re_test_key")
    vi.stubEnv("RESEND_FROM_EMAIL", "")
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("sends nothing and returns false when email is not configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "")
    await expect(sendPortalInvite({ to: "sam@example.com", name: "Sam Lamy", setPasswordUrl: LINK })).resolves.toBe(false)
    expect(send).not.toHaveBeenCalled()
  })

  it("sends a Dynasty invite that carries only the set-password link", async () => {
    await expect(
      sendPortalInvite({ to: "sam@example.com", name: "<b>Sam</b> Lamy", setPasswordUrl: LINK }),
    ).resolves.toBe(true)
    expect(send).toHaveBeenCalledTimes(1)
    const msg = send.mock.calls[0][0] as { from: string; to: string; subject: string; html: string; text: string }
    expect(msg.to).toBe("sam@example.com")
    expect(msg.from).toBe("Holy Impact Media <noreply@holyimpactmedia.com>")
    expect(msg.subject).toMatch(/Dynasty/)
    expect(msg.html).toContain(LINK)
    expect(msg.text).toContain(LINK)
    expect(msg.text).toContain("https://www.dynastyinsurancenetwork.com/auth/forgot-password")
    expect(msg.html).toContain("&lt;b&gt;Sam&lt;/b&gt;")
    expect(msg.html).not.toContain("<b>Sam</b>")
    const all = `${msg.subject}\n${msg.html}\n${msg.text}`
    expect(all).not.toMatch(/\bunion\b/i)
    expect(all).not.toMatch(/temporary password|password:/i)
  })

  it("throws when Resend rejects the message", async () => {
    send.mockResolvedValue({ data: null, error: { message: "domain not verified" } })
    await expect(sendPortalInvite({ to: "sam@example.com", name: "Sam", setPasswordUrl: LINK })).rejects.toThrow("domain not verified")
  })
})
```

Run `pnpm vitest run lib/email/sendPortalInvite.test.ts`. Expected: FAIL (module missing).

- [ ] **Step 3: Invite email**

Create `lib/email/sendPortalInvite.ts`:

```ts
import { Resend } from "resend"
import { formatFromAddress } from "./fromAddress"

// Invite for a dashboard user created by a super admin. It carries only the
// one-time set-password link from Better Auth's reset flow; no password is
// ever generated for, shown to, or sent by the super admin.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/**
 * Returns false when email is not configured (nothing sent), true once Resend
 * accepts the message, and throws if Resend rejects it.
 */
export async function sendPortalInvite({
  to,
  name,
  setPasswordUrl,
}: {
  to: string
  name: string
  setPasswordUrl: string
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error("[portal-invite] RESEND_API_KEY is not configured")
    return false
  }

  const resend = new Resend(apiKey)
  const from = formatFromAddress(process.env.RESEND_FROM_EMAIL, "Holy Impact Media", "noreply@holyimpactmedia.com")
  const firstName = name.trim().split(/\s+/)[0] || "there"
  const forgotPasswordUrl = new URL("/auth/forgot-password", setPasswordUrl).href
  const subject = "Set your password for the Dynasty admin dashboard"
  const link = escapeHtml(setPasswordUrl)
  const forgot = escapeHtml(forgotPasswordUrl)

  const text = [
    `Hi ${firstName},`,
    "",
    "An administrator added you to the Dynasty admin dashboard. Choose your password to finish setting up your account:",
    setPasswordUrl,
    "",
    "This link works once and expires in 1 hour. If it has expired, request a new one at:",
    forgotPasswordUrl,
    "",
    "If you were not expecting this email, you can ignore it.",
    "",
    "Sent by Holy Impact Media for Dynasty Insurance Group.",
  ].join("\n")

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111827">
      <div style="background:linear-gradient(135deg,#0A1128 0%,#1a2744 100%);padding:24px 32px;border-radius:8px 8px 0 0">
        <div style="color:#D4AF37;font-size:22px;font-weight:800;letter-spacing:-0.5px">Dynasty</div>
        <div style="color:#9ca3af;font-size:12px;margin-top:2px">Admin dashboard</div>
      </div>
      <div style="padding:32px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 8px 8px">
        <p style="line-height:1.6;margin:0 0 16px">Hi ${escapeHtml(firstName)},</p>
        <p style="line-height:1.6;margin:0 0 16px">An administrator added you to the Dynasty admin dashboard. Choose your password to finish setting up your account.</p>
        <p style="margin:0 0 24px"><a href="${link}" style="display:inline-block;background:#0A1128;color:#D4AF37;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:700">Set your password</a></p>
        <p style="line-height:1.6;font-size:13px;color:#4b5563;margin:0 0 8px">This link works once and expires in 1 hour. If it has expired, request a new one at <a href="${forgot}" style="color:#0A1128">${forgot}</a>.</p>
        <p style="line-height:1.6;font-size:12px;color:#6b7280;margin:0">If you were not expecting this email, you can ignore it.</p>
      </div>
      <p style="font-size:11px;color:#9ca3af;text-align:center;margin:16px 0 0">Sent by Holy Impact Media for Dynasty Insurance Group.</p>
    </div>`

  const { error } = await resend.emails.send({ from, to, subject, html, text })
  if (error) throw new Error(error.message)
  return true
}
```

Run `pnpm vitest run lib/email/sendPortalInvite.test.ts`. Expected: 3 PASS.

- [ ] **Step 4: Route invites through the reset hook**

In `lib/auth/server.ts`, replace:

```ts
import { sendAuthEmail } from "@/lib/email/sendAuthEmail"
```

with:

```ts
import { sendAuthEmail } from "@/lib/email/sendAuthEmail"
import { getInviteContext } from "@/lib/auth/inviteContext"
import { sendPortalInvite } from "@/lib/email/sendPortalInvite"
```

Replace:

```ts
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendAuthEmail({ to: user.email, url, kind: "password-reset" })
    },
```

with:

```ts
    revokeSessionsOnPasswordReset: true,
    // 1 hour (the Better Auth default), stated here because the invite email in
    // lib/email/sendPortalInvite.ts quotes it. Change both together.
    resetPasswordTokenExpiresIn: 60 * 60,
    sendResetPassword: async ({ user, url }) => {
      // A super admin invite (app/api/admin/users) reuses this reset flow. Inside
      // runAsInvite it sends the invite email and records the outcome, because
      // Better Auth catches and only logs errors thrown here.
      const invite = getInviteContext()
      if (invite) {
        invite.emailed = await sendPortalInvite({ to: user.email, name: invite.name, setPasswordUrl: url })
        return
      }
      await sendAuthEmail({ to: user.email, url, kind: "password-reset" })
    },
```

- [ ] **Step 5: Users route test first**

Create `app/api/admin/users/route.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { getInviteContext } from "@/lib/auth/inviteContext"

type MockSession = {
  user: { id: string; email: string; name: string; role: string }
  session: { id: string }
}

const state = vi.hoisted(() => ({
  session: null as MockSession | null,
  existing: [] as Array<{ id: string }>,
  list: [] as unknown[],
  verifiedUpdates: [] as Array<Record<string, unknown>>,
  inviteEmailSent: true,
  resetThrows: null as unknown,
}))

const { createUser, requestPasswordReset } = vi.hoisted(() => ({
  createUser: vi.fn(),
  requestPasswordReset: vi.fn(),
}))

// The real gate (lib/auth/requireAdmin.ts) runs; only the session lookup is faked.
vi.mock("next/headers", () => ({ headers: async () => new Headers() }))
vi.mock("@/lib/platform/provider", () => ({ isPlatformConfigured: () => true }))
vi.mock("@/lib/auth/server", () => ({
  auth: { api: { getSession: async () => state.session, createUser, requestPasswordReset } },
}))

vi.mock("@/lib/db/client", () => ({
  requireNeonDb: () => ({
    select: () => ({
      from: () => ({
        where: () => ({ limit: async () => state.existing }),
        orderBy: async () => state.list,
      }),
    }),
    update: () => ({
      set: (values: Record<string, unknown>) => ({
        where: async () => {
          state.verifiedUpdates.push(values)
        },
      }),
    }),
  }),
}))

import { GET, POST } from "@/app/api/admin/users/route"

function session(role: string): MockSession {
  return {
    user: { id: `${role}-id`, email: `${role}@example.com`, name: `${role} Person`, role },
    session: { id: `${role}-session` },
  }
}

function postReq(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/admin/users", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  })
}

const valid = { email: "  Sam@Example.com ", name: "Sam Lamy", role: "admin" }

function passwordOfCall(index: number): string {
  return (createUser.mock.calls[index][0] as { body: { password: string } }).body.password
}

beforeEach(() => {
  state.session = session("superadmin")
  state.existing = []
  state.list = []
  state.verifiedUpdates = []
  state.inviteEmailSent = true
  state.resetThrows = null
  createUser.mockReset()
  requestPasswordReset.mockReset()
  createUser.mockImplementation(async () => ({ user: { id: "new-1" } }))
  // Stands in for Better Auth: it issues the token, then calls sendResetPassword
  // (lib/auth/server.ts), which marks the invite emailed inside runAsInvite.
  requestPasswordReset.mockImplementation(async () => {
    if (state.resetThrows) throw state.resetThrows
    const invite = getInviteContext()
    if (invite) invite.emailed = state.inviteEmailSent
    return { status: true }
  })
})

describe("POST /api/admin/users: access", () => {
  it("returns 401 when nobody is signed in", async () => {
    state.session = null
    const res = await POST(postReq(valid))
    expect(res.status).toBe(401)
    expect(createUser).not.toHaveBeenCalled()
    expect(requestPasswordReset).not.toHaveBeenCalled()
  })

  it("returns 403 for a signed-in admin who is not a super admin", async () => {
    state.session = session("admin")
    const res = await POST(postReq(valid))
    expect(res.status).toBe(403)
    expect(createUser).not.toHaveBeenCalled()
  })

  it("returns 403 for an ordinary user", async () => {
    state.session = session("user")
    const res = await POST(postReq(valid))
    expect(res.status).toBe(403)
    expect(createUser).not.toHaveBeenCalled()
  })
})

describe("POST /api/admin/users: validation", () => {
  it("rejects a body that is not JSON with 400", async () => {
    const res = await POST(postReq("{not json"))
    expect(res.status).toBe(400)
    expect(createUser).not.toHaveBeenCalled()
  })

  it.each([
    ["a malformed email", { ...valid, email: "not-an-email" }],
    ["a missing email", { name: valid.name, role: valid.role }],
    ["a one-letter name", { ...valid, name: "S" }],
    ["a role outside admin|superadmin", { ...valid, role: "user" }],
    ["a missing role", { email: valid.email, name: valid.name }],
  ])("rejects %s with 400", async (_label, body) => {
    const res = await POST(postReq(body))
    expect(res.status).toBe(400)
    expect(createUser).not.toHaveBeenCalled()
    expect(requestPasswordReset).not.toHaveBeenCalled()
  })

  it("ignores a password sent by the client", async () => {
    const res = await POST(postReq({ ...valid, password: "Abcd1234" }))
    expect(res.status).toBe(201)
    expect(passwordOfCall(0)).not.toBe("Abcd1234")
  })
})

describe("POST /api/admin/users: duplicates", () => {
  it("returns 409 when the email already exists", async () => {
    state.existing = [{ id: "dupe" }]
    const res = await POST(postReq(valid))
    expect(res.status).toBe(409)
    expect(createUser).not.toHaveBeenCalled()
    expect(requestPasswordReset).not.toHaveBeenCalled()
  })

  it("returns 409 when createUser loses a race to a duplicate", async () => {
    createUser.mockImplementation(async () => {
      throw new Error("User already exists. Use another email.")
    })
    const res = await POST(postReq(valid))
    expect(res.status).toBe(409)
    expect(requestPasswordReset).not.toHaveBeenCalled()
  })
})

describe("POST /api/admin/users: success", () => {
  it("creates a verified user with a random throwaway password and emails a set-password link", async () => {
    const res = await POST(postReq(valid))
    expect(res.status).toBe(201)

    expect(createUser).toHaveBeenCalledTimes(1)
    const arg = createUser.mock.calls[0][0] as { body: Record<string, unknown> }
    // Header-less on purpose (see the route comment about the admin plugin check).
    expect(Object.keys(arg)).toEqual(["body"])
    expect(arg.body).toMatchObject({
      email: "sam@example.com",
      name: "Sam Lamy",
      role: "admin",
      data: { emailVerified: true },
    })
    const password = passwordOfCall(0)
    expect(password).toMatch(/^[A-Za-z0-9_-]{43}$/) // 32 random bytes, base64url
    expect(state.verifiedUpdates).toEqual([expect.objectContaining({ emailVerified: true })])

    expect(requestPasswordReset).toHaveBeenCalledTimes(1)
    expect(requestPasswordReset).toHaveBeenCalledWith({
      body: { email: "sam@example.com", redirectTo: "/auth/reset-password" },
    })
    expect(createUser.mock.invocationCallOrder[0]).toBeLessThan(requestPasswordReset.mock.invocationCallOrder[0])

    const body = await res.json()
    expect(body).toEqual({
      user: { id: "new-1", email: "sam@example.com", name: "Sam Lamy", role: "admin", emailVerified: true },
      emailed: true,
    })
    const raw = JSON.stringify(body)
    expect(raw).not.toContain(password)
    expect(raw).not.toMatch(/password/i)
  })

  it("uses a different throwaway password for every user", async () => {
    await POST(postReq(valid))
    await POST(postReq({ ...valid, email: "kendrick@example.com" }))
    expect(passwordOfCall(0)).not.toBe(passwordOfCall(1))
  })

  it("can create a super admin", async () => {
    const res = await POST(postReq({ ...valid, role: "superadmin" }))
    expect(res.status).toBe(201)
    expect((createUser.mock.calls[0][0] as { body: { role: string } }).body.role).toBe("superadmin")
  })

  it("reports emailed:false when the invite email could not be sent", async () => {
    state.inviteEmailSent = false
    const res = await POST(postReq(valid))
    expect(res.status).toBe(201)
    expect((await res.json()).emailed).toBe(false)
  })

  it("still returns 201 with emailed:false when the link cannot be issued", async () => {
    state.resetThrows = new Error("verification insert failed")
    vi.spyOn(console, "error").mockImplementation(() => {})
    const res = await POST(postReq(valid))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.emailed).toBe(false)
    expect(body.user.email).toBe("sam@example.com")
  })
})

describe("GET /api/admin/users", () => {
  it("returns the user list for a super admin", async () => {
    state.list = [{ id: "u1", email: "a@b.com", name: "A", role: "admin", emailVerified: true, createdAt: new Date() }]
    const res = await GET()
    expect(res.status).toBe(200)
    expect((await res.json()).users).toHaveLength(1)
  })

  it("returns 403 for a non-super admin", async () => {
    state.session = session("admin")
    expect((await GET()).status).toBe(403)
  })

  it("returns 401 when nobody is signed in", async () => {
    state.session = null
    expect((await GET()).status).toBe(401)
  })
})
```

Run `pnpm vitest run app/api/admin/users`. Expected: FAIL (route missing).

- [ ] **Step 6: Users route**

Create `app/api/admin/users/route.ts`:

```ts
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
```

Run `pnpm vitest run app/api/admin/users`. Expected: all PASS.

- [ ] **Step 7: Extend the admin guard to the users route**

In `app/api/admin/auth-guard.test.ts`, replace:

```ts
// Task 9 adds "users/route.ts" to this list.
const KNOWN_ROUTES = ["export/route.ts", "leads/route.ts", "stats/route.ts"]
```

with:

```ts
const KNOWN_ROUTES = ["export/route.ts", "leads/route.ts", "stats/route.ts", "users/route.ts"]
```

Run `pnpm vitest run app/api/admin`. Expected: PASS, including `users/route.ts answers 401 for every method it exports`.

- [ ] **Step 8: Users panel**

Create `components/dashboard/UsersPanel.tsx`:

```tsx
"use client"

import { useState } from "react"
import { UserPlus, RefreshCw, CircleAlert, MailCheck, MailWarning } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

export interface PortalUser {
  id: string
  email: string
  name: string
  role: string | null
  emailVerified: boolean
  createdAt: string
}

type CreateResult = {
  email: string
  emailed: boolean
}

export default function UsersPanel({ initialUsers }: { initialUsers: PortalUser[] }) {
  const [users, setUsers] = useState<PortalUser[]>(initialUsers)
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState<"admin" | "superadmin">("admin")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CreateResult | null>(null)

  const refresh = async () => {
    const res = await fetch("/api/admin/users", { cache: "no-store" })
    if (res.ok) {
      const data = await res.json()
      setUsers(data.users ?? [])
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, role }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Unable to create the user.")
        return
      }
      setResult({ email: email.trim().toLowerCase(), emailed: Boolean(data.emailed) })
      setEmail("")
      setName("")
      setRole("admin")
      await refresh()
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const roleBadge = (r: string | null) =>
    r === "superadmin"
      ? "bg-red-100 text-red-800 border-red-200"
      : r === "admin"
        ? "bg-purple-100 text-purple-800 border-purple-200"
        : "bg-blue-100 text-blue-800 border-blue-200"

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Invite a user</h2>
        <p className="text-xs text-gray-500 mb-4">
          They get an email with a one-time link to choose their own password. No password is shown here or shared by you.
        </p>

        <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="nu-name">Full name</Label>
            <Input id="nu-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sam Lamy" maxLength={100} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nu-email">Email</Label>
            <Input id="nu-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sam@example.com" maxLength={254} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nu-role">Role</Label>
            <select
              id="nu-role"
              value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "superadmin")}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            >
              <option value="admin">Admin: view leads and dashboard</option>
              <option value="superadmin">Super admin: full control, can manage users</option>
            </select>
          </div>

          <div className="sm:col-span-2 flex items-center gap-3">
            <Button type="submit" disabled={submitting}>
              <UserPlus className="w-4 h-4 mr-2" />
              {submitting ? "Sending invite..." : "Create and send invite"}
            </Button>
            {error && (
              <span className="flex items-center gap-1.5 text-sm text-red-600">
                <CircleAlert className="w-4 h-4" /> {error}
              </span>
            )}
          </div>
        </form>

        {result &&
          (result.emailed ? (
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-2 text-green-800 font-semibold text-sm">
                <MailCheck className="w-4 h-4" /> Invite sent to <span className="font-mono">{result.email}</span>
              </div>
              <p className="mt-1 text-sm text-gray-700">
                The link works once and expires in 1 hour. If it expires, they can use Forgot password on the sign-in page.
              </p>
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
                <MailWarning className="w-4 h-4" /> Account created, but the invite email was not sent
              </div>
              <p className="mt-1 text-sm text-gray-700">
                Ask <span className="font-mono">{result.email}</span> to open the sign-in page and choose Forgot password to set their password.
              </p>
            </div>
          ))}
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Dashboard users ({users.length})</h2>
          <Button type="button" variant="ghost" size="sm" onClick={refresh}>
            <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-400 border-b border-gray-100">
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Email</th>
                <th className="py-2 pr-4 font-medium">Role</th>
                <th className="py-2 pr-4 font-medium">Verified</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-2.5 pr-4 text-gray-900">{u.name}</td>
                  <td className="py-2.5 pr-4 text-gray-600">{u.email}</td>
                  <td className="py-2.5 pr-4">
                    <Badge className={roleBadge(u.role)}>{u.role ?? "user"}</Badge>
                  </td>
                  <td className="py-2.5 pr-4 text-gray-500">{u.emailVerified ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
```

(The role badge colors match main's `DashboardNav` `getRoleBadgeColor`, so the red super admin badge is existing Dynasty convention.)

- [ ] **Step 9: Users and Settings pages**

```bash
mkdir -p app/dashboard/users app/dashboard/settings
git show origin/redesign/union-private-healthcare:app/dashboard/users/page.tsx > app/dashboard/users/page.tsx
git show origin/redesign/union-private-healthcare:app/dashboard/settings/page.tsx > app/dashboard/settings/page.tsx
git show origin/redesign/union-private-healthcare:app/dashboard/settings/loading.tsx > app/dashboard/settings/loading.tsx
git show origin/redesign/union-private-healthcare:components/dashboard/SettingsPanel.tsx > components/dashboard/SettingsPanel.tsx
```

In `app/dashboard/users/page.tsx` (Dynasty has no `navy` token):
- Replace `        <div className="w-10 h-10 rounded-lg bg-navy/10 flex items-center justify-center">` with `        <div className="w-10 h-10 rounded-lg bg-[#1e3a8a]/10 flex items-center justify-center">`
- Replace `          <Users className="w-5 h-5 text-navy" />` with `          <Users className="w-5 h-5 text-[#1e3a8a]" />`
- Replace `            Create and manage portal access · signed in as {adminName}` with `            Invite and manage dashboard access · signed in as {adminName}`

- [ ] **Step 10: Nav entries for super admins (nav and layout change together)**

In `components/dashboard/DashboardNav.tsx`, replace:

```tsx
  ChevronDown,
  BarChart3,
} from "lucide-react"
```

with:

```tsx
  ChevronDown,
  BarChart3,
  Settings,
  Users,
} from "lucide-react"
```

Replace:

```tsx
  userEmail: string
}

export default function DashboardNav({ userRole, userName, userEmail }: DashboardNavProps) {
```

with:

```tsx
  userEmail: string
  projectionsEnabled: boolean
}

export default function DashboardNav({
  userRole,
  userName,
  userEmail,
  projectionsEnabled,
}: DashboardNavProps) {
```

Replace the nav-items block (main lines 47 to 63, from the comment line `// Admin-only nav:` through the line `const filteredNavItems = navItems.filter(item => item.roles.includes(userRole))`) with:

```tsx
  // Admin-only nav: agent and routing items removed (USHA Marketplace handles lead distribution).
  // `enabled` lets a super admin hide a section globally from the Settings panel.
  const navItems = [
    {
      href: "/dashboard/admin",
      label: "Lead CRM",
      icon: LayoutDashboard,
      roles: ["admin", "superadmin"],
      enabled: true,
    },
    {
      href: "/dashboard/projections",
      label: "Projections",
      icon: BarChart3,
      roles: ["admin", "superadmin"],
      enabled: projectionsEnabled,
    },
    {
      href: "/dashboard/users",
      label: "Users",
      icon: Users,
      roles: ["superadmin"],
      enabled: true,
    },
    {
      href: "/dashboard/settings",
      label: "Settings",
      icon: Settings,
      roles: ["superadmin"],
      enabled: true,
    },
  ]

  const filteredNavItems = navItems.filter(
    item => item.enabled && item.roles.includes(userRole),
  )
```

(`LayoutDashboard` is already imported in main's nav; if tsc says otherwise, add it to the `lucide-react` import.)

Replace the two hard-coded `<DropdownMenuItem asChild>` blocks for Lead CRM and Projections (main lines 136 to 147) with:

```tsx
                {filteredNavItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link href={item.href} className="flex items-center">
                        <Icon className="w-4 h-4 mr-2" />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  )
                })}
```

Keep main's logo image, `bg-[#1e3a8a]` active button and gold initials.

In `app/dashboard/layout.tsx`, replace `import { isPlatformConfigured } from "@/lib/platform/provider"` with:

```tsx
import { isPlatformConfigured } from "@/lib/platform/provider"
import { getProjectionsEnabled } from "@/lib/settings"
```

Replace:

```tsx
  const { user, profile } = await requireAdmin()

```

with:

```tsx
  const { user, profile } = await requireAdmin()
  const projectionsEnabled = await getProjectionsEnabled()

```

Replace:

```tsx
        userEmail={user.email ?? ""}
      />
```

with:

```tsx
        userEmail={user.email ?? ""}
        projectionsEnabled={projectionsEnabled}
      />
```

- [ ] **Step 11: Positive control (must FAIL, then restore)**

In `app/api/admin/users/route.ts`, temporarily change `requireSuperAdminApi()` in `POST` to `requireAdminApi()` (import it). Run `pnpm vitest run app/api/admin/users`: "returns 403 for a signed-in admin who is not a super admin" must FAIL. Restore and re-run: PASS.

- [ ] **Step 12: Mechanical checks and commit**

```bash
pnpm exec tsc --noEmit && pnpm test && pnpm lint && pnpm check:guards && pnpm build
git add lib/auth/inviteContext.ts lib/auth/server.ts lib/email/sendPortalInvite.ts lib/email/sendPortalInvite.test.ts app/api/admin components/dashboard/UsersPanel.tsx components/dashboard/SettingsPanel.tsx components/dashboard/DashboardNav.tsx app/dashboard/users app/dashboard/settings app/dashboard/layout.tsx
git commit -m "feat(dashboard): super-admin Users page with set-password-link invites, Settings page, nav entries"
```
