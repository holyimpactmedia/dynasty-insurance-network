import { beforeEach, describe, expect, it, vi } from "vitest"

interface MockSession {
  user: {
    id: string
    email: string
    name: string
    role: string
  }
  session: { id: string }
}

const authState = vi.hoisted(() => ({ session: null as MockSession | null }))

vi.mock("next/headers", () => ({ headers: async () => new Headers() }))
vi.mock("@/lib/platform/provider", () => ({
  isPlatformConfigured: () => true,
}))
vi.mock("@/lib/auth/server", () => ({
  auth: { api: { getSession: async () => authState.session } },
}))

function session(role: string): MockSession {
  return {
    user: {
      id: `${role}-id`,
      email: `${role}@example.com`,
      name: `${role} Person`,
      role,
    },
    session: { id: `${role}-session` },
  }
}

async function loadGate() {
  vi.resetModules()
  return import("./requireAdmin")
}

describe("Neon admin authorization", () => {
  beforeEach(() => {
    authState.session = null
  })

  it("returns 401 without a session", async () => {
    const { requireAdminApi } = await loadGate()
    const result = await requireAdminApi()
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(401)
  })

  it("returns 403 for an ordinary user", async () => {
    authState.session = session("user")
    const { requireAdminApi } = await loadGate()
    const result = await requireAdminApi()
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(403)
  })

  it("accepts an admin without settings authority", async () => {
    authState.session = session("admin")
    const { requireAdminApi } = await loadGate()
    const result = await requireAdminApi()
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.ctx.profile.role).toBe("admin")
      expect(result.ctx.isSuperAdmin).toBe(false)
    }
  })

  it("accepts a superadmin with settings authority", async () => {
    authState.session = session("superadmin")
    const { requireAdminApi } = await loadGate()
    const result = await requireAdminApi()
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.ctx.profile.role).toBe("superadmin")
      expect(result.ctx.isSuperAdmin).toBe(true)
    }
  })
})
