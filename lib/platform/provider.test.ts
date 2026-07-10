import { afterEach, describe, expect, it } from "vitest"
import { getPlatformProvider } from "./provider"

const original = process.env.PLATFORM_PROVIDER

afterEach(() => {
  if (original === undefined) delete process.env.PLATFORM_PROVIDER
  else process.env.PLATFORM_PROVIDER = original
})

describe("getPlatformProvider", () => {
  it("defaults safely to Supabase", () => {
    delete process.env.PLATFORM_PROVIDER
    expect(getPlatformProvider()).toBe("supabase")
  })

  it("selects Neon only when explicit", () => {
    process.env.PLATFORM_PROVIDER = "neon"
    expect(getPlatformProvider()).toBe("neon")
  })
})
