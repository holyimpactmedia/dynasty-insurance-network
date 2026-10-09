// @vitest-environment node
// TCPA evidence parity: the record the intake route hands to the store must
// carry exactly the values the Supabase-era insert wrote for the same payload.
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"

const h = vi.hoisted(() => ({
  findRecentDuplicate: vi.fn(),
  createLead: vi.fn(),
}))

// after() is a no-op: this file asserts on the stored record, not background work.
vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>()
  return { ...actual, after: vi.fn() }
})

vi.mock("@/lib/data/store", () => ({
  getPlatformStore: async () => ({
    isConfigured: () => true,
    findRecentDuplicate: h.findRecentDuplicate,
    createLead: h.createLead,
  }),
}))

import { POST } from "@/app/api/leads/route"
import { __resetRateLimit } from "@/lib/rate-limit"
import { INDIVIDUAL_INCOME_BRACKETS } from "@/lib/income-thresholds"
import { NextRequest } from "next/server"

const FIXED_NOW = "2026-10-06T15:04:05.678Z"
const CERT_URL = "https://cert.trustedform.com/0123456789abcdef0123456789abcdef01234567"
const REFERENCE = new RegExp(`^HL-${Date.parse(FIXED_NOW).toString(36).toUpperCase()}-[0-9A-Z]{1,4}$`)

function submit(body: unknown, forwardedFor: string) {
  return POST(
    new NextRequest("https://www.dynastyinsurancenetwork.com/api/leads", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": forwardedFor },
      body: JSON.stringify(body),
    }),
  )
}

function storedRecord() {
  expect(h.createLead).toHaveBeenCalledTimes(1)
  return h.createLead.mock.calls[0][0]
}

// Every column the route writes, defaulting to what main stored when the
// funnel did not send the field.
function expected(fields: Record<string, unknown>) {
  return {
    referenceNumber: expect.stringMatching(REFERENCE),
    phone: null,
    age: null,
    state: null,
    incomeRange: null,
    householdSize: null,
    qualifyingEvent: null,
    priorities: null,
    tcpaConsent: true,
    tcpaConsentAt: FIXED_NOW,
    trustedFormCertUrl: null,
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    quizAnswers: null,
    ...fields,
  }
}

// app/individual/page.tsx handleNameSubmit. No funnelType; `priorities` is
// always undefined there (the answer is saved under `priority`).
const individualBody = {
  firstName: "Test",
  lastName: "Parity",
  email: "  Test.Parity@Example.COM ",
  phone: "(555) 010-0199",
  age: "42",
  state: "Florida",
  incomeRange: INDIVIDUAL_INCOME_BRACKETS[1],
  householdSize: "Me + spouse",
  qualifyingEvent: "Lost job coverage",
  tcpaConsent: true,
  trustedFormCertUrl: CERT_URL,
  quizAnswers: { healthScreen: "No", govCoverage: "No" },
  utmSource: "facebook",
  utmMedium: "paid_social",
  utmCampaign: "dynasty_individual_q4",
}

// app/ppo/page.tsx: `priorities` is an ARRAY; `incomeRange` is never set.
const ppoBody = {
  firstName: "Test",
  lastName: "Ppo",
  email: "test.ppo@example.com",
  phone: "(555) 010-0142",
  age: "38",
  state: "Georgia",
  householdSize: "couple",
  qualifyingEvent: "ppo_coverage",
  priorities: ["nationwide"],
  funnelType: "ppo",
  tcpaConsent: true,
  trustedFormCertUrl: CERT_URL,
  quizAnswers: { coverage: "couple", currentSituation: "employer", priority: "nationwide", budget: "700_1000", govCoverage: "No" },
  utmSource: null,
  utmMedium: null,
  utmCampaign: null,
}

// app/cobra/page.tsx handleNameSubmit.
const cobraBody = {
  firstName: "Test",
  lastName: "Cobra",
  email: "test.cobra@example.com",
  phone: "(555) 010-0110",
  age: "51",
  state: "Texas",
  tcpaConsent: true,
  trustedFormCertUrl: CERT_URL,
  funnelType: "cobra",
  quizAnswers: { cobraTimeline: "just-received", cobraCost: "$400 - $700/month", coverageNeeded: "Just me", healthConsiderations: "None", govCoverage: "No" },
  utmSource: "google",
  utmMedium: "cpc",
  utmCampaign: "cobra_q4",
}

// app/family/page.tsx handleNameSubmit: age comes from primaryAge, income is sent.
const familyBody = {
  firstName: "Test",
  lastName: "Family",
  email: "test.family@example.com",
  phone: "(555) 010-0120",
  age: "36",
  state: "Ohio",
  incomeRange: "$80,000 to $120,000",
  tcpaConsent: true,
  trustedFormCertUrl: CERT_URL,
  funnelType: "family",
  quizAnswers: { familyComposition: "2 adults + 2 kids", childrenAges: "5-12", priority: "pediatrics", currentCoverage: "employer", income: "$80,000 to $120,000", healthScreen: "No", govCoverage: "No" },
  utmSource: null,
  utmMedium: null,
  utmCampaign: null,
}

// app/self-employed/page.tsx handleNameSubmit.
const selfEmployedBody = {
  firstName: "Test",
  lastName: "Freelance",
  email: "test.se@example.com",
  phone: "(555) 010-0130",
  age: "29",
  state: "Arizona",
  tcpaConsent: true,
  trustedFormCertUrl: CERT_URL,
  funnelType: "self_employed",
  quizAnswers: { workSituation: "1099", annualIncome: "$60k-$90k", incomeConsistency: "steady", topPriority: "doctor_choice", govCoverage: "No" },
  utmSource: "bing",
  utmMedium: "cpc",
  utmCampaign: "se_q4",
}

