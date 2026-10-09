// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

const state = vi.hoisted(() => ({ configured: true, cookie: null as string | null }))
vi.mock("@/lib/platform/provider", () => ({ isPlatformConfigured: () => state.configured }))
vi.mock("better-auth/cookies", () => ({ getSessionCookie: () => state.cookie }))

import { proxy } from "./proxy"

afterEach(() => {
  state.configured = true
  state.cookie = null
})

describe("proxy", () => {
  it("redirects a cookieless dashboard request to login", async () => {
    const res = await proxy(new NextRequest("http://localhost/dashboard/admin"))
    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toBe("http://localhost/auth/login?redirectTo=%2Fdashboard%2Fadmin")
  })
  it("lets the dashboard render SetupRequired when the platform is not configured", async () => {
    state.configured = false
    const res = await proxy(new NextRequest("http://localhost/dashboard/admin"))
    expect(res.headers.get("location")).toBeNull()
  })
  it("passes a dashboard request with a session cookie through", async () => {
    state.cookie = "session-token"
    const res = await proxy(new NextRequest("http://localhost/dashboard/admin"))
    expect(res.headers.get("location")).toBeNull()
  })
})
