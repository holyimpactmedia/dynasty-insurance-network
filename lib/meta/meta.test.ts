import { describe, it, expect, vi, afterEach } from "vitest"
import { hashEmail, hashPhone, hashName, hashZip, hashCountry } from "./hash"
import { sendMetaLeadEvent } from "./capi"

describe("meta PII hashing", () => {
  it("normalizes email (lowercase + trim) before hashing", () => {
    expect(hashEmail("  Jane@Example.com ")).toBe(hashEmail("jane@example.com"))
    expect(hashEmail("jane@example.com")).toMatch(/^[a-f0-9]{64}$/)
  })

  it("reduces phone to digits and adds US country code for a 10-digit number", () => {
    expect(hashPhone("(555) 123-4567")).toBe(hashPhone("15551234567"))
    expect(hashPhone("555.123.4567")).toBe(hashPhone("15551234567"))
  })

  it("hashes zip on its first 5 characters", () => {
    expect(hashZip("30301-1234")).toBe(hashZip("30301"))
  })

  it("normalizes country to 2-letter lowercase", () => {
    expect(hashCountry("US")).toBe(hashCountry("us"))
  })

  it("returns undefined for empty / missing inputs (never hashes nothing)", () => {
    expect(hashEmail("")).toBeUndefined()
    expect(hashPhone(null)).toBeUndefined()
    expect(hashName(undefined)).toBeUndefined()
    expect(hashZip("")).toBeUndefined()
  })
})

describe("meta CAPI send", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("no-ops without calling Meta when CAPI is unconfigured", async () => {
    // No NEXT_PUBLIC_META_PIXEL_ID / token in the test env, so it must not fetch.
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
    await sendMetaLeadEvent({ eventId: "e1", email: "jane@example.com" })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
