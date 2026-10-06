# Task 5: Auth server and gates

Part of [docs/plan.md](../../../plan.md). Read its Global Constraints first.

**Goal:** Better Auth running on Neon with Dynasty naming, a `/api/auth/*` route that refuses every call (503) when the platform is not configured, an admin gate that accepts `admin` and `superadmin` from the Better Auth session, a proxy that sends cookieless dashboard visits to login, and Dynasty-worded auth emails.

**Files:**
- Create (copy verbatim): `lib/auth/client.ts`, `lib/auth/permissions.ts`, `lib/auth/bootstrap.ts`, `lib/auth/bootstrap.test.ts`, `lib/email/fromAddress.ts`, `lib/email/fromAddress.test.ts`, `scripts/bootstrap-auth-users.ts`
- Create (copy, then edit): `lib/auth/server.ts`, `lib/email/sendAuthEmail.ts`, `proxy.ts` (replaces main's), `lib/auth/requireAdmin.ts` (replaces main's), `lib/auth/requireAdmin.test.ts`
- Create (new): `app/api/auth/[...all]/route.ts`, `app/api/auth/[...all]/route.test.ts`, `lib/auth/server.failclosed.test.ts`, `proxy.test.ts`

**Interfaces:**
- Consumes: Task 3 `isPlatformConfigured`, `resolveAuthSecret`, `resolveDatabaseUrl`; Task 4 `getNeonDb`, `@/lib/db/schema/auth`.
- Produces:
  - `auth` (Better Auth instance) from `@/lib/auth/server`, type `BetterAuthSession`
  - `authClient` from `@/lib/auth/client` (used by Task 6 pages: `authClient.signIn.email`, `authClient.signOut`, `authClient.requestPasswordReset`, `authClient.resetPassword`)
  - From `@/lib/auth/requireAdmin`: `requireAdmin(): Promise<AdminContext>`, `requireSuperAdmin(): Promise<AdminContext>`, `requireAdminApi()`, `requireSuperAdminApi()` (each API variant returns `{ ok: true; ctx } | { ok: false; response }`); `AdminContext = { user: {id, email}, profile: {id, role, first_name, last_name, email}, isSuperAdmin: boolean }`
  - `sendAuthEmail({ to, url, kind: "verification" | "password-reset" }): Promise<void>`
  - `formatFromAddress(envValue, fallbackName, fallbackEmail): string`
  - `isPublicSignupDisabled(env?)`, `isAuthBootstrapMode(env?)` from `@/lib/auth/bootstrap`

**Why:** main's `requireAdmin` accepts only role `admin` and reads Supabase `profiles`; the owner's Neon account is `superadmin`, so main's gate would lock the owner out. The redesign server falls back to a public placeholder secret; Task 3's resolvers close that.

- [ ] **Step 1: Copy the verbatim files**

```bash
mkdir -p lib/auth lib/email "app/api/auth/[...all]"
git show origin/redesign/union-private-healthcare:lib/auth/client.ts > lib/auth/client.ts
git show origin/redesign/union-private-healthcare:lib/auth/permissions.ts > lib/auth/permissions.ts
git show origin/redesign/union-private-healthcare:lib/auth/bootstrap.ts > lib/auth/bootstrap.ts
git show origin/redesign/union-private-healthcare:lib/auth/bootstrap.test.ts > lib/auth/bootstrap.test.ts
git show origin/redesign/union-private-healthcare:lib/email/fromAddress.ts > lib/email/fromAddress.ts
git show origin/redesign/union-private-healthcare:lib/email/fromAddress.test.ts > lib/email/fromAddress.test.ts
git show origin/redesign/union-private-healthcare:scripts/bootstrap-auth-users.ts > scripts/bootstrap-auth-users.ts
git show origin/redesign/union-private-healthcare:lib/auth/server.ts > lib/auth/server.ts
git show origin/redesign/union-private-healthcare:lib/email/sendAuthEmail.ts > lib/email/sendAuthEmail.ts
git show origin/redesign/union-private-healthcare:proxy.ts > proxy.ts
git show origin/redesign/union-private-healthcare:lib/auth/requireAdmin.ts > lib/auth/requireAdmin.ts
git show origin/redesign/union-private-healthcare:lib/auth/requireAdmin.test.ts > lib/auth/requireAdmin.test.ts
```

- [ ] **Step 2: Write the fail-closed tests first**

Create `lib/auth/server.failclosed.test.ts`:

```ts
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
```

Never stub a real `DATABASE_URL` in this file (`getNeonDb()` caches its pool on `globalThis`, which `vi.resetModules()` does not clear). If the real `better-auth` import proves flaky under vitest, replace the three cases with a source scan: read `./server.ts` with `readFileSync` and assert it does not contain `"dormant-secret-not-for-production"` and matches `/resolveAuthSecret\(\)/`.

