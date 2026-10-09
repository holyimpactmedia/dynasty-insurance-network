// @vitest-environment node
import { describe, it, expect, afterEach, vi } from "vitest"
import type { Pool } from "pg"
import { getNeonPool } from "@/lib/db/client"

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
