import { describe, it, expect } from "vitest"
import { cobraConfig } from "./cobra.config"

// G3 — payload parity. buildPayload is a verbatim copy of the original cobra
// page's /api/leads body; this locks its exact shape so a refactor can't
// silently drop or rename a field the API destructures.
describe("cobra buildPayload", () => {
  const answers = {
    cobraTimeline: "just-received",
    cobraCost: "$400 - $700/month",
    coverageNeeded: "Just me",
    healthConsiderations: "I take regular medications",
    state: "Texas",
    age: "42",
    govCoverage: "No",
    phone: "5551234567",
    email: "jane@example.com",
    tcpaConsent: true,
    firstName: "Jane",
    lastName: "Smith",
  }
  const meta = {
    trustedFormCertUrl: "https://cert.trustedform.com/abc",
    utm: { source: "google", medium: "cpc", campaign: "cobra-q3" },
  }

  it("produces the exact POST body the original page sent", () => {
    expect(cobraConfig.buildPayload(answers, meta)).toEqual({
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@example.com",
      phone: "5551234567",
      age: "42",
      state: "Texas",
      tcpaConsent: true,
      trustedFormCertUrl: "https://cert.trustedform.com/abc",
      funnelType: "cobra",
      quizAnswers: {
        cobraTimeline: "just-received",
        cobraCost: "$400 - $700/month",
        coverageNeeded: "Just me",
        healthConsiderations: "I take regular medications",
        govCoverage: "No",
      },
      utmSource: "google",
      utmMedium: "cpc",
      utmCampaign: "cobra-q3",
    })
  })

  it("sends funnelType 'cobra' and passes null cert/utm through unchanged", () => {
    const body = cobraConfig.buildPayload(
      {},
      { trustedFormCertUrl: null, utm: { source: null, medium: null, campaign: null } },
    ) as Record<string, unknown>
    expect(body.funnelType).toBe("cobra")
    expect(body.trustedFormCertUrl).toBeNull()
    expect(body.utmSource).toBeNull()
  })
})
