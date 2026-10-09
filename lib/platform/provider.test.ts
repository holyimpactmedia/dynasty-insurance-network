import { afterEach, describe, expect, it } from "vitest"
import {
  DORMANT_DATABASE_URL,
  DORMANT_SECRET,
  isDeployedEnv,
  isPlatformConfigured,
  resolveAuthSecret,
  resolveDatabaseUrl,
} from "./provider"

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

const configured = {
  DATABASE_URL: "postgresql://x",
  BETTER_AUTH_SECRET: "s".repeat(32),
  BETTER_AUTH_URL: "https://example.com",
}

describe("isPlatformConfigured fails closed", () => {
  it("is false when BETTER_AUTH_SECRET is missing", () => {
    expect(isPlatformConfigured({ ...configured, BETTER_AUTH_SECRET: undefined })).toBe(false)
  })

  for (const VERCEL_ENV of ["production", "preview"]) {
    describe(`deployed (${VERCEL_ENV})`, () => {
      it("is configured with real values", () => {
        expect(isPlatformConfigured({ ...configured, VERCEL_ENV })).toBe(true)
      })
      it("is not configured without BETTER_AUTH_SECRET", () => {
        expect(isPlatformConfigured({ ...configured, BETTER_AUTH_SECRET: undefined, VERCEL_ENV })).toBe(false)
      })
      it("is not configured without DATABASE_URL", () => {
        expect(isPlatformConfigured({ ...configured, DATABASE_URL: undefined, VERCEL_ENV })).toBe(false)
      })
      it("is not configured when the secret is the public placeholder", () => {
        expect(isPlatformConfigured({ ...configured, BETTER_AUTH_SECRET: DORMANT_SECRET, VERCEL_ENV })).toBe(false)
      })
      it("is not configured when the database is the public placeholder", () => {
        expect(isPlatformConfigured({ ...configured, DATABASE_URL: DORMANT_DATABASE_URL, VERCEL_ENV })).toBe(false)
      })
    })
  }

  it("is false when neither BETTER_AUTH_URL nor NEXT_PUBLIC_SITE_URL is set", () => {
    expect(isPlatformConfigured({ DATABASE_URL: "postgresql://x", BETTER_AUTH_SECRET: "s".repeat(32) })).toBe(false)
  })
})

describe("auth secret and database never fall back to placeholders when deployed", () => {
  for (const VERCEL_ENV of ["production", "preview"]) {
    describe(`deployed (${VERCEL_ENV})`, () => {
      it("throws instead of using the placeholder secret", () => {
        expect(() => resolveAuthSecret({ VERCEL_ENV })).toThrow(/BETTER_AUTH_SECRET/)
      })
      it("throws when the placeholder secret is set explicitly", () => {
        expect(() => resolveAuthSecret({ VERCEL_ENV, BETTER_AUTH_SECRET: DORMANT_SECRET })).toThrow(/BETTER_AUTH_SECRET/)
      })
      it("throws instead of using the placeholder database", () => {
        expect(() => resolveDatabaseUrl({ VERCEL_ENV })).toThrow(/DATABASE_URL/)
      })
      it("returns the real values when set", () => {
        expect(resolveAuthSecret({ VERCEL_ENV, BETTER_AUTH_SECRET: "real-secret" })).toBe("real-secret")
        expect(resolveDatabaseUrl({ VERCEL_ENV, DATABASE_URL: "postgresql://real" })).toBe("postgresql://real")
      })
      it("lets next build load the module with placeholders", () => {
        const env = { VERCEL_ENV, NEXT_PHASE: "phase-production-build" }
        expect(resolveAuthSecret(env)).toBe(DORMANT_SECRET)
        expect(resolveDatabaseUrl(env)).toBe(DORMANT_DATABASE_URL)
      })
      it("does not exempt other Next phases", () => {
        expect(() => resolveAuthSecret({ VERCEL_ENV, NEXT_PHASE: "phase-production-server" })).toThrow(/BETTER_AUTH_SECRET/)
        expect(() => resolveDatabaseUrl({ VERCEL_ENV, NEXT_PHASE: "phase-production-server" })).toThrow(/DATABASE_URL/)
      })
    })
  }

  it("keeps the placeholders for local dev and tests", () => {
    for (const env of [{}, { VERCEL_ENV: "development" }]) {
      expect(resolveAuthSecret(env)).toBe(DORMANT_SECRET)
      expect(resolveDatabaseUrl(env)).toBe(DORMANT_DATABASE_URL)
    }
  })

  it("treats only production and preview as deployed", () => {
    expect(isDeployedEnv({ VERCEL_ENV: "production" })).toBe(true)
    expect(isDeployedEnv({ VERCEL_ENV: "preview" })).toBe(true)
    expect(isDeployedEnv({ VERCEL_ENV: "development" })).toBe(false)
    expect(isDeployedEnv({})).toBe(false)
  })
})
