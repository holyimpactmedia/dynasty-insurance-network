import { afterEach, describe, expect, it, vi } from "vitest"

const state = vi.hoisted(() => ({ configured: false, serverLoaded: false }))

vi.mock("@/lib/platform/provider", () => ({ isPlatformConfigured: () => state.configured }))
vi.mock("@/lib/auth/server", () => {
  state.serverLoaded = true
  return { auth: { handler: async () => new Response("ok", { status: 200 }) } }
})

afterEach(() => {
  state.configured = false
  state.serverLoaded = false
  vi.resetModules()
})

describe("auth route fails closed", () => {
  it("returns 503 and never loads Better Auth when the platform is not configured", async () => {
    const { POST } = await import("./route")
    const res = await POST(new Request("http://localhost/api/auth/sign-in/email", { method: "POST" }))
    expect(res.status).toBe(503)
    expect(await res.json()).toEqual({ message: "Sign-in is not configured yet." })
    expect(state.serverLoaded).toBe(false)
  })
  it("delegates to Better Auth when configured", async () => {
    state.configured = true
    const { GET } = await import("./route")
    const res = await GET(new Request("http://localhost/api/auth/get-session"))
    expect(res.status).toBe(200)
    expect(state.serverLoaded).toBe(true)
  })
})