Create `app/api/auth/[...all]/route.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest"

const state = vi.hoisted(() => ({ configured: false, serverLoaded: false }))

vi.mock("@/lib/platform/provider", () => ({ isPlatformConfigured: () => state.configured }))
vi.mock("@/lib/auth/server", () => {
  state.serverLoaded = true
  return { auth: { handler: async () => new Response("ok", { status: 200 }) } }
})

afterEach(() => {
  state.configured = false
  state.serverLoaded = false
  vi.resetModules()
})

describe("auth route fails closed", () => {
  it("returns 503 and never loads Better Auth when the platform is not configured", async () => {
    const { POST } = await import("./route")
    const res = await POST(new Request("http://localhost/api/auth/sign-in/email", { method: "POST" }))
    expect(res.status).toBe(503)
    expect(await res.json()).toEqual({ message: "Sign-in is not configured yet." })
    expect(state.serverLoaded).toBe(false)
  })
  it("delegates to Better Auth when configured", async () => {
    state.configured = true
    const { GET } = await import("./route")
    const res = await GET(new Request("http://localhost/api/auth/get-session"))
    expect(res.status).toBe(200)
    expect(state.serverLoaded).toBe(true)
  })
})
```

Create `proxy.test.ts` (repo root):

```ts
// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

const state = vi.hoisted(() => ({ configured: true, cookie: null as string | null }))
vi.mock("@/lib/platform/provider", () => ({ isPlatformConfigured: () => state.configured }))
vi.mock("better-auth/cookies", () => ({ getSessionCookie: () => state.cookie }))

import { proxy } from "./proxy"

afterEach(() => {
  state.configured = true
  state.cookie = null
})

describe("proxy", () => {
  it("redirects a cookieless dashboard request to login", async () => {
    const res = await proxy(new NextRequest("http://localhost/dashboard/admin"))
    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toBe("http://localhost/auth/login?redirectTo=%2Fdashboard%2Fadmin")
  })
  it("lets the dashboard render SetupRequired when the platform is not configured", async () => {
    state.configured = false
    const res = await proxy(new NextRequest("http://localhost/dashboard/admin"))
    expect(res.headers.get("location")).toBeNull()
  })
  it("passes a dashboard request with a session cookie through", async () => {
    state.cookie = "session-token"
    const res = await proxy(new NextRequest("http://localhost/dashboard/admin"))
    expect(res.headers.get("location")).toBeNull()
  })
})
```

Add the fail-closed pins to `lib/auth/requireAdmin.test.ts`. Replace:

```ts
const authState = vi.hoisted(() => ({ session: null as MockSession | null }))
```

with:

```ts
const authState = vi.hoisted(() => ({
  session: null as MockSession | null,
  configured: true,
  getSessionCalls: 0,
}))
```

Replace `  isPlatformConfigured: () => true,` with `  isPlatformConfigured: () => authState.configured,`.

Replace `  auth: { api: { getSession: async () => authState.session } },` with:

```ts
  auth: {
    api: {
      getSession: async () => {
        authState.getSessionCalls += 1
        return authState.session
      },
    },
  },
```

Replace:

```ts
  beforeEach(() => {
    authState.session = null
  })
```

with:

```ts
  beforeEach(() => {
    authState.session = null
    authState.configured = true
    authState.getSessionCalls = 0
  })
```

Replace the last test's closing (the final `})` lines of the `accepts a superadmin` test and the describe):

```ts
      expect(result.ctx.isSuperAdmin).toBe(true)
    }
  })
})
```

with:

```ts
      expect(result.ctx.isSuperAdmin).toBe(true)
    }
  })

  it("fails closed when the platform is not configured, even with a superadmin session", async () => {
    authState.configured = false
    authState.session = session("superadmin")
    const { requireAdminApi } = await loadGate()
    const result = await requireAdminApi()
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.response.status).toBe(403)
      expect(await result.response.json()).toEqual({ error: "unconfigured" })
    }
    expect(authState.getSessionCalls).toBe(0)
  })

  it("refuses an admin on super-admin-only APIs", async () => {
    authState.session = session("admin")
    const { requireSuperAdminApi } = await loadGate()
    const result = await requireSuperAdminApi()
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(403)
  })
})
```

- [ ] **Step 3: Run the new tests to confirm the right ones fail**

```bash
pnpm vitest run lib/auth app/api/auth proxy.test.ts
```

Expected FAILs: `server.failclosed` cases 1 and 2 (server still uses the placeholder), the auth route tests (`./route` does not exist), proxy "not configured" (proxy ignores configuration). Expected PASS: `bootstrap`, `fromAddress`, all six `requireAdmin` tests (the copied gate already checks configuration first), proxy redirect and cookie cases.

- [ ] **Step 4: Make the server fail closed and Dynasty-named**

In `lib/auth/server.ts`, replace:

```ts
import { sendAuthEmail } from "@/lib/email/sendAuthEmail"
```

with:

```ts
import { sendAuthEmail } from "@/lib/email/sendAuthEmail"
import { resolveAuthSecret, resolveDatabaseUrl } from "@/lib/platform/provider"
```

Replace:

```ts
const dormantConnection = "postgresql://dormant:dormant@127.0.0.1:5432/dormant"
const database = getNeonDb() ?? drizzle(new Pool({ connectionString: dormantConnection }), { schema: authSchema })
const baseURL = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
const secret = process.env.BETTER_AUTH_SECRET || "dormant-secret-not-for-production"
```

