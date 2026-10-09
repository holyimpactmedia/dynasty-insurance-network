// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi, type MockInstance } from "vitest"

const h = vi.hoisted(() => ({
  callbacks: [] as Array<() => Promise<void>>,
  claimTrustedFormCertificate: vi.fn(),
}))

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
vi.mock("@/lib/trustedform/claim", () => ({ claimTrustedFormCertificate: h.claimTrustedFormCertificate }))
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
const MISSING_PHRASE = "Reply STOP to opt out of SMS"

async function submitAndRunBackground(extra: Record<string, unknown> = { trustedFormCertUrl: CERT }) {
  const res = await POST(
    new NextRequest("https://www.dynastyinsurancenetwork.com/api/leads", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.50" },
      body: JSON.stringify({ firstName: "A", lastName: "B", email: "A@B.com", phone: "5550100", tcpaConsent: true, ...extra }),
    }),
  )
  for (const cb of h.callbacks) await cb()
  return res
}

// Everything the route logged, as one string, so a leaked address or number cannot hide in an argument.
function everythingLogged(...spies: Array<{ mock: { calls: unknown[][] } }>): string {
  return spies.map((spy) => JSON.stringify(spy.mock.calls)).join("\n")
}

describe("TrustedForm claim from /api/leads", () => {
  let logSpy: MockInstance<typeof console.log>
  let errorSpy: MockInstance<typeof console.error>

  beforeEach(() => {
    __resetRateLimit()
    h.callbacks = []
    h.claimTrustedFormCertificate.mockReset()
    vi.mocked(sendLeadConfirmation).mockClear()
    vi.mocked(notifyAdmin).mockClear()
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("claims the certificate once with the cert URL, the reference and the normalized contact fields", async () => {
    h.claimTrustedFormCertificate.mockResolvedValue({
      status: "claimed",
      outcome: "success",
      warnings: [],
      requiredFound: [MISSING_PHRASE],
      requiredNotFound: [],
    })
    const res = await submitAndRunBackground()
    const { referenceNumber } = await res.json()
    expect(h.claimTrustedFormCertificate).toHaveBeenCalledTimes(1)
    expect(h.claimTrustedFormCertificate).toHaveBeenCalledWith({
      certUrl: CERT,
      reference: referenceNumber,
      email: "a@b.com",
      phone: "5550100",
    })
  })

  it("logs TRUSTEDFORM CLAIM OK for a successful claim with every phrase found", async () => {
    h.claimTrustedFormCertificate.mockResolvedValue({
      status: "claimed",
      outcome: "success",
      warnings: [],
      requiredFound: ["consent to be contacted by Holy Impact Media", MISSING_PHRASE],
      requiredNotFound: [],
    })
    await submitAndRunBackground()
    expect(logSpy.mock.calls.some(([msg]) => String(msg).includes("TRUSTEDFORM CLAIM OK"))).toBe(true)
    expect(errorSpy).not.toHaveBeenCalled()
    const logged = everythingLogged(logSpy, errorSpy)
    expect(logged).not.toContain("a@b.com")
    expect(logged).not.toContain("5550100")
  })

  it("logs TRUSTEDFORM SCAN MISMATCH, with the missing phrase and warnings, when a consent phrase was not found", async () => {
    h.claimTrustedFormCertificate.mockResolvedValue({
      status: "claimed",
      outcome: "failure",
      warnings: ["string not found in snapshot"],
      requiredFound: ["consent to be contacted by Holy Impact Media"],
      requiredNotFound: [MISSING_PHRASE],
    })
    await submitAndRunBackground()
    const mismatch = errorSpy.mock.calls.find(([msg]) => String(msg).includes("TRUSTEDFORM SCAN MISMATCH"))
    expect(mismatch).toBeDefined()
    expect(JSON.stringify(mismatch)).toContain(MISSING_PHRASE)
    expect(JSON.stringify(mismatch)).toContain("string not found in snapshot")
    expect(logSpy.mock.calls.some(([msg]) => String(msg).includes("TRUSTEDFORM CLAIM OK"))).toBe(false)
    const logged = everythingLogged(logSpy, errorSpy)
    expect(logged).not.toContain("a@b.com")
    expect(logged).not.toContain("5550100")
  })

  it("logs TRUSTEDFORM CLAIM FAILED with the reason, and the emails still go out", async () => {
    h.claimTrustedFormCertificate.mockResolvedValue({ status: "failed", reason: "HTTP 404" })
    await submitAndRunBackground()
    const failed = errorSpy.mock.calls.find(([msg]) => String(msg).includes("TRUSTEDFORM CLAIM FAILED"))
    expect(failed).toBeDefined()
    expect(JSON.stringify(failed)).toContain("HTTP 404")
    expect(sendLeadConfirmation).toHaveBeenCalledTimes(1)
    expect(notifyAdmin).toHaveBeenCalledTimes(1)
    const logged = everythingLogged(logSpy, errorSpy)
    expect(logged).not.toContain("a@b.com")
    expect(logged).not.toContain("5550100")
  })

  it("logs TRUSTEDFORM CLAIM FAILED if the claim function itself rejects, and the emails still go out", async () => {
    h.claimTrustedFormCertificate.mockRejectedValue(new Error("unexpected"))
    await submitAndRunBackground()
    const failed = errorSpy.mock.calls.find(([msg]) => String(msg).includes("TRUSTEDFORM CLAIM FAILED"))
    expect(failed).toBeDefined()
    expect(JSON.stringify(failed)).toContain("unexpected")
    expect(sendLeadConfirmation).toHaveBeenCalledTimes(1)
    expect(notifyAdmin).toHaveBeenCalledTimes(1)
  })

  it("does not claim when the lead carried no certificate URL", async () => {
    await submitAndRunBackground({})
    expect(h.claimTrustedFormCertificate).not.toHaveBeenCalled()
    expect(sendLeadConfirmation).toHaveBeenCalledTimes(1)
    expect(notifyAdmin).toHaveBeenCalledTimes(1)
  })
})
