import { describe, it, expect } from "vitest"
import { splitShares } from "@/lib/finance/splitShares"

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0)

describe("splitShares", () => {
  it("splits an even total evenly", () => {
    expect(splitShares(100, [1, 1, 1, 1])).toEqual([25, 25, 25, 25])
  })

  it("rows always sum to the rounded total (the D3 bug)", () => {
    expect(sum(splitShares(18, [1, 1, 1, 1]))).toBe(18)
    expect(sum(splitShares(101, [1, 1, 1, 1]))).toBe(101)
    expect(sum(splitShares(99.99, [1, 1, 1, 1]))).toBe(100)
    expect(sum(splitShares(1, [1, 1, 1, 1]))).toBe(1)
  })

  it("respects unequal weights", () => {
    const r = splitShares(100, [3, 1])
    expect(sum(r)).toBe(100)
    expect(r[0]).toBeGreaterThan(r[1])
  })

  it("handles a zero total", () => {
    expect(splitShares(0, [1, 1, 1, 1])).toEqual([0, 0, 0, 0])
  })

  it("handles zero weights without dividing by zero", () => {
    expect(splitShares(100, [0, 0])).toEqual([0, 0])
  })
})
