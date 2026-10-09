// @vitest-environment node
import { readdirSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

// Guard (spec section 5): every route handler under app/api/admin/** answers
// 401 when nobody is signed in, before it touches the database, the auth API
// or email. Routes are discovered from disk, so a new admin route is covered
// the moment its file exists. The real gates in lib/auth/requireAdmin.ts run;
// only the session lookup underneath them is faked (to "no session").

const tripwire = vi.hoisted(() => ({ calls: [] as string[] }))

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
  cookies: async () => ({ get: () => undefined, getAll: () => [] }),
}))

vi.mock("@/lib/platform/provider", () => ({ isPlatformConfigured: () => true }))

vi.mock("@/lib/auth/server", () => ({
  auth: {
    api: new Proxy({} as Record<string, unknown>, {
      get(_target, prop) {
        // The session lookup: nobody is signed in.
        if (prop === "getSession") return async () => null
        if (typeof prop !== "string" || prop === "then") return undefined
        // Any other auth API call before the gate is a failure.
        return async () => {
          tripwire.calls.push(`auth.api.${prop}`)
          throw new Error(`auth.api.${prop} reached without a session`)
        }
      },
    }),
  },
}))

vi.mock("@/lib/db/client", () => {
  const trip = (name: string) => () => {
    tripwire.calls.push(name)
    throw new Error(`${name} reached without a session`)
  }
  return { getNeonPool: trip("getNeonPool"), getNeonDb: trip("getNeonDb"), requireNeonDb: trip("requireNeonDb") }
})

vi.mock("@/lib/data/store", () => ({
  getPlatformStore: async () => {
    tripwire.calls.push("getPlatformStore")
    throw new Error("getPlatformStore reached without a session")
  },
}))

const ADMIN_API_DIR = fileURLToPath(new URL(".", import.meta.url))
const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const

// Every route file below app/api/admin, as "leads/route.ts" and so on.
const routeFiles = readdirSync(ADMIN_API_DIR, { recursive: true, encoding: "utf8" })
  .map((entry) => entry.split(path.sep).join("/"))
  .filter((rel) => /(^|\/)route\.(ts|tsx|js|mjs)$/.test(rel))
  .sort()

// Positive control on discovery: a guard that finds no routes proves nothing.
// Task 9 adds "users/route.ts" to this list.
const KNOWN_ROUTES = ["export/route.ts", "leads/route.ts", "stats/route.ts"]

type Handler = (
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) => Promise<Response>

describe("admin API guard: no session means 401", () => {
  beforeEach(() => {
    tripwire.calls = []
    // Look fully configured, so a 401 can only come from the missing session.
    vi.stubEnv("DATABASE_URL", "postgresql://guard:guard@127.0.0.1:1/guard")
    vi.stubEnv("BETTER_AUTH_SECRET", "guard-test-secret-at-least-32-characters")
    vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000")
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("discovers every known admin route", () => {
    expect(routeFiles).toEqual(expect.arrayContaining(KNOWN_ROUTES))
  })

  it.each(routeFiles)("%s answers 401 for every method it exports", async (rel) => {
    const mod = (await import(/* @vite-ignore */ path.join(ADMIN_API_DIR, rel))) as Record<string, unknown>
    const methods = HTTP_METHODS.filter((method) => typeof mod[method] === "function")
    expect(methods.length, `${rel} exports no HTTP handler`).toBeGreaterThan(0)

    const urlPath = rel.replace(/\/?route\.\w+$/, "")
    for (const method of methods) {
      const request = new NextRequest(`http://localhost/api/admin/${urlPath}`, {
        method,
        ...(method === "GET" ? {} : { headers: { "content-type": "application/json" }, body: "{}" }),
      })
      const response = await (mod[method] as Handler)(request, { params: Promise.resolve({}) })
      expect(response.status, `${method} ${rel}`).toBe(401)
    }
    expect(tripwire.calls, `${rel} reached a protected dependency before the auth check`).toEqual([])
  })
})
