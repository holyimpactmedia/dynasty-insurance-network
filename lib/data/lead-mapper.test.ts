// @vitest-environment node
import { describe, it, expect } from "vitest"
import { neonRowToLead, toIsoTimestamp } from "@/lib/data/lead-mapper"
import type { LeadRow } from "@/lib/db/schema"

describe("toIsoTimestamp", () => {
  it("converts Postgres timestamptz text in UTC to ISO 8601", () => {
    expect(toIsoTimestamp("2026-10-06 15:04:05.123456+00")).toBe("2026-10-06T15:04:05.123Z")
  })

  it("converts a non-UTC offset to the same instant in UTC", () => {
    expect(toIsoTimestamp("2026-10-06 11:04:05.5-04")).toBe("2026-10-06T15:04:05.500Z")
  })

  it("passes null through", () => {
    expect(toIsoTimestamp(null)).toBeNull()
  })

  it("returns an unparseable value unchanged and never throws", () => {
    expect(toIsoTimestamp("not a date")).toBe("not a date")
  })
})

describe("neonRowToLead", () => {
  it("normalizes the four timestamp fields to ISO and keeps null as null", () => {
    const row = {
      id: "00000000-0000-4000-8000-000000000001",
      referenceNumber: "HL-TEST-0001",
      firstName: "Test",
      lastName: "Parity",
      email: "test.parity@example.com",
      phone: null,
      age: null,
      state: null,
      incomeRange: null,
      householdSize: null,
      qualifyingEvent: null,
      priorities: null,
      tcpaConsent: true,
      tcpaConsentAt: "2026-10-06 15:04:05.123456+00",
      trustedFormCertUrl: null,
      funnelType: "private_health",
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      ipAddress: null,
      quizAnswers: null,
      status: "new",
      aiScore: null,
      aiScoreReasons: null,
      predictedCloseRate: null,
      aiScoredAt: null,
      sellPrice: 28,
      ushaStatus: "sent",
      ushaSentAt: "2026-10-06 11:04:05.5-04",
      ushaLeadId: null,
      createdAt: "2026-10-06 15:04:05.9+00",
    } as LeadRow

    const lead = neonRowToLead(row)

    expect(lead.tcpa_consent_at).toBe("2026-10-06T15:04:05.123Z")
    expect(lead.ai_scored_at).toBeNull()
    expect(lead.usha_sent_at).toBe("2026-10-06T15:04:05.500Z")
    expect(lead.created_at).toBe("2026-10-06T15:04:05.900Z")
  })
})
