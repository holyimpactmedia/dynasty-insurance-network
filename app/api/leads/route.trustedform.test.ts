// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"

const h = vi.hoisted(() => ({ callbacks: [] as Array<() => Promise<void>> }))

vi.mock("next/server", async (orig) => ({
  ...(await orig<typeof import("next/server")>()),
  after: vi.fn((cb: () => Promise<void>) => {
    h.callbacks.push(cb)
  }),
}))
vi.mock("@/lib/data/store", () => ({
  getPlatformStore: async () => ({
    isConfigured: () => true,
    findRecentDuplicate: async () => null,
    createLead: async () => ({ id: "lead-1", createdAt: "2026-10-06 15:04:05+00" }),
  }),
}))
vi.mock("@/lib/email/sendLeadConfirmation", () => ({ sendLeadConfirmation: vi.fn() }))
vi.mock("@/lib/email/notifyAdmin", () => ({ notifyAdmin: vi.fn() }))
vi.mock("@/lib/usha/postLead", () => ({ postLeadToUsha: vi.fn() }))
vi.mock("@/lib/ai/scoreLeadWithAI", () => ({ scoreAndUpdateLead: vi.fn() }))

import { POST } from "@/app/api/leads/route"
import { __resetRateLimit } from "@/lib/rate-limit"
import { sendLeadConfirmation } from "@/lib/email/sendLeadConfirmation"
import { notifyAdmin } from "@/lib/email/notifyAdmin"
import { NextRequest } from "next/server"

const CERT = "https://cert.trustedform.com/0123456789abcdef0123456789abcdef01234567"

async function submitAndRunBackground() {
  const res = await POST(
    new NextRequest("https://www.dynastyinsurancenetwork.com/api/leads", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.50" },
      body: JSON.stringify({ firstName: "A", lastName: "B", email: "A@B.com", phone: "5550100", tcpaConsent: true, trustedFormCertUrl: CERT }),
    }),
  )
  for (const cb of h.callbacks) await cb()
  return res
}

describe("TrustedForm claim from /api/leads", () => {
  beforeEach(() => {
    __resetRateLimit()
    h.callbacks = []
    vi.mocked(sendLeadConfirmation).mockClear()
    vi.mocked(notifyAdmin).mockClear()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("posts certUrl and reference, the fields the claim route reads", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)
    const res = await submitAndRunBackground()
    const { referenceNumber } = await res.json()
    const call = fetchMock.mock.calls.find(([url]) => String(url).endsWith("/api/trustedform/claim"))
    expect(call).toBeDefined()
    expect(JSON.parse(call![1].body)).toEqual({ certUrl: CERT, reference: referenceNumber, email: "a@b.com", phone: "5550100" })
  })

  it("bounds the claim with a timeout signal", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)
    await submitAndRunBackground()
    const call = fetchMock.mock.calls.find(([url]) => String(url).endsWith("/api/trustedform/claim"))
    expect(call).toBeDefined()
    expect(call![1].signal).toBeInstanceOf(AbortSignal)
  })

  it("a timed-out claim is logged and the emails still go out", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("The operation was aborted due to timeout", "TimeoutError")))
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    await submitAndRunBackground()
    expect(errorSpy.mock.calls.some(([msg]) => String(msg).includes("TRUSTEDFORM CLAIM FAILED"))).toBe(true)
    expect(sendLeadConfirmation).toHaveBeenCalledTimes(1)
    expect(notifyAdmin).toHaveBeenCalledTimes(1)
  })

  it("logs loudly when the claim is rejected", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("bad", { status: 400 })))
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    await submitAndRunBackground()
    expect(errorSpy.mock.calls.some(([msg]) => String(msg).includes("TRUSTEDFORM CLAIM FAILED"))).toBe(true)
  })
})
