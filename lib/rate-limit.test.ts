import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { checkRateLimit, __resetRateLimit } from "@/lib/rate-limit"

describe("checkRateLimit", () => {
  beforeEach(() => {
    __resetRateLimit()
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("allows up to max requests then blocks", () => {
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit("ip-a", { max: 3 }).allowed).toBe(true)
    }
    expect(checkRateLimit("ip-a", { max: 3 }).allowed).toBe(false)
  })

  it("tracks keys independently", () => {
    checkRateLimit("ip-a", { max: 1 })
    expect(checkRateLimit("ip-a", { max: 1 }).allowed).toBe(false)
    expect(checkRateLimit("ip-b", { max: 1 }).allowed).toBe(true)
  })

  it("resets after the window elapses", () => {
    expect(checkRateLimit("ip-c", { max: 1, windowMs: 1000 }).allowed).toBe(true)
    expect(checkRateLimit("ip-c", { max: 1, windowMs: 1000 }).allowed).toBe(false)
    vi.advanceTimersByTime(1001)
    expect(checkRateLimit("ip-c", { max: 1, windowMs: 1000 }).allowed).toBe(true)
  })

  it("reports remaining count", () => {
    expect(checkRateLimit("ip-d", { max: 5 }).remaining).toBe(4)
    expect(checkRateLimit("ip-d", { max: 5 }).remaining).toBe(3)
  })
})
