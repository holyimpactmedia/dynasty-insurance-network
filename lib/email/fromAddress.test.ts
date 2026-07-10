import { describe, expect, it } from "vitest"
import { formatFromAddress } from "./fromAddress"

describe("formatFromAddress", () => {
  it("wraps a bare sender email", () => {
    expect(formatFromAddress("sender@example.com", "Dynasty", "fallback@example.com"))
      .toBe("Dynasty <sender@example.com>")
  })

  it("preserves an already formatted sender", () => {
    expect(formatFromAddress("Holy Impact <sender@example.com>", "Dynasty", "fallback@example.com"))
      .toBe("Holy Impact <sender@example.com>")
  })

  it("uses the fallback when unset", () => {
    expect(formatFromAddress(undefined, "Dynasty", "fallback@example.com"))
      .toBe("Dynasty <fallback@example.com>")
  })
})
