import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"

// Shared, mutable mock state (hoisted so the vi.mock factory can close over it).
const state = vi.hoisted(() => ({
  configured: true,
  duplicateReference: null as string | null,
  duplicateError: null as unknown,
  insertResult: { id: "lead-1", createdAt: "2026-01-01T00:00:00Z" } as { id: string; createdAt: string } | null,
  insertError: null as unknown,
}))

// after() is a no-op in tests: we assert on the response, not the background work.
vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>()
  return { ...actual, after: vi.fn() }
})

// Fake platform store: the three methods the intake route calls.
vi.mock("@/lib/data/store", () => ({
  getPlatformStore: async () => ({
    isConfigured: () => state.configured,
    findRecentDuplicate: async () => {
      if (state.duplicateError) throw state.duplicateError
      return state.duplicateReference
    },
    createLead: async () => {
      if (state.insertError) throw state.insertError
      return state.insertResult
    },
  }),
}))

import { POST } from "@/app/api/leads/route"
import { __resetRateLimit } from "@/lib/rate-limit"
import { NextRequest } from "next/server"

function makeReq(body: unknown, ip = "1.2.3.4"): NextRequest {
  return new NextRequest("http://localhost/api/leads", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  })
}

const validLead = { firstName: "A", lastName: "B", email: "a@b.com", tcpaConsent: true }

describe("POST /api/leads", () => {
  beforeEach(() => {
    __resetRateLimit()
    state.configured = true
    state.duplicateReference = null
    state.duplicateError = null
    state.insertResult = { id: "lead-1", createdAt: "2026-01-01T00:00:00Z" }
    state.insertError = null
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("rejects missing required fields with 400", async () => {
    const res = await POST(makeReq({ tcpaConsent: true }))
    expect(res.status).toBe(400)
  })

  it("rejects missing TCPA consent with 400", async () => {
    const res = await POST(makeReq({ firstName: "A", lastName: "B", email: "a@b.com" }))
    expect(res.status).toBe(400)
  })

  it("accepts a valid lead with 200", async () => {
    const res = await POST(makeReq(validLead))
    expect(res.status).toBe(200)
    expect((await res.json()).success).toBe(true)
  })

  it("dedupes a repeat email and returns the existing reference", async () => {
    state.duplicateReference = "HL-EXISTING"
    const res = await POST(makeReq(validLead, "9.9.9.9"))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.referenceNumber).toBe("HL-EXISTING")
    expect(json.message).toMatch(/already/i)
  })

  it("rate-limits a burst from one IP with 429", async () => {
    for (let i = 0; i < 8; i++) {
      await POST(makeReq({ ...validLead, email: `x${i}@b.com` }, "7.7.7.7"))
    }
    const res = await POST(makeReq({ ...validLead, email: "over@b.com" }, "7.7.7.7"))
    expect(res.status).toBe(429)
  })

  it("still returns 200 and logs loudly when the insert fails", async () => {
    state.insertError = new Error("insert failed")
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const res = await POST(makeReq(validLead))
    expect(res.status).toBe(200)
    expect((await res.json()).success).toBe(true)
    expect(errorSpy.mock.calls.some(([msg]) => String(msg).includes("LEAD INSERT FAILED"))).toBe(true)
  })

  it("still returns 200 when the duplicate lookup fails (Neon down)", async () => {
    state.duplicateError = new Error("connection refused")
    vi.spyOn(console, "error").mockImplementation(() => {})
    const res = await POST(makeReq(validLead))
    expect(res.status).toBe(200)
    expect((await res.json()).message).toBe("Lead submitted successfully")
  })

  it("still returns 200 (email-only) when the database is not configured", async () => {
    state.configured = false
    vi.spyOn(console, "warn").mockImplementation(() => {})
    const res = await POST(makeReq(validLead))
    expect(res.status).toBe(200)
  })
})
