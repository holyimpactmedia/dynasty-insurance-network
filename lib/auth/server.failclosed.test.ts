// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest"

// Only module load matters here; keep the email provider out of it.
vi.mock("@/lib/email/sendAuthEmail", () => ({ sendAuthEmail: vi.fn() }))

function stubDeployed(overrides: Record<string, string> = {}) {
  vi.stubEnv("VERCEL_ENV", "production")
  vi.stubEnv("NEXT_PHASE", "")
  vi.stubEnv("BETTER_AUTH_SECRET", "")
  vi.stubEnv("DATABASE_URL", "")
  for (const [key, value] of Object.entries(overrides)) vi.stubEnv(key, value)
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe("lib/auth/server fails closed when deployed", () => {
  it("refuses to load without BETTER_AUTH_SECRET", async () => {
    stubDeployed()
    await expect(import("./server")).rejects.toThrow(/BETTER_AUTH_SECRET/)
  })
  it("refuses to load without DATABASE_URL", async () => {
    stubDeployed({ BETTER_AUTH_SECRET: "s".repeat(32) })
    await expect(import("./server")).rejects.toThrow(/DATABASE_URL/)
  })
  it("still loads with placeholders during next build", async () => {
    stubDeployed({ NEXT_PHASE: "phase-production-build" })
    await expect(import("./server")).resolves.toHaveProperty("auth")
  })
})
