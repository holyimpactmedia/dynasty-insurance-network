// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { getTableColumns, getTableName } from "drizzle-orm"

const h = vi.hoisted(() => {
  const calls = {
    table: undefined as unknown,
    values: undefined as Record<string, unknown> | undefined,
    conflict: undefined as { target: unknown; set: Record<string, unknown> } | undefined,
  }
  const db = {
    insert(table: unknown) {
      calls.table = table
      return {
        values(values: Record<string, unknown>) {
          calls.values = values
          return {
            returning: async () => [
              { id: "00000000-0000-4000-8000-000000000001", createdAt: "2026-10-06 15:04:05.9+00" },
            ],
            onConflictDoUpdate: async (conflict: { target: unknown; set: Record<string, unknown> }) => {
              calls.conflict = conflict
            },
          }
        },
      }
    },
  }
  return { calls, db }
})

vi.mock("@/lib/db/client", () => ({
  getNeonDb: () => h.db,
  requireNeonDb: () => h.db,
}))

import { neonStore } from "@/lib/data/neon-store"
import { emailSuppressions, leads } from "@/lib/db/schema"
import type { LeadCreateInput } from "@/lib/data/types"

const FIXED_NOW = "2026-10-06T15:04:05.678Z"
const CERT_URL = "https://cert.trustedform.com/0123456789abcdef0123456789abcdef01234567"

const input: LeadCreateInput = {
  referenceNumber: "HL-TEST-0001",
  firstName: "Test",
  lastName: "Parity",
  email: "test.parity@example.com",
  phone: "(555) 010-0199",
  age: 42,
  state: "Florida",
  incomeRange: "$65,000 to $90,000",
  householdSize: "Me + spouse",
  qualifyingEvent: "Lost job coverage",
  priorities: '["nationwide"]',
  tcpaConsent: true,
  tcpaConsentAt: FIXED_NOW,
  trustedFormCertUrl: CERT_URL,
  funnelType: "private_health",
  utmSource: "facebook",
  utmMedium: "paid_social",
  utmCampaign: "dynasty_individual_q4",
  ipAddress: "203.0.113.7",
  quizAnswers: { healthScreen: "No", govCoverage: "No" },
}

// Exactly the object main's app/api/leads/route.ts passed to
// supabase.from('leads').insert(...) for the same lead (snake_case columns).
const MAIN_ROW = {
  reference_number: "HL-TEST-0001",
  first_name: "Test",
  last_name: "Parity",
  email: "test.parity@example.com",
  phone: "(555) 010-0199",
  age: 42,
  state: "Florida",
  income_range: "$65,000 to $90,000",
  household_size: "Me + spouse",
  qualifying_event: "Lost job coverage",
  priorities: '["nationwide"]',
  tcpa_consent: true,
  tcpa_consent_at: FIXED_NOW,
  trusted_form_cert_url: CERT_URL,
  funnel_type: "private_health",
  utm_source: "facebook",
  utm_medium: "paid_social",
  utm_campaign: "dynasty_individual_q4",
  ip_address: "203.0.113.7",
  quiz_answers: { healthScreen: "No", govCoverage: "No" },
  status: "new",
}

function toColumnRow(values: Record<string, unknown>) {
  const columns = getTableColumns(leads) as Record<string, { name: string }>
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => {
      const column = columns[key]
      if (!column) throw new Error(`neon-store wrote unknown property ${key}`)
      return [column.name, value]
    }),
  )
}

describe("neonStore", () => {
  beforeEach(() => {
    h.calls.table = undefined
    h.calls.values = undefined
    h.calls.conflict = undefined
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("createLead writes exactly the columns and values main's Supabase insert wrote", async () => {
    const result = await neonStore.createLead(input)
    expect(h.calls.table).toBe(leads)
    expect(toColumnRow(h.calls.values!)).toStrictEqual(MAIN_ROW)
    expect(result).toEqual({ id: "00000000-0000-4000-8000-000000000001", createdAt: "2026-10-06 15:04:05.9+00" })
  })

  it("recordSuppression upserts into email_suppressions keyed on email, app-clock timestamp", async () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date(FIXED_NOW))
    await neonStore.recordSuppression("foo@example.com", "one-click")
    expect(h.calls.table).toBe(emailSuppressions)
    expect(getTableName(emailSuppressions)).toBe("email_suppressions")
    expect(h.calls.values).toStrictEqual({ email: "foo@example.com", source: "one-click", suppressedAt: FIXED_NOW })
    expect(getTableColumns(emailSuppressions).suppressedAt.name).toBe("suppressed_at")
    expect(h.calls.conflict?.target).toBe(emailSuppressions.email)
    expect(h.calls.conflict?.set).toStrictEqual({ source: "one-click", suppressedAt: FIXED_NOW })
  })
})