// A submission with no age at all (the shape the removed /business funnel
// sent; kept because older links or scripts can still post it).
const businessBody = {
  firstName: "Test",
  lastName: "Owner",
  email: "test.owner@example.com",
  phone: "(555) 010-0140",
  state: "Nevada",
  tcpaConsent: true,
  trustedFormCertUrl: CERT_URL,
  funnelType: "small_business",
  quizAnswers: { businessName: "Test Co", businessSize: "2-10", currentSituation: "none", employerContribution: "50", employeeAgeRange: "25-40", industry: "services", timeline: "30_days" },
  utmSource: null,
  utmMedium: null,
  utmCampaign: null,
}

describe("POST /api/leads: TCPA evidence parity with the Supabase-era insert", () => {
  beforeEach(() => {
    __resetRateLimit()
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date(FIXED_NOW))
    h.findRecentDuplicate.mockReset().mockResolvedValue(null)
    h.createLead.mockReset().mockResolvedValue({ id: "lead-uuid-1", createdAt: "2026-10-06 15:04:05.9+00" })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("individual funnel", async () => {
    const res = await submit(individualBody, "203.0.113.7, 10.0.0.1")
    expect(res.status).toBe(200)
    expect(storedRecord()).toStrictEqual(expected({
      firstName: "Test", lastName: "Parity", email: "test.parity@example.com", phone: "(555) 010-0199",
      age: 42, state: "Florida", incomeRange: INDIVIDUAL_INCOME_BRACKETS[1], householdSize: "Me + spouse",
      qualifyingEvent: "Lost job coverage", trustedFormCertUrl: CERT_URL, funnelType: "private_health",
      utmSource: "facebook", utmMedium: "paid_social", utmCampaign: "dynasty_individual_q4",
      ipAddress: "203.0.113.7", quizAnswers: { healthScreen: "No", govCoverage: "No" },
    }))
  })

  it("PPO funnel stores the priorities array as JSON text, as the JSON insert did", async () => {
    const res = await submit(ppoBody, "198.51.100.23")
    expect(res.status).toBe(200)
    expect(storedRecord()).toStrictEqual(expected({
      firstName: "Test", lastName: "Ppo", email: "test.ppo@example.com", phone: "(555) 010-0142",
      age: 38, state: "Georgia", householdSize: "couple", qualifyingEvent: "ppo_coverage",
      priorities: '["nationwide"]', trustedFormCertUrl: CERT_URL, funnelType: "ppo",
      ipAddress: "198.51.100.23", quizAnswers: ppoBody.quizAnswers,
    }))
  })

  it("cobra funnel", async () => {
    await submit(cobraBody, "192.0.2.10")
    expect(storedRecord()).toStrictEqual(expected({
      firstName: "Test", lastName: "Cobra", email: "test.cobra@example.com", phone: "(555) 010-0110",
      age: 51, state: "Texas", trustedFormCertUrl: CERT_URL, funnelType: "cobra",
      utmSource: "google", utmMedium: "cpc", utmCampaign: "cobra_q4",
      ipAddress: "192.0.2.10", quizAnswers: cobraBody.quizAnswers,
    }))
  })

  it("family funnel", async () => {
    await submit(familyBody, "192.0.2.11")
    expect(storedRecord()).toStrictEqual(expected({
      firstName: "Test", lastName: "Family", email: "test.family@example.com", phone: "(555) 010-0120",
      age: 36, state: "Ohio", incomeRange: "$80,000 to $120,000", trustedFormCertUrl: CERT_URL,
      funnelType: "family", ipAddress: "192.0.2.11", quizAnswers: familyBody.quizAnswers,
    }))
  })

  it("self-employed funnel", async () => {
    await submit(selfEmployedBody, "192.0.2.12")
    expect(storedRecord()).toStrictEqual(expected({
      firstName: "Test", lastName: "Freelance", email: "test.se@example.com", phone: "(555) 010-0130",
      age: 29, state: "Arizona", trustedFormCertUrl: CERT_URL, funnelType: "self_employed",
      utmSource: "bing", utmMedium: "cpc", utmCampaign: "se_q4",
      ipAddress: "192.0.2.12", quizAnswers: selfEmployedBody.quizAnswers,
    }))
  })

  it("a submission with no age stores age as null", async () => {
    await submit(businessBody, "192.0.2.13")
    expect(storedRecord()).toStrictEqual(expected({
      firstName: "Test", lastName: "Owner", email: "test.owner@example.com", phone: "(555) 010-0140",
      state: "Nevada", trustedFormCertUrl: CERT_URL, funnelType: "small_business",
      ipAddress: "192.0.2.13", quizAnswers: businessBody.quizAnswers,
    }))
  })

  it("returns the same reference number it stored", async () => {
    const res = await submit(individualBody, "203.0.113.8")
    expect((await res.json()).referenceNumber).toBe(storedRecord().referenceNumber)
  })

  it("dedupes on the normalized email over a 10-minute window", async () => {
    await submit(individualBody, "203.0.113.9")
    expect(h.findRecentDuplicate).toHaveBeenCalledWith(
      "test.parity@example.com",
      new Date(Date.parse(FIXED_NOW) - 10 * 60 * 1000).toISOString(),
    )
  })

  it("PPO funnel with no priority picked stores the text []", async () => {
    await submit({ ...ppoBody, priorities: [] }, "198.51.100.24")
    expect(storedRecord().priorities).toBe("[]")
  })

  it("a non-numeric age is stored as null and the lead is still inserted", async () => {
    await submit({ ...individualBody, age: "forty" }, "203.0.113.10")
    expect(storedRecord().age).toBeNull()
  })
})
