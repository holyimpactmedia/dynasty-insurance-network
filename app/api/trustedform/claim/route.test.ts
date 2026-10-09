// @vitest-environment node
import { readFileSync } from "node:fs"
import { describe, it, expect, afterEach, vi } from "vitest"
import { NextRequest } from "next/server"

const FUNNELS = ["individual", "family", "cobra", "ppo", "self-employed"]
const CERT = "https://cert.trustedform.com/0123456789abcdef0123456789abcdef01234567"

describe("POST /api/trustedform/claim", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it("asks TrustedForm to scan for phrases every live funnel's consent text contains", async () => {
    vi.stubEnv("TRUSTEDFORM_API_KEY", "tf_test_key")
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)
    const { POST } = await import("@/app/api/trustedform/claim/route")
    const res = await POST(
      new NextRequest("http://localhost/api/trustedform/claim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ certUrl: CERT, reference: "HL-1", email: "a@b.com" }),
      }),
    )
    // The claim route answers 201 on a successful claim (unchanged behavior).
    expect(res.status).toBe(201)
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(sent.reference).toBe("HL-1")
    expect(sent.required_scan_terms.length).toBeGreaterThan(0)
    for (const funnel of FUNNELS) {
      const page = readFileSync(`app/${funnel}/page.tsx`, "utf8").replace(/\s+/g, " ")
      for (const term of sent.required_scan_terms) {
        expect(page, `${funnel} consent text must contain "${term}"`).toContain(term)
      }
    }
  })
})
