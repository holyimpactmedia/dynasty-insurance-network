import { describe, it, expect } from "vitest"
import { startOfTodayUtc, startOfMonthUtc } from "@/lib/time/ranges"

describe("startOfTodayUtc", () => {
  it("returns the previous UTC day's 04:00/05:00 for an early-morning ET instant", () => {
    // 2026-07-15 02:00 UTC is still 2026-07-14 in New York (EDT, UTC-4).
    // Start of that NY day = 2026-07-14 04:00 UTC.
    expect(startOfTodayUtc(new Date("2026-07-15T02:00:00Z"))).toBe(
      "2026-07-14T04:00:00.000Z",
    )
  })

  it("handles standard time (EST, UTC-5)", () => {
    // 2026-01-15 12:00 UTC is 2026-01-15 in New York (EST).
    // Start of that NY day = 2026-01-15 05:00 UTC.
    expect(startOfTodayUtc(new Date("2026-01-15T12:00:00Z"))).toBe(
      "2026-01-15T05:00:00.000Z",
    )
  })
})

describe("startOfMonthUtc", () => {
  it("returns the month start in ET as a UTC instant", () => {
    // Mid-July 2026 -> start of July in NY (EDT) = 2026-07-01 04:00 UTC.
    expect(startOfMonthUtc(new Date("2026-07-15T12:00:00Z"))).toBe(
      "2026-07-01T04:00:00.000Z",
    )
  })
})