with:

```ts
// Fail closed. In a deployed runtime (Vercel production or preview) a missing
// BETTER_AUTH_SECRET or DATABASE_URL throws here, before any pool or auth
// instance exists, so nothing is ever signed with a placeholder. Local dev,
// tests and `next build` keep the dormant placeholders so the module loads
// with no environment. Every caller gates on isPlatformConfigured() first, so
// in normal operation this throw is never reached.
const secret = resolveAuthSecret()
const database =
  getNeonDb() ?? drizzle(new Pool({ connectionString: resolveDatabaseUrl() }), { schema: authSchema })
const baseURL = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
```

Replace `  appName: "Union Private Healthcare",` with `  appName: "Dynasty Insurance Group",`.

- [ ] **Step 5: Write the gated auth route**

Create `app/api/auth/[...all]/route.ts`:

```ts
import { NextResponse } from "next/server"
import { isPlatformConfigured } from "@/lib/platform/provider"

export const runtime = "nodejs"

// Fail closed: with the database, secret or site URL missing, refuse every
// auth call before Better Auth (and its placeholder fallbacks) ever loads.
// The lazy import also keeps `next build` from evaluating lib/auth/server.ts.
async function handler(request: Request): Promise<Response> {
  if (!isPlatformConfigured()) {
    return NextResponse.json({ message: "Sign-in is not configured yet." }, { status: 503 })
  }
  const { auth } = await import("@/lib/auth/server")
  return auth.handler(request)
}

export const GET = handler
export const POST = handler
```

- [ ] **Step 6: Make the proxy skip the redirect when unconfigured**

In `proxy.ts`, replace:

```ts
import { getSessionCookie } from "better-auth/cookies"

export async function proxy(request: NextRequest) {
  // Optimistic redirect only. Layouts and APIs perform authoritative checks.
  if (request.nextUrl.pathname.startsWith("/dashboard") && !getSessionCookie(request)) {
```

with:

```ts
import { getSessionCookie } from "better-auth/cookies"
import { isPlatformConfigured } from "@/lib/platform/provider"

export async function proxy(request: NextRequest) {
  // Optimistic redirect only. Layouts and APIs perform authoritative checks.
  // Unconfigured platform: skip the redirect so the dashboard layout renders
  // SetupRequired instead of a login form that cannot succeed.
  if (
    request.nextUrl.pathname.startsWith("/dashboard") &&
    isPlatformConfigured() &&
    !getSessionCookie(request)
  ) {
```

Replace `  matcher: ["/dashboard/:path*", "/auth/:path*"],` with `  matcher: ["/dashboard/:path*"],` (the `/auth` entry did nothing).

Do NOT port main's "signed-in user on /auth/login goes to the dashboard" redirect: the proxy only sees that a cookie exists, so a stale cookie would loop between login, dashboard and the role gate. Visible change: a signed-in admin who opens `/auth/login` sees the form.

- [ ] **Step 7: House-style fix in the gate**

In `lib/auth/requireAdmin.ts`, replace ` * Authenticated non-super admins get 403, not 401 — they are known, just not` with ` * Authenticated non-super admins get 403, not 401: they are known, just not`.

- [ ] **Step 8: Dynasty auth emails**

In `lib/email/sendAuthEmail.ts`, replace:

```ts
  const subject = isReset ? "Reset your Union Private Healthcare portal password" : "Verify your Union Private Healthcare portal email"
```

with:

```ts
  const subject = isReset ? "Reset your Dynasty admin dashboard password" : "Verify your Dynasty admin dashboard email"
```

Replace `<h1 style="color:#0A2540;font-size:24px">` with `<h1 style="color:#0A1128;font-size:24px">`.

Replace `style="display:inline-block;background:#0A2540;color:#ffffff;` with `style="display:inline-block;background:#0A1128;color:#D4AF37;`.

- [ ] **Step 9: Run the tests to confirm they pass**

```bash
pnpm vitest run lib/auth app/api/auth proxy.test.ts lib/email lib/platform
```

Expected: all PASS.

- [ ] **Step 10: Positive control (must FAIL, then restore)**

In `app/api/auth/[...all]/route.ts`, temporarily delete the `if (!isPlatformConfigured()) {...}` block; run `pnpm vitest run app/api/auth`; expect "returns 503 ..." to FAIL. Restore and re-run: PASS.

- [ ] **Step 11: Mechanical checks and commit**

```bash
pnpm exec tsc --noEmit && pnpm test && pnpm lint && pnpm check:guards && pnpm build
git add lib/auth lib/email/sendAuthEmail.ts lib/email/fromAddress.ts lib/email/fromAddress.test.ts proxy.ts proxy.test.ts "app/api/auth" scripts/bootstrap-auth-users.ts
git commit -m "feat(auth): Better Auth on Neon, fail-closed auth route, admin+superadmin gate, Dynasty auth emails"
```

Note: the dashboard pages and login page still import Supabase until Tasks 6 and 8; `lib/supabase/middleware.ts` is now unused and is deleted in Task 10.
