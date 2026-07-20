import { describe, it, expect, beforeEach, vi } from "vitest"

// Mutable mock state, hoisted so the vi.mock factories can close over it.
const state = vi.hoisted(() => ({
  guard: { ok: true, superadmin: true } as { ok: boolean; superadmin: boolean; reason?: string },
  existing: [] as Array<{ id: string }>,
  list: [] as unknown[],
  createResult: { user: { id: "new-1" } } as unknown,
  createThrows: null as unknown,
  emailThrows: null as unknown,
}))

// Mock fns are hoisted too, so the module-mock factories below can reference
// them (vi.mock is hoisted above normal const declarations).
const { createUser, sendPortalInvite } = vi.hoisted(() => ({
  createUser: vi.fn(),
  sendPortalInvite: vi.fn(),
}))

vi.mock("@/lib/auth/requireAdmin", () => ({
  requireSuperAdminApi: async () => {
    if (state.guard.ok && state.guard.superadmin) {
      return { ok: true, ctx: { isSuperAdmin: true } }
    }
    const status = state.guard.reason === "unauthenticated" ? 401 : 403
    const { NextResponse } = await import("next/server")
    return { ok: false, response: NextResponse.json({ error: state.guard.reason ?? "forbidden" }, { status }) }
  },
}))

vi.mock("@/lib/db/client", () => ({
  requireNeonDb: () => ({
    select: () => ({
      from: () => ({
        where: () => ({ limit: async () => state.existing }),
        orderBy: async () => state.list,
      }),
    }),
    update: () => ({ set: () => ({ where: async () => undefined }) }),
  }),
}))

vi.mock("@/lib/auth/server", () => ({ auth: { api: { createUser } } }))
vi.mock("@/lib/email/sendPortalInvite", () => ({ sendPortalInvite }))

import { GET, POST } from "@/app/api/admin/users/route"
import { NextRequest } from "next/server"

function postReq(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/admin/users", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

const valid = { email: "Sam@Example.com", name: "Sam Lamy", role: "admin", password: "Abcd1234" }

beforeEach(() => {
  state.guard = { ok: true, superadmin: true }
  state.existing = []
  state.list = []
  state.createResult = { user: { id: "new-1" } }
  state.createThrows = null
  state.emailThrows = null
  createUser.mockReset()
  sendPortalInvite.mockReset()
  createUser.mockImplementation(async () => {
    if (state.createThrows) throw state.createThrows
    return state.createResult
  })
  sendPortalInvite.mockImplementation(async () => {
    if (state.emailThrows) throw state.emailThrows
  })
})

describe("POST /api/admin/users — guard", () => {
  it("rejects an authenticated non-super admin with 403", async () => {
    // The real guard returns forbidden for an authed admin who is not super.
    state.guard = { ok: false, superadmin: false, reason: "forbidden" }
    const res = await POST(postReq(valid))
    expect(res.status).toBe(403)
    expect(createUser).not.toHaveBeenCalled()
  })

  it("rejects an unauthenticated caller with 401", async () => {
    state.guard = { ok: false, superadmin: false, reason: "unauthenticated" }
    const res = await POST(postReq(valid))
    expect(res.status).toBe(401)
    expect(createUser).not.toHaveBeenCalled()
  })
})

describe("POST /api/admin/users — validation", () => {
  it("rejects a bad email", async () => {
    const res = await POST(postReq({ ...valid, email: "not-an-email" }))
    expect(res.status).toBe(400)
    expect(createUser).not.toHaveBeenCalled()
  })

  it("rejects a role outside admin|superadmin", async () => {
    const res = await POST(postReq({ ...valid, role: "user" }))
    expect(res.status).toBe(400)
    expect(createUser).not.toHaveBeenCalled()
  })

  it("rejects a password shorter than 8 characters", async () => {
    const res = await POST(postReq({ ...valid, password: "qwerty" }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/8 characters/)
    expect(createUser).not.toHaveBeenCalled()
  })

  it("returns 409 when the email already exists", async () => {
    state.existing = [{ id: "dupe" }]
    const res = await POST(postReq(valid))
    expect(res.status).toBe(409)
    expect(createUser).not.toHaveBeenCalled()
  })
})

describe("POST /api/admin/users — create", () => {
  it("creates the user with a normalized email and verified flag, and reports emailed", async () => {
    const res = await POST(postReq(valid))
    expect(res.status).toBe(201)
    expect(createUser).toHaveBeenCalledTimes(1)
    const arg = createUser.mock.calls[0][0] as { body: Record<string, unknown> }
    expect(arg.body.email).toBe("sam@example.com") // lowercased
    expect(arg.body.role).toBe("admin")
    expect(arg.body.password).toBe("Abcd1234")
    const body = await res.json()
    expect(body.user).toMatchObject({ email: "sam@example.com", role: "admin", emailVerified: true })
    expect(body.emailed).toBe(true)
    expect(sendPortalInvite).toHaveBeenCalledTimes(1)
  })

  it("still succeeds (emailed:false) when the invite email fails", async () => {
    state.emailThrows = new Error("resend down")
    const res = await POST(postReq(valid))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.emailed).toBe(false)
  })
})

describe("GET /api/admin/users", () => {
  it("returns the user list for a super admin", async () => {
    state.list = [{ id: "u1", email: "a@b.com", name: "A", role: "admin", emailVerified: true, createdAt: new Date() }]
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.users).toHaveLength(1)
  })

  it("blocks a non-super admin", async () => {
    state.guard = { ok: false, superadmin: false, reason: "forbidden" }
    const res = await GET()
    expect(res.status).toBe(403)
  })
})
