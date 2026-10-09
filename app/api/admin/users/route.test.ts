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
