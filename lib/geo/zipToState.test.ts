import { describe, it, expect } from "vitest"
import { zipToStateName, zipToStateCode } from "./zipToState"

describe("zipToState", () => {
  it("maps representative ZIPs to the right state", () => {
    expect(zipToStateName("30301")).toBe("Georgia") // Atlanta
    expect(zipToStateName("10001")).toBe("New York") // NYC
    expect(zipToStateName("75201")).toBe("Texas") // Dallas
    expect(zipToStateName("90001")).toBe("California") // LA
    expect(zipToStateName("02108")).toBe("Massachusetts") // Boston
    expect(zipToStateName("33101")).toBe("Florida") // Miami
    expect(zipToStateName("60601")).toBe("Illinois") // Chicago
    expect(zipToStateName("98101")).toBe("Washington") // Seattle
  })

  it("resolves embedded/anomalous prefixes over their container range", () => {
    expect(zipToStateName("19701")).toBe("Delaware") // 197 sits inside PA 150-199
    expect(zipToStateCode("00601")).toBe("PR") // 006-009 territory range
  })

  it("returns null for missing or too-short input", () => {
    expect(zipToStateName("")).toBeNull()
    expect(zipToStateName("12")).toBeNull()
    expect(zipToStateName("abc")).toBeNull()
    expect(zipToStateCode("99")).toBeNull()
  })

  it("ignores non-digits and reads the 3-digit prefix", () => {
    expect(zipToStateName("75201-1234")).toBe("Texas")
  })
})
