import { inspect } from "node:util"
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"

// Shared, mutable mock state (hoisted so the vi.mock factory can close over it).
const state = vi.hoisted(() => ({
  configured: true,
  duplicateReference: null as string | null,
  duplicateError: null as unknown,
  insertResult: { id: "lead-1", createdAt: "2026-01-01T00:00:00Z" } as { id: string; createdAt: string } | null,
  insertError: null as unknown,
  callbacks: [] as Array<() => Promise<void>>,
}))

const spies = vi.hoisted(() => ({
  findRecentDuplicate: vi.fn(),
  createLead: vi.fn(),
  sendLeadConfirmation: vi.fn(),
  notifyAdmin: vi.fn(),
  postLeadToUsha: vi.fn(),
  scoreAndUpdateLead: vi.fn(),
}))

// after() captures its callback instead of running it. Most tests assert on the
// response only; the database-down tests run the captured callbacks, because
// the emails and the USHA post still going out is the point there.
vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>()
  return {
    ...actual,
    after: vi.fn((cb: () => Promise<void>) => {
      state.callbacks.push(cb)
    }),
  }
})

// Fake platform store: the methods the intake route calls.
vi.mock("@/lib/data/store", () => ({
  getPlatformStore: async () => ({
    isConfigured: () => state.configured,
    findRecentDuplicate: spies.findRecentDuplicate,
    createLead: spies.createLead,
  }),
}))

vi.mock("@/lib/email/sendLeadConfirmation", () => ({ sendLeadConfirmation: spies.sendLeadConfirmation }))
vi.mock("@/lib/email/notifyAdmin", () => ({ notifyAdmin: spies.notifyAdmin }))
vi.mock("@/lib/usha/postLead", () => ({ postLeadToUsha: spies.postLeadToUsha }))
vi.mock("@/lib/ai/scoreLeadWithAI", () => ({ scoreAndUpdateLead: spies.scoreAndUpdateLead }))

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

