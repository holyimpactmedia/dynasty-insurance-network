// @vitest-environment node
import { describe, it, expect, afterEach, vi } from "vitest"
import type { Pool } from "pg"
import { getNeonPool } from "@/lib/db/client"
import { DORMANT_DATABASE_URL } from "@/lib/platform/provider"

const globals = globalThis as unknown as Record<string, unknown>

describe("getNeonPool", () => {
  afterEach(async () => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    const pool = globals.dynastyPool as Pool | undefined
    if (pool) await pool.end()
    delete globals.dynastyPool
    delete globals.dynastyDb
  })

  it("returns null when DATABASE_URL is not set", () => {
    vi.stubEnv("DATABASE_URL", "")
    expect(getNeonPool()).toBeNull()
  })

  it("never pools the public placeholder URL", () => {
    vi.stubEnv("DATABASE_URL", DORMANT_DATABASE_URL)
    expect(getNeonPool()).toBeNull()
  })

  it("caps any single query at 8 s so a hung connection cannot hold a request", () => {
    // Dead local address. Constructing a Pool does not connect, so no network is touched.
    vi.stubEnv("DATABASE_URL", "postgresql://probe:probe@127.0.0.1:1/probe")
    vi.spyOn(console, "error").mockImplementation(() => {})
    const pool = getNeonPool()
    expect(pool).not.toBeNull()
    expect(pool!.options.query_timeout).toBe(8000)
  })

  it("registers an error listener so an idle client error cannot crash the process", () => {
    // Dead local address. Constructing a Pool does not connect, so no network is touched.
    vi.stubEnv("DATABASE_URL", "postgresql://probe:probe@127.0.0.1:1/probe")
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    const pool = getNeonPool()
    expect(pool).not.toBeNull()
    expect(pool!.listenerCount("error")).toBeGreaterThanOrEqual(1)

    expect(() => pool!.emit("error", new Error("idle client closed"))).not.toThrow()
    expect(errorSpy).toHaveBeenCalledWith("[db] idle client error", "idle client closed")
  })
})
