// @vitest-environment node
import { readFileSync } from "node:fs"
import { describe, it, expect, afterEach, vi } from "vitest"
import { claimTrustedFormCertificate, TRUSTEDFORM_SCAN_TERMS } from "@/lib/trustedform/claim"

const FUNNELS = ["individual", "family", "cobra", "ppo", "self-employed"]
const CERT_ID = "0123456789abcdef0123456789abcdef01234567"
const CERT = `https://cert.trustedform.com/${CERT_ID}`
const KEY = "tf_test_key"
const INPUT = { certUrl: CERT, reference: "HL-1", email: "a@b.com", phone: "5550100" }

function jsonResponse(body: unknown, status = 201) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } })
}

function stubFetch(response: Response | Error) {
  const fetchMock = vi.fn()
  if (response instanceof Error) fetchMock.mockRejectedValue(response)
  else fetchMock.mockResolvedValue(response)
  vi.stubGlobal("fetch", fetchMock)
  return fetchMock
}

describe("claimTrustedFormCertificate", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("asks TrustedForm to scan for phrases every live funnel's consent text contains", () => {
    expect(TRUSTEDFORM_SCAN_TERMS.length).toBeGreaterThan(0)
    for (const funnel of FUNNELS) {
      const page = readFileSync(`app/${funnel}/page.tsx`, "utf8").replace(/\s+/g, " ")
      for (const term of TRUSTEDFORM_SCAN_TERMS) {
        expect(page, `${funnel} consent text must contain "${term}"`).toContain(term)
      }
    }
  })

  it("claims the certificate with Dynasty's key and returns the scan result", async () => {
    const fetchMock = stubFetch(
      jsonResponse({
        outcome: "success",
        warnings: [],
        scans: { required_found: [...TRUSTEDFORM_SCAN_TERMS], required_not_found: [] },
      }),
    )
    const result = await claimTrustedFormCertificate(INPUT, { TRUSTEDFORM_API_KEY: KEY })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(`https://cert.trustedform.com/${CERT_ID}`)
    expect(init.method).toBe("POST")
    expect(init.headers.Authorization).toBe(`Basic ${Buffer.from(`API:${KEY}`).toString("base64")}`)
    expect(JSON.parse(init.body)).toEqual({
      reference: "HL-1",
      email: "a@b.com",
      phone: "5550100",
      required_scan_terms: [...TRUSTEDFORM_SCAN_TERMS],
    })
    expect(init.signal).toBeInstanceOf(AbortSignal)

    expect(result).toEqual({
      status: "claimed",
      outcome: "success",
      warnings: [],
      requiredFound: [...TRUSTEDFORM_SCAN_TERMS],
      requiredNotFound: [],
    })
  })

  it("fails without calling TrustedForm when the API key is not set", async () => {
    const fetchMock = stubFetch(jsonResponse({}))
    const result = await claimTrustedFormCertificate(INPUT, {})
    expect(result).toEqual({ status: "failed", reason: "TRUSTEDFORM_API_KEY is not set" })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("fails without calling TrustedForm when the certificate URL has no usable id", async () => {
    const fetchMock = stubFetch(jsonResponse({}))
    for (const certUrl of ["https://cert.trustedform.com/", "https://cert.trustedform.com/..", "https://cert.trustedform.com/abc-def", ""]) {
      const result = await claimTrustedFormCertificate({ ...INPUT, certUrl }, { TRUSTEDFORM_API_KEY: KEY })
      expect(result.status).toBe("failed")
    }
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("reports an HTTP error status as a failed claim", async () => {
    stubFetch(new Response("not found", { status: 404 }))
    const result = await claimTrustedFormCertificate(INPUT, { TRUSTEDFORM_API_KEY: KEY })
    expect(result).toEqual({ status: "failed", reason: "HTTP 404" })
  })

  it("reports a timeout as a failed claim and never throws", async () => {
    stubFetch(new DOMException("The operation was aborted due to timeout", "TimeoutError"))
    const result = await claimTrustedFormCertificate(INPUT, { TRUSTEDFORM_API_KEY: KEY })
    expect(result.status).toBe("failed")
    expect(result.status === "failed" && result.reason).toMatch(/timed out/i)
  })

  it("never throws on a network error", async () => {
    stubFetch(new TypeError("fetch failed"))
    const result = await claimTrustedFormCertificate(INPUT, { TRUSTEDFORM_API_KEY: KEY })
    expect(result).toEqual({ status: "failed", reason: "TypeError: request failed" })
  })

  it("keeps a claimed certificate whose scan failed, and reports the missing phrase", async () => {
    stubFetch(
      jsonResponse({
        outcome: "failure",
        warnings: [],
        scans: { required_found: [TRUSTEDFORM_SCAN_TERMS[0]], required_not_found: ["Reply STOP to opt out of SMS"] },
      }),
    )
    const result = await claimTrustedFormCertificate(INPUT, { TRUSTEDFORM_API_KEY: KEY })
    expect(result).toEqual({
      status: "claimed",
      outcome: "failure",
      warnings: [],
      requiredFound: [TRUSTEDFORM_SCAN_TERMS[0]],
      requiredNotFound: ["Reply STOP to opt out of SMS"],
    })
  })

  it("redacts email addresses and phone numbers from TrustedForm's warnings", async () => {
    stubFetch(
      jsonResponse({
        outcome: "success",
        warnings: [
          "email does not match: jane.doe@example.com",
          "phone 5551234567 not found",
          "string not found in snapshot",
        ],
      }),
    )
    const result = await claimTrustedFormCertificate(INPUT, { TRUSTEDFORM_API_KEY: KEY })
    expect(result.status).toBe("claimed")
    const warnings = result.status === "claimed" ? result.warnings : []
    expect(warnings).toEqual([
      "email does not match: [redacted email]",
      "phone [redacted number] not found",
      "string not found in snapshot",
    ])
    const joined = warnings.join(" ")
    expect(joined).not.toContain("jane.doe@example.com")
    expect(joined).not.toContain("5551234567")
  })
})
