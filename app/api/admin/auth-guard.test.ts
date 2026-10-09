// @vitest-environment node
import { readdirSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

// Guard (spec section 5): every route handler under app/api/admin/** is gated
// before it touches the database, the auth API or email. Three cases, each
// run against every exported method of every route:
//   - no session means 401
//   - a signed-in non-admin (role "user") means 403
//   - an admin who is not a super admin, on the super-admin-only routes, means 403
// Routes are discovered from disk, so a new admin route is covered the moment
// its file exists. The real gates in lib/auth/requireAdmin.ts run; only the
// session lookup underneath them is faked (`session.role`, null for nobody).

const tripwire = vi.hoisted(() => ({ calls: [] as string[] }))
const session = vi.hoisted(() => ({ role: null as string | null }))

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
  cookies: async () => ({ get: () => undefined, getAll: () => [] }),
}))

vi.mock("@/lib/platform/provider", () => ({ isPlatformConfigured: () => true }))

vi.mock("@/lib/auth/server", () => ({
  auth: {
    api: new Proxy({} as Record<string, unknown>, {
      get(_target, prop) {
        // The session lookup: nobody, or a user with the role under test.
        if (prop === "getSession") {
          return async () =>
            session.role === null
              ? null
              : {
                  user: { id: "guard-user", email: "guard@example.com", name: "Guard User", role: session.role },
                  session: { id: "guard-session" },
                }
        }
        if (typeof prop !== "string" || prop === "then") return undefined
        // Any other auth API call before the gate lets the caller through is a failure.
        return async () => {
          tripwire.calls.push(`auth.api.${prop}`)
          throw new Error(`auth.api.${prop} reached before the role check passed`)
        }
      },
    }),
  },
}))

vi.mock("@/lib/db/client", () => {
  const trip = (name: string) => () => {
    tripwire.calls.push(name)
    throw new Error(`${name} reached before the role check passed`)
  }
  return { getNeonPool: trip("getNeonPool"), getNeonDb: trip("getNeonDb"), requireNeonDb: trip("requireNeonDb") }
})

vi.mock("@/lib/data/store", () => ({
  getPlatformStore: async () => {
    tripwire.calls.push("getPlatformStore")
    throw new Error("getPlatformStore reached before the role check passed")
  },
}))

const ADMIN_API_DIR = fileURLToPath(new URL(".", import.meta.url))
const HTTP_METHODS = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] as const

// Every route file below app/api/admin, as "leads/route.ts" and so on.
const routeFiles = readdirSync(ADMIN_API_DIR, { recursive: true, encoding: "utf8" })
  .map((entry) => entry.split(path.sep).join("/"))
  .filter((rel) => /(^|\/)route\.(ts|tsx|js|mjs)$/.test(rel))
  .sort()

// Positive control on discovery: a guard that finds no routes proves nothing.
const KNOWN_ROUTES = ["export/route.ts", "leads/route.ts", "stats/route.ts", "users/route.ts"]

// Routes only a super admin may use. A plain admin must get 403 here.
const SUPERADMIN_ONLY_ROUTES = ["users/route.ts"]

type Handler = (
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) => Promise<Response>

function stubConfiguredEnv() {
  // Look fully configured, so a refusal can only come from the role check.
  vi.stubEnv("DATABASE_URL", "postgresql://guard:guard@127.0.0.1:1/guard")
  vi.stubEnv("BETTER_AUTH_SECRET", "guard-test-secret-at-least-32-characters")
  vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000")
}

// Calls every HTTP handler a route file exports and expects the same status
// from each, then checks nothing protected was touched on the way.
async function expectEveryMethodAnswers(rel: string, status: number) {
  const mod = (await import(/* @vite-ignore */ path.join(ADMIN_API_DIR, rel))) as Record<string, unknown>
  const methods = HTTP_METHODS.filter((method) => typeof mod[method] === "function")
  expect(methods.length, `${rel} exports no HTTP handler`).toBeGreaterThan(0)

  const urlPath = rel.replace(/\/?route\.\w+$/, "")
  for (const method of methods) {
    // GET and HEAD requests cannot carry a body.
    const hasBody = method !== "GET" && method !== "HEAD"
    const request = new NextRequest(`http://localhost/api/admin/${urlPath}`, {
      method,
      ...(hasBody ? { headers: { "content-type": "application/json" }, body: "{}" } : {}),
    })
    const response = await (mod[method] as Handler)(request, { params: Promise.resolve({}) })
    expect(response.status, `${method} ${rel}`).toBe(status)
  }
  expect(tripwire.calls, `${rel} reached a protected dependency before the role check`).toEqual([])
}

describe("admin API guard: no session means 401", () => {
  beforeEach(() => {
    tripwire.calls = []
    session.role = null
    stubConfiguredEnv()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("discovers every known admin route", () => {
    expect(routeFiles).toEqual(expect.arrayContaining(KNOWN_ROUTES))
  })

  it.each(routeFiles)("%s answers 401 for every method it exports", async (rel) => {
    await expectEveryMethodAnswers(rel, 401)
  })
})

describe("admin API guard: signed in without the admin role means 403", () => {
  beforeEach(() => {
    tripwire.calls = []
    session.role = "user"
    stubConfiguredEnv()
  })

  afterEach(() => {
    session.role = null
    vi.unstubAllEnvs()
  })

  it.each(routeFiles)("%s answers 403 for every method it exports", async (rel) => {
    await expectEveryMethodAnswers(rel, 403)
  })
})

describe("admin API guard: an admin on super-admin-only routes means 403", () => {
  beforeEach(() => {
    tripwire.calls = []
    session.role = "admin"
    stubConfiguredEnv()
  })

  afterEach(() => {
    session.role = null
    vi.unstubAllEnvs()
  })

  it("lists only routes that exist", () => {
    for (const rel of SUPERADMIN_ONLY_ROUTES) {
      expect(KNOWN_ROUTES, `${rel} is super-admin-only but not in KNOWN_ROUTES`).toContain(rel)
      expect(routeFiles, `${rel} was not found on disk`).toContain(rel)
    }
  })

  it.each(SUPERADMIN_ONLY_ROUTES)("%s answers 403 to an admin for every method it exports", async (rel) => {
    await expectEveryMethodAnswers(rel, 403)
  })
})
