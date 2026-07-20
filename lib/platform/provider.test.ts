import { afterEach, describe, expect, it } from "vitest"
import { isPlatformConfigured } from "./provider"

const saved = {
  db: process.env.DATABASE_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  authUrl: process.env.BETTER_AUTH_URL,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
}

afterEach(() => {
  for (const [key, value] of Object.entries({
    DATABASE_URL: saved.db,
    BETTER_AUTH_SECRET: saved.secret,
    BETTER_AUTH_URL: saved.authUrl,
    NEXT_PUBLIC_SITE_URL: saved.siteUrl,
  })) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
})

describe("isPlatformConfigured (Neon)", () => {
  it("is true when the Neon + Better Auth vars are present", () => {
    process.env.DATABASE_URL = "postgresql://x"
    process.env.BETTER_AUTH_SECRET = "s".repeat(32)
    process.env.BETTER_AUTH_URL = "https://example.com"
    expect(isPlatformConfigured()).toBe(true)
  })

  it("is false when DATABASE_URL is missing", () => {
    delete process.env.DATABASE_URL
    process.env.BETTER_AUTH_SECRET = "s".repeat(32)
    process.env.BETTER_AUTH_URL = "https://example.com"
    expect(isPlatformConfigured()).toBe(false)
  })

  it("accepts NEXT_PUBLIC_SITE_URL in place of BETTER_AUTH_URL", () => {
    process.env.DATABASE_URL = "postgresql://x"
    process.env.BETTER_AUTH_SECRET = "s".repeat(32)
    delete process.env.BETTER_AUTH_URL
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com"
    expect(isPlatformConfigured()).toBe(true)
  })
})
