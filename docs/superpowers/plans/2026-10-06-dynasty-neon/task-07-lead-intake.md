# Task 7: Lead intake on Neon

Part of [docs/plan.md](../../../plan.md). Read its Global Constraints first.

**Goal:** every funnel submission is stored in Neon with exactly the values the Supabase insert stored (TCPA evidence parity), the form still succeeds and still emails when Neon is down, unsubscribe writes the Neon suppression list, and AI scoring and USHA status updates write to Neon.

**Files:**
- Replace: `app/api/leads/route.ts`, `app/api/leads/route.test.ts`
- Create: `app/api/leads/route.parity.test.ts`, `app/api/unsubscribe/route.test.ts`
- Modify: `app/api/unsubscribe/route.ts`, `lib/ai/scoreLeadWithAI.ts`, `lib/types/lead.ts` (comment), `lib/time/ranges.ts` (comment)
- Replace (copy verbatim): `lib/usha/postLead.ts`
- Delete: `lib/supabase/admin.ts`
- Untouched on purpose: `lib/email/sendLeadConfirmation.ts` (legal-frozen), `lib/email/notifyAdmin.ts` (every redesign change there is Union branding), `app/api/trustedform/claim/route.ts` (separate task)

**Interfaces:**
- Consumes: Task 4 `getPlatformStore()` and `PlatformStore` (`isConfigured`, `findRecentDuplicate`, `createLead`, `updateAiScore`, `updateMarketplaceStatus`, `recordSuppression`).
- Produces: `POST /api/leads` with the same request and response shape as today (`{ success: true, referenceNumber, message }`, 400/429/500 as today).

**Why:** a straight copy of the redesign route would (a) return 500 and skip every email and the USHA post when Neon is down, because its duplicate lookup sits outside any try/catch; (b) store PPO `priorities` arrays as Postgres array literals (`{"x"}`) instead of the JSON text Supabase stored (`["x"]`); (c) fail the whole insert on a non-numeric age, losing the lead and its TCPA record. Review Focus items 1 and 2.

- [ ] **Step 1: Write the parity test first**

Create `app/api/leads/route.parity.test.ts`:

```ts
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

// app/business/page.tsx handleContactSubmit: sends no age.
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

  it("business funnel (no age sent)", async () => {
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
```

- [ ] **Step 2: Replace the route test (store mocked instead of Supabase)**

Replace `app/api/leads/route.test.ts` entirely with:

```ts
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
```

- [ ] **Step 3: Run both test files to confirm they fail**

```bash
pnpm vitest run app/api/leads
```

Expected: FAIL across both files (the route still imports `@/lib/supabase/admin` and never calls the mocked store).

- [ ] **Step 4: Replace the intake route**

Replace `app/api/leads/route.ts` entirely with:

```ts
import { NextRequest, NextResponse, after } from 'next/server'
import { getPlatformStore } from '@/lib/data/store'
import { sendLeadConfirmation } from '@/lib/email/sendLeadConfirmation'
import { scoreAndUpdateLead } from '@/lib/ai/scoreLeadWithAI'
import { postLeadToUsha } from '@/lib/usha/postLead'
import { notifyAdmin } from '@/lib/email/notifyAdmin'
import { checkRateLimit } from '@/lib/rate-limit'

// Generate a unique reference number for leads
function generateReferenceNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `HL-${timestamp}-${random}`
}

// A repeat submission of the same email inside this window is treated as a
// duplicate: we return success without re-inserting or re-spending money on
// AI scoring / USHA / email.
const DEDUP_WINDOW_MS = 10 * 60 * 1000

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      firstName,
      lastName,
      email,
      phone,
      age,
      state,
      incomeRange,
      householdSize,
      qualifyingEvent,
      priorities,
      tcpaConsent,
      trustedFormCertUrl,
      utmSource,
      utmMedium,
      utmCampaign,
      funnelType,
      quizAnswers,
    } = body

    // Required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, email' },
        { status: 400 },
      )
    }

    // TCPA consent is mandatory
    if (!tcpaConsent) {
      return NextResponse.json(
        { error: 'TCPA consent is required' },
        { status: 400 },
      )
    }

    // Client IP (best-effort, used for rate limiting + lead attribution)
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown'

    // Rate limit: /api/leads is public and spends money per call (Anthropic,
    // Resend, USHA). Best-effort in-memory limiter; the dedup check below is
    // the reliable backstop.
    const rl = checkRateLimit(`leads:${ipAddress}`)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 },
      )
    }

    const normalizedEmail = String(email).toLowerCase().trim()
    const store = await getPlatformStore()
    const referenceNumber = generateReferenceNumber()
    const tcpaConsentAt = new Date().toISOString()
    const resolvedFunnelType = funnelType || 'private_health'

    // Lead record id/created_at, populated by a successful insert.
    let data: { id: string | null; created_at: string } = {
      id: null,
      created_at: new Date().toISOString(),
    }

    if (!store.isConfigured()) {
      console.warn('Platform database not configured. Lead sent via email only.', { referenceNumber })
    } else {
      // Duplicate check: same email submitted recently => idempotent success.
      // A failed lookup must not block intake: carry on to the insert, as the
      // Supabase version did when its lookup returned an error.
      const since = new Date(Date.now() - DEDUP_WINDOW_MS).toISOString()
      let duplicateReference: string | null = null
      try {
        duplicateReference = await store.findRecentDuplicate(normalizedEmail, since)
      } catch (error) {
        console.error('LEAD DEDUP LOOKUP FAILED (continuing):', error, { referenceNumber })
      }

      if (duplicateReference) {
        console.log('Duplicate lead submission ignored:', { email: normalizedEmail })
        return NextResponse.json({
          success: true,
          referenceNumber: duplicateReference,
          message: 'Lead already received',
        })
      }

      // The Supabase insert went through JSON, which stored a non-numeric age
      // as null and an array (the PPO funnel's `priorities`) as JSON text. The
      // Postgres driver does neither: NaN fails the integer column and an array
      // becomes a Postgres array literal. Normalize so stored values match.
      const parsedAge = age ? parseInt(age, 10) : null
      const storedAge = Number.isNaN(parsedAge) ? null : parsedAge
      const storedPriorities = Array.isArray(priorities)
        ? JSON.stringify(priorities)
        : priorities || null

      try {
        const insertResult = await store.createLead({
          referenceNumber,
          firstName,
          lastName,
          email: normalizedEmail,
          phone: phone || null,
          age: storedAge,
          state: state || null,
          incomeRange: incomeRange || null,
          householdSize: householdSize || null,
          qualifyingEvent: qualifyingEvent || null,
          priorities: storedPriorities,
          tcpaConsent,
          tcpaConsentAt,
          trustedFormCertUrl: trustedFormCertUrl || null,
          funnelType: resolvedFunnelType,
          utmSource: utmSource || null,
          utmMedium: utmMedium || null,
          utmCampaign: utmCampaign || null,
          ipAddress,
          quizAnswers: quizAnswers ?? null,
        })
        if (insertResult) {
          data = { id: insertResult.id, created_at: insertResult.createdAt }
        }
      } catch (error) {
        // Loud, not silent: the lead form must not break, but a failed insert
        // is an operational problem, not a routine fallback.
        console.error('LEAD INSERT FAILED (continuing with notifications):', error, { referenceNumber })
      }
    }

    // ── Post-response pipeline ──────────────────────────────────────────────
    // after() runs once the response is sent but keeps the function alive for
    // the work, so on Vercel these integrations actually complete.
    after(async () => {
      // 1. Claim the TrustedForm certificate (TCPA compliance evidence).
      if (trustedFormCertUrl) {
        try {
          await fetch(`${request.nextUrl.origin}/api/trustedform/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              certificateUrl: trustedFormCertUrl,
              leadId: data.id,
              email: normalizedEmail,
              phone,
            }),
          })
        } catch (err) {
          console.error('TrustedForm claim error:', err)
        }
      }

      // 2. Confirmation email to the consumer.
      try {
        await sendLeadConfirmation({ referenceNumber, firstName, email: normalizedEmail, phone })
      } catch (err) {
        console.error('Lead confirmation email error:', err)
      }

      // 3. Post the lead to the USHA Marketplace, then notify the admin with
      //    the result (the admin email surfaces a 'failed' marketplace post).
      let ushaResult
      try {
        ushaResult = await postLeadToUsha(data.id, {
          firstName,
          lastName,
          email: normalizedEmail,
          phone: phone || null,
          age: age ? parseInt(age, 10) : null,
          state: state || null,
          incomeRange: incomeRange || null,
          householdSize: householdSize || null,
          qualifyingEvent: qualifyingEvent || null,
          tcpaConsent,
          tcpaConsentAt,
          trustedFormCertUrl: trustedFormCertUrl || null,
          referenceNumber,
          utmSource: utmSource || null,
          utmMedium: utmMedium || null,
          utmCampaign: utmCampaign || null,
          ipAddress,
          leadType: resolvedFunnelType,
        })
      } catch (err) {
        console.error('USHA post error:', err)
      }

      try {
        await notifyAdmin({
          referenceNumber,
          firstName,
          lastName,
          email: normalizedEmail,
          phone: phone || null,
          age: age ? parseInt(age, 10) : null,
          state: state || null,
          funnelType: resolvedFunnelType,
          incomeRange: incomeRange || null,
          householdSize: householdSize || null,
          qualifyingEvent: qualifyingEvent || null,
          priorities: priorities || null,
          utmSource: utmSource || null,
          utmMedium: utmMedium || null,
          utmCampaign: utmCampaign || null,
          ipAddress,
          tcpaConsentAt,
          trustedFormCertUrl: trustedFormCertUrl || null,
          ushaResult,
        })
      } catch (err) {
        console.error('Admin notification email error:', err)
      }

      // 4. Score the lead with AI (updates the lead in the database).
      try {
        await scoreAndUpdateLead({
          id: data.id,
          referenceNumber,
          firstName,
          lastName,
          email: normalizedEmail,
          phone,
          age,
          state,
          householdSize,
          incomeRange,
          qualifyingEvent,
          priorities,
          created_at: data.created_at,
        })
      } catch (err) {
        console.error('AI scoring error:', err)
      }
    })

    return NextResponse.json({
      success: true,
      referenceNumber,
      message: 'Lead submitted successfully',
    })
  } catch (error) {
    console.error('Error processing lead submission:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

The USHA and admin-email payloads deliberately keep main's raw `age` and `priorities` handling, so those outputs match main too. The TrustedForm body is main's (its field-name bug is fixed by the separate task).

- [ ] **Step 5: Run the intake tests to confirm they pass**

```bash
pnpm vitest run app/api/leads
```

Expected: all PASS (10 parity, 8 route).

- [ ] **Step 6: Positive controls (must FAIL, then restore)**

1. Delete the `storedPriorities` normalization (pass `priorities: priorities || null`), run: the PPO parity case must FAIL. Restore.
2. Move the `findRecentDuplicate` call outside its try/catch, run: "still returns 200 when the duplicate lookup fails" must FAIL. Restore.

- [ ] **Step 7: Unsubscribe test first**

Create `app/api/unsubscribe/route.test.ts`:

```ts
// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from "vitest"

const h = vi.hoisted(() => ({
  configured: true,
  recordSuppression: vi.fn(),
}))

vi.mock("@/lib/data/store", () => ({
  getPlatformStore: async () => ({
    isConfigured: () => h.configured,
    recordSuppression: h.recordSuppression,
  }),
}))

import { GET, POST } from "@/app/api/unsubscribe/route"
import { NextRequest } from "next/server"

const BASE = "https://www.dynastyinsurancenetwork.com/api/unsubscribe"

describe("/api/unsubscribe", () => {
  beforeEach(() => {
    h.configured = true
    h.recordSuppression.mockReset().mockResolvedValue(undefined)
  })

  it("GET records a link-click suppression with the normalized email", async () => {
    const res = await GET(new NextRequest(`${BASE}?email=${encodeURIComponent(" Foo.Bar@Example.COM ")}`))
    expect(res.status).toBe(200)
    expect(res.headers.get("content-type")).toContain("text/html")
    expect(h.recordSuppression).toHaveBeenCalledTimes(1)
    expect(h.recordSuppression).toHaveBeenCalledWith("foo.bar@example.com", "link-click")
  })

  it("GET shows a normal address unchanged on the confirmation page", async () => {
    const res = await GET(new NextRequest(`${BASE}?email=${encodeURIComponent("jane@example.com")}`))
    expect(await res.text()).toContain("the address jane@example.com has been removed")
  })

  it("GET escapes markup in the email parameter", async () => {
    const res = await GET(new NextRequest(`${BASE}?email=${encodeURIComponent("<script>alert(1)</script>")}`))
    const html = await res.text()
    expect(html).not.toContain("<script>alert(1)</script>")
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;")
  })

  it("POST (RFC 8058 one-click) records a one-click suppression from the query string", async () => {
    const res = await POST(
      new NextRequest(`${BASE}?email=${encodeURIComponent("Inbox@Example.com")}`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: "List-Unsubscribe=One-Click",
      }),
    )
    expect(res.status).toBe(200)
    expect(await res.text()).toBe("")
    expect(h.recordSuppression).toHaveBeenCalledWith("inbox@example.com", "one-click")
  })

  it("POST falls back to an email in the form body", async () => {
    const res = await POST(new NextRequest(BASE, { method: "POST", body: new URLSearchParams({ email: "Form@Example.com" }) }))
    expect(res.status).toBe(200)
    expect(h.recordSuppression).toHaveBeenCalledWith("form@example.com", "one-click")
  })

  it("writes nothing and still answers 200 when no email is given", async () => {
    const res = await GET(new NextRequest(BASE))
    expect(res.status).toBe(200)
    expect(h.recordSuppression).not.toHaveBeenCalled()
  })

  it("writes nothing and still answers 200 when the database is not configured", async () => {
    h.configured = false
    const res = await GET(new NextRequest(`${BASE}?email=a@b.com`))
    expect(res.status).toBe(200)
    expect(h.recordSuppression).not.toHaveBeenCalled()
  })

  it("still answers 200 when the suppression write fails", async () => {
    h.recordSuppression.mockRejectedValue(new Error("neon down"))
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const res = await GET(new NextRequest(`${BASE}?email=a@b.com`))
    expect(res.status).toBe(200)
    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })
})
```

Run `pnpm vitest run app/api/unsubscribe`. Expected: FAIL (route still uses Supabase; escaping missing).

- [ ] **Step 8: Unsubscribe on Neon, with escaping**

In `app/api/unsubscribe/route.ts`, replace `import { createClient } from '@/lib/supabase/admin'` with `import { getPlatformStore } from '@/lib/data/store'`.

Replace `// Both paths attempt to write to an \`email_suppressions\` row. If Supabase is` with `// Both paths attempt to write to an \`email_suppressions\` row. If the database is`.

Replace:

```ts
    const supabase = createClient()
    if (!supabase) return
    await supabase
      .from('email_suppressions')
      .upsert(
        {
          email: lower,
          source,
          suppressed_at: new Date().toISOString(),
        },
        { onConflict: 'email' },
      )
```

with:

```ts
    const store = await getPlatformStore()
    if (!store.isConfigured()) return
    await store.recordSuppression(lower, source)
```

Replace:

```ts
async function recordSuppression(email: string, source: string) {
```

with:

```ts
const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

// The email query value is attacker-controlled; never write it into HTML raw.
function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch])
}

async function recordSuppression(email: string, source: string) {
```

Replace:

```ts
  const display = email
    ? `the address ${email}`
    : 'your address'
```

with:

```ts
  const display = email
    ? `the address ${escapeHtml(email)}`
    : 'your address'
```

Run `pnpm vitest run app/api/unsubscribe`. Expected: all 8 PASS.

- [ ] **Step 9: AI scoring writes to Neon**

In `lib/ai/scoreLeadWithAI.ts`, replace `import { createClient } from '@/lib/supabase/admin'` with `import { getPlatformStore } from '@/lib/data/store'`.

Replace:

```ts
  const supabase = createClient()
  if (!supabase) {
    console.error('scoreAndUpdateLead: Supabase admin client not configured')
    return
  }
```

with:

```ts
  const store = await getPlatformStore()
  if (!store.isConfigured()) {
    console.error('scoreAndUpdateLead: platform database not configured')
    return
  }
```

Replace:

```ts
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          ai_score: scoreResult.score,
          ai_score_reasons: scoreResult.reasons,
          predicted_close_rate: scoreResult.predictedCloseRate,
          ai_scored_at: new Date().toISOString(),
        })
        .eq('id', lead.id)

      if (updateError) {
        console.error('Error updating lead with AI score:', updateError)
        return
      }

```

with:

```ts
      await store.updateAiScore(lead.id, {
        score: scoreResult.score,
        reasons: scoreResult.reasons,
        predictedCloseRate: scoreResult.predictedCloseRate,
        scoredAt: new Date().toISOString(),
      })

```

Keep main's model ID unchanged (a model change is out of scope). A failed update now throws into the function's existing outer catch and logs `Error in scoreAndUpdateLead:`; same outcome, different log text.

- [ ] **Step 10: USHA status writes to Neon**

```bash
git show origin/redesign/union-private-healthcare:lib/usha/postLead.ts > lib/usha/postLead.ts
```

(The redesign diff is only the store swap and comments; `usha_sent_at` is stamped for sent and failed, `usha_lead_id` only when present, as on main.)

- [ ] **Step 11: Comment-only edits**

In `lib/types/lead.ts`, replace:

```ts
// Canonical Lead type matching the Supabase `leads` table.
// usha_status / usha_sent_at / usha_lead_id require these columns to exist in Supabase:
//   ALTER TABLE leads ADD COLUMN usha_status text;
//   ALTER TABLE leads ADD COLUMN usha_sent_at timestamptz;
//   ALTER TABLE leads ADD COLUMN usha_lead_id text;
```

with:

```ts
// Canonical Lead type for a row of the `leads` table (Drizzle schema in
// lib/db/schema/app.ts; rows are mapped by lib/data/lead-mapper.ts).
```

In `lib/time/ranges.ts`, replace:

```ts
 * dashboard are computed in this zone, then converted to UTC for Supabase
 * filters — otherwise counts bucket on the server's UTC day, which is wrong
 * for an operator on the US East Coast.
 *
 * The SQL RPCs in supabase/migrations/*_dashboard_rpcs.sql bucket in this
 * same zone. Keep the two in sync.
```

with:

```ts
 * dashboard are computed in this zone, then converted to UTC for database
 * filters, otherwise counts bucket on the server's UTC day, which is wrong
 * for an operator on the US East Coast.
 *
 * The aggregate SQL in lib/data/neon-store.ts buckets in this same zone.
 * Keep the two in sync.
```

- [ ] **Step 12: Delete the Supabase service client**

```bash
git rm lib/supabase/admin.ts
grep -rn "supabase/admin" app lib components || echo "no importers left"
```

Expected: `no importers left`.

- [ ] **Step 13: Mechanical checks and commit**

```bash
pnpm exec tsc --noEmit && pnpm test && pnpm lint && pnpm check:guards && pnpm build
git add app/api/leads app/api/unsubscribe lib/ai/scoreLeadWithAI.ts lib/usha/postLead.ts lib/types/lead.ts lib/time/ranges.ts
git commit -m "feat(leads): intake, unsubscribe, scoring and USHA status on Neon with TCPA parity; escape unsubscribe page"
```
