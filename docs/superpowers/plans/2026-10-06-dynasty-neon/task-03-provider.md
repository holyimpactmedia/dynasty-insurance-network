# Task 3: Fail-closed platform config

Part of [docs/plan.md](../../../plan.md). Read its Global Constraints first.

**Goal:** a single module that answers "is the platform configured?" and hands out the auth secret and database URL, rejecting the public placeholder values and refusing to fall back to them in a deployed (Vercel production or preview) runtime.

**Files:**
- Create: `lib/platform/provider.ts`
- Create: `lib/platform/provider.test.ts` (redesign's test plus new cases)

**Interfaces:**
- Consumes: `process.env`.
- Produces (exact signatures, used by Tasks 4 to 9):
  - `DORMANT_SECRET: string` = `"dormant-secret-not-for-production"`
  - `DORMANT_DATABASE_URL: string` = `"postgresql://dormant:dormant@127.0.0.1:5432/dormant"`
  - `interface PlatformEnv { DATABASE_URL?; BETTER_AUTH_SECRET?; BETTER_AUTH_URL?; NEXT_PUBLIC_SITE_URL?; VERCEL_ENV?; NEXT_PHASE? }` (all `string | undefined`)
  - `isDeployedEnv(env?: PlatformEnv): boolean`
  - `isPlatformConfigured(env?: PlatformEnv): boolean`
  - `resolveAuthSecret(env?: PlatformEnv): string`
  - `resolveDatabaseUrl(env?: PlatformEnv): string`

**Why:** the redesign's `lib/auth/server.ts` silently signs with `"dormant-secret-not-for-production"` when the secret is missing, and Better Auth's own default-secret check does not catch that string. Spec section 5 requires failing closed in deployed environments while letting `next build` and local tests load the module with no environment.

- [ ] **Step 1: Bring over the redesign test as the starting point**

```bash
mkdir -p lib/platform
git show origin/redesign/union-private-healthcare:lib/platform/provider.test.ts > lib/platform/provider.test.ts
```

- [ ] **Step 2: Extend the test with the fail-closed cases**

In `lib/platform/provider.test.ts`, replace:

```ts
import { isPlatformConfigured } from "./provider"
```

with:

```ts
import {
  DORMANT_DATABASE_URL,
  DORMANT_SECRET,
  isDeployedEnv,
  isPlatformConfigured,
  resolveAuthSecret,
  resolveDatabaseUrl,
} from "./provider"
```

Append at the end of the file:

```ts
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
```

- [ ] **Step 3: Run the test to confirm it fails**

```bash
pnpm vitest run lib/platform/provider.test.ts
```

Expected: FAIL, "Failed to resolve import ./provider" (the module does not exist yet).

- [ ] **Step 4: Write the module**

Create `lib/platform/provider.ts`:

```ts
// Neon Postgres + Better Auth is the only platform for the Dynasty site.

/**
 * Placeholders that let lib/auth/server.ts load with no environment (local dev,
 * tests, `next build`). Both values are public in this repo, so neither is ever
 * accepted as real configuration, and a deployed runtime never falls back to them.
 */
export const DORMANT_SECRET = "dormant-secret-not-for-production"
export const DORMANT_DATABASE_URL = "postgresql://dormant:dormant@127.0.0.1:5432/dormant"

const BUILD_PHASE = "phase-production-build"

export interface PlatformEnv {
  DATABASE_URL?: string
  BETTER_AUTH_SECRET?: string
  BETTER_AUTH_URL?: string
  NEXT_PUBLIC_SITE_URL?: string
  VERCEL_ENV?: string
  NEXT_PHASE?: string
}

/** Vercel production or preview. Local dev, CI and laptop builds are not deployed. */
export function isDeployedEnv(env: PlatformEnv = process.env): boolean {
  return env.VERCEL_ENV === "production" || env.VERCEL_ENV === "preview"
}

export function isPlatformConfigured(env: PlatformEnv = process.env): boolean {
  const { DATABASE_URL, BETTER_AUTH_SECRET } = env
  if (!DATABASE_URL || !BETTER_AUTH_SECRET) return false
  if (!(env.BETTER_AUTH_URL || env.NEXT_PUBLIC_SITE_URL)) return false
  // A placeholder pasted into the environment is not configuration.
  if (BETTER_AUTH_SECRET === DORMANT_SECRET || DATABASE_URL === DORMANT_DATABASE_URL) return false
  return true
}

function dormantFallback(env: PlatformEnv, name: string, placeholder: string): string {
  if (isDeployedEnv(env) && env.NEXT_PHASE !== BUILD_PHASE) {
    throw new Error(`${name} is not set in this deployed environment; refusing to start auth with a placeholder.`)
  }
  return placeholder
}

export function resolveAuthSecret(env: PlatformEnv = process.env): string {
  const value = env.BETTER_AUTH_SECRET
  if (value && value !== DORMANT_SECRET) return value
  return dormantFallback(env, "BETTER_AUTH_SECRET", DORMANT_SECRET)
}

export function resolveDatabaseUrl(env: PlatformEnv = process.env): string {
  const value = env.DATABASE_URL
  if (value && value !== DORMANT_DATABASE_URL) return value
  return dormantFallback(env, "DATABASE_URL", DORMANT_DATABASE_URL)
}
```

- [ ] **Step 5: Run the test to confirm it passes**

```bash
pnpm vitest run lib/platform/provider.test.ts
```

Expected: PASS, all cases (3 original plus the new ones).

- [ ] **Step 6: Positive control (must FAIL, then restore)**

Temporarily change the placeholder line in `isPlatformConfigured` to `if (false) return false`, run the test: the two "public placeholder" cases per environment must fail. Restore the line and re-run: PASS.

- [ ] **Step 7: Mechanical checks and commit**

```bash
pnpm exec tsc --noEmit && pnpm test && pnpm lint && pnpm check:guards
git add lib/platform/provider.ts lib/platform/provider.test.ts
git commit -m "feat(platform): fail-closed config check and placeholder-proof secret/DB resolution"
```

**Tradeoffs (named):** "deployed" means `VERCEL_ENV` only, so a self-hosted `next start` with no env would fall back to placeholders; the auth route gate in Task 5 still answers 503 there because `isPlatformConfigured()` is false. A minimum secret length is not enforced (Better Auth only warns), so a real but short secret still works.
