// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from "vitest"

const state = vi.hoisted(() => ({ configured: true, healthError: null as unknown }))

vi.mock("@/lib/data/store", () => ({
  getPlatformStore: async () => ({
    isConfigured: () => state.configured,
    healthCheck: async () => {
      if (state.healthError) throw state.healthError
    },
  }),
}))

import { GET } from "@/app/api/health/route"

describe("GET /api/health", () => {
  beforeEach(() => {
    state.configured = true
    state.healthError = null
  })

  it("returns 200 with provider neon when the leads table answers", async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: "ok", provider: "neon" })
  })

  it("returns 503 database_unconfigured when DATABASE_URL is missing", async () => {
    state.configured = false
    const res = await GET()
    expect(res.status).toBe(503)
    expect(await res.json()).toEqual({ status: "error", reason: "database_unconfigured", provider: "neon" })
  })

  it("returns 503 leads_table_unreachable without leaking the error text", async () => {
    state.healthError = new Error("password authentication failed for user neondb_owner")
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const res = await GET()
    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body).toEqual({ status: "error", reason: "leads_table_unreachable", provider: "neon" })
    expect(JSON.stringify(body)).not.toContain("password")
    errorSpy.mockRestore()
  })
})