async function runBackground() {
  for (const cb of state.callbacks) await cb()
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
    state.callbacks = []
    spies.findRecentDuplicate.mockReset().mockImplementation(async () => {
      if (state.duplicateError) throw state.duplicateError
      return state.duplicateReference
    })
    spies.createLead.mockReset().mockImplementation(async () => {
      if (state.insertError) throw state.insertError
      return state.insertResult
    })
    spies.sendLeadConfirmation.mockReset()
    spies.notifyAdmin.mockReset()
    spies.postLeadToUsha.mockReset()
    spies.scoreAndUpdateLead.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
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

    expect(state.callbacks).toHaveLength(1)
    await runBackground()
    expect(spies.sendLeadConfirmation).toHaveBeenCalledTimes(1)
    expect(spies.postLeadToUsha).toHaveBeenCalledTimes(1)
    expect(spies.notifyAdmin).toHaveBeenCalledTimes(1)
  })

  it("still returns 200 when the duplicate lookup fails (Neon down)", async () => {
    state.duplicateError = new Error("connection refused")
    vi.spyOn(console, "error").mockImplementation(() => {})
    const res = await POST(makeReq(validLead))
    expect(res.status).toBe(200)
    expect((await res.json()).message).toBe("Lead submitted successfully")

    // The insert is still attempted after a failed lookup.
    expect(spies.createLead).toHaveBeenCalledTimes(1)
    expect(state.callbacks).toHaveLength(1)
    await runBackground()
    expect(spies.sendLeadConfirmation).toHaveBeenCalledTimes(1)
    expect(spies.postLeadToUsha).toHaveBeenCalledTimes(1)
    expect(spies.notifyAdmin).toHaveBeenCalledTimes(1)
  })

  it("still returns 200 (email-only) when the database is not configured, and logs LEAD NOT STORED", async () => {
    state.configured = false
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const res = await POST(makeReq(validLead))
    expect(res.status).toBe(200)
    expect(errorSpy.mock.calls.some(([msg]) => String(msg).includes("LEAD NOT STORED"))).toBe(true)

    // Not configured means the store is never queried, but the emails and the USHA post still go out.
    expect(spies.findRecentDuplicate).not.toHaveBeenCalled()
    expect(spies.createLead).not.toHaveBeenCalled()
    expect(state.callbacks).toHaveLength(1)
    await runBackground()
    expect(spies.sendLeadConfirmation).toHaveBeenCalledTimes(1)
    expect(spies.postLeadToUsha).toHaveBeenCalledTimes(1)
    expect(spies.notifyAdmin).toHaveBeenCalledTimes(1)
  })

  it("logs LEAD INSERT FAILED when the insert resolves no row (reference collision with a different lead)", async () => {
    state.insertResult = null
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const res = await POST(makeReq(validLead))
    expect(res.status).toBe(200)
    expect(errorSpy.mock.calls.some(([msg]) => String(msg).includes("LEAD INSERT FAILED"))).toBe(true)

    await runBackground()
    expect(spies.sendLeadConfirmation).toHaveBeenCalledTimes(1)
    expect(spies.postLeadToUsha).toHaveBeenCalledTimes(1)
    expect(spies.notifyAdmin).toHaveBeenCalledTimes(1)
    expect(spies.postLeadToUsha.mock.calls[0][0]).toBeNull()
  })

  it("an unreadable request body returns 500 and the log carries no part of the body", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    // V8 quotes the start of an unparseable body in the SyntaxError message.
    const raw = "jane.doe@example.com 5550100 not json"
    const res = await POST(
      new NextRequest("http://localhost/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": "1.2.3.4" },
        body: raw,
      }),
    )
    expect(res.status).toBe(500)
    const logged = errorSpy.mock.calls.map((args) => args.map((arg) => inspect(arg, { depth: 6 })).join(" ")).join("\n")
    expect(logged).toContain("Error processing lead submission")
    expect(logged).not.toContain("jane.doe")
    expect(logged).not.toContain("5550100")
    expect(logged).not.toContain("not json")
  })

  describe("logs carry no consumer email or phone", () => {
    const PII_LEAD = { ...validLead, phone: "5550100" }
    // drizzle 0.45 wraps a driver error in a message that quotes the statement and its parameters.
    function drizzleQueryError() {
      const driver = Object.assign(new Error("Connection terminated unexpectedly"), { code: "ECONNRESET" })
      return Object.assign(new Error("Failed query: insert into leads\nparams: HL-1,A,B,a@b.com,5550100"), {
        query: "insert into leads",
        params: ["a@b.com", "5550100"],
        cause: driver,
      })
    }
    const everything = (...spies: Array<{ mock: { calls: unknown[][] } }>) =>
      spies.flatMap((spy) => spy.mock.calls.map((args) => args.map((arg) => inspect(arg, { depth: 6 })).join(" "))).join("\n")

    it("a failed insert logs the failure without the statement parameters", async () => {
      state.insertError = drizzleQueryError()
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
      const res = await POST(makeReq(PII_LEAD))
      expect(res.status).toBe(200)
      const logged = everything(errorSpy, logSpy)
      expect(logged).toContain("LEAD INSERT FAILED")
      expect(logged).toContain("ECONNRESET")
      expect(logged).not.toContain("a@b.com")
      expect(logged).not.toContain("5550100")
    })

    it("a failed duplicate lookup logs the failure without the statement parameters", async () => {
      state.duplicateError = drizzleQueryError()
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
      const res = await POST(makeReq(PII_LEAD))
      expect(res.status).toBe(200)
      const logged = everything(errorSpy, logSpy)
      expect(logged).toContain("LEAD DEDUP LOOKUP FAILED")
      expect(logged).not.toContain("a@b.com")
      expect(logged).not.toContain("5550100")
    })

    it("an ignored duplicate submission logs the reference, not the email", async () => {
      state.duplicateReference = "HL-EXISTING"
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
      const res = await POST(makeReq(PII_LEAD, "9.9.9.9"))
      expect(res.status).toBe(200)
      const logged = everything(logSpy)
      expect(logged).toContain("HL-EXISTING")
      expect(logged).not.toContain("a@b.com")
    })
  })

  describe("database time budget", () => {
    const never = () => new Promise<never>(() => {})
    const loggedTags = (spy: { mock: { calls: unknown[][] } }) => spy.mock.calls.map(([msg]) => String(msg)).join("\n")
    // Fake only what the budget uses; real promises and microtasks keep working.
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] })
    })

    function track(promise: Promise<Response>) {
      const out = { settled: false }
      void promise.then(() => {
        out.settled = true
      })
      return out
    }

    it("a hung duplicate lookup does not starve the insert", async () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      spies.findRecentDuplicate.mockImplementation(() => never())
      spies.createLead.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ id: "late-1", createdAt: "2026-01-01T00:00:00Z" }), 5_000)),
      )
      const pending = POST(makeReq(validLead))
      await vi.advanceTimersByTimeAsync(10_001)
      const res = await pending
      expect(res.status).toBe(200)
      expect(spies.createLead).toHaveBeenCalledTimes(1)
      expect(loggedTags(errorSpy)).toContain("LEAD DEDUP LOOKUP FAILED")
      expect(loggedTags(errorSpy)).not.toContain("LEAD INSERT FAILED")

      await runBackground()
      expect(spies.sendLeadConfirmation).toHaveBeenCalledTimes(1)
      expect(spies.postLeadToUsha).toHaveBeenCalledTimes(1)
      expect(spies.notifyAdmin).toHaveBeenCalledTimes(1)
      // The insert's result was used: the background steps got the stored lead's id.
      expect(spies.postLeadToUsha.mock.calls[0][0]).toBe("late-1")
    })

    it("a hung insert is cut off after the budget and the emails still go out", async () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      spies.createLead.mockImplementation(() => never())
      const pending = POST(makeReq(validLead))
      await vi.advanceTimersByTimeAsync(10_001)
      const res = await pending
      expect(res.status).toBe(200)
      expect(loggedTags(errorSpy)).toContain("LEAD INSERT FAILED")

      await runBackground()
      expect(spies.sendLeadConfirmation).toHaveBeenCalledTimes(1)
      expect(spies.postLeadToUsha).toHaveBeenCalledTimes(1)
      expect(spies.notifyAdmin).toHaveBeenCalledTimes(1)
      expect(spies.postLeadToUsha.mock.calls[0][0]).toBeNull()
    })

    it("answers within 10 s in total when both the lookup and the insert hang", async () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      spies.findRecentDuplicate.mockImplementation(() => never())
      spies.createLead.mockImplementation(() => never())
      const pending = POST(makeReq(validLead))
      const outcome = track(pending)

      await vi.advanceTimersByTimeAsync(9_999)
      expect(outcome.settled).toBe(false)
      await vi.advanceTimersByTimeAsync(2)
      expect(outcome.settled).toBe(true)

      const res = await pending
      expect(res.status).toBe(200)
      expect(loggedTags(errorSpy)).toContain("LEAD DEDUP LOOKUP FAILED")
      expect(loggedTags(errorSpy)).toContain("LEAD INSERT FAILED")

      await runBackground()
      expect(spies.sendLeadConfirmation).toHaveBeenCalledTimes(1)
      expect(spies.postLeadToUsha).toHaveBeenCalledTimes(1)
      expect(spies.notifyAdmin).toHaveBeenCalledTimes(1)
    })

    it("leaves no timer pending when both calls resolve quickly", async () => {
      const res = await POST(makeReq(validLead))
      expect(res.status).toBe(200)
      expect(spies.createLead).toHaveBeenCalledTimes(1)
      expect(vi.getTimerCount()).toBe(0)
    })
  })
})
