# Task 4: Database layer and health

Part of [docs/plan.md](../../../plan.md). Read its Global Constraints first.

**Goal:** the Drizzle schema files (byte-identical to what is already applied in Neon), the Neon client, the `PlatformStore` data seam, `/api/health` reading Neon, and a read-only `db:verify` that passes against the live schema.

**Files:**
- Create (copy from redesign, verbatim): `drizzle.config.ts`, `drizzle/0000_purple_loa.sql`, `drizzle/meta/_journal.json`, `drizzle/meta/0000_snapshot.json`, `lib/db/client.ts`, `lib/db/schema/app.ts`, `lib/db/schema/auth.ts`, `lib/db/schema/index.ts`, `lib/data/types.ts`, `lib/data/lead-mapper.ts`
- Create (copy from redesign, then edit): `lib/data/store.ts`, `lib/data/neon-store.ts`, `scripts/verify-neon-schema.ts`, `app/api/health/route.ts` (verbatim)
- Create (new tests): `lib/data/neon-store.test.ts`, `app/api/health/route.test.ts`

**Interfaces:**
- Consumes: packages from Task 1.
- Produces (used by Tasks 5 to 9):
  - `getNeonPool(): Pool | null`, `getNeonDb(): NodePgDatabase | null`, `requireNeonDb(): NodePgDatabase` from `@/lib/db/client`
  - Drizzle tables `leads`, `emailSuppressions`, `appSettings` (from `@/lib/db/schema/app`, re-exported by `@/lib/db/schema`) and `user`, `session`, `account`, `verification` (from `@/lib/db/schema/auth`)
  - `getPlatformStore(): Promise<PlatformStore>` from `@/lib/data/store`
  - `PlatformStore`, `LeadCreateInput`, `LeadFilters`, `LeadListResult`, `PipelineStats`, `FunnelRow`, `DailyRow` from `@/lib/data/types`. `PlatformStore` methods: `isConfigured()`, `healthCheck()`, `findRecentDuplicate(email, since)`, `createLead(input)`, `updateAiScore(id, {score, reasons, predictedCloseRate, scoredAt})`, `updateMarketplaceStatus(id, status, sentAt?, marketplaceLeadId?)`, `listLeads(filters, page, pageSize)`, `listAllLeads(filters)`, `getPipelineStats()`, `getDailyLeadCounts()`, `getFunnelBreakdown()`, `getRecentLeadTimes(since)`, `getSetting(key)`, `setSetting(key, value)`, `recordSuppression(email, source)`.
  - `GET /api/health`: `200 {"status":"ok","provider":"neon"}`; `503 {"status":"error","reason":"database_unconfigured","provider":"neon"}`; `503 {"status":"error","reason":"leads_table_unreachable","provider":"neon"}` (no `detail`; the error goes to the server log).

**Why:** the schema is already live in Neon (applied 2026-06 from these exact files). Drizzle records each migration's sha256 and timestamp, so any regenerated or edited migration would try to re-apply. The `lib/data` seam is what every route uses instead of Supabase calls.

- [ ] **Step 1: Copy the Drizzle and DB files verbatim**

```bash
mkdir -p drizzle/meta lib/db/schema lib/data
git show origin/redesign/union-private-healthcare:drizzle.config.ts > drizzle.config.ts
git show origin/redesign/union-private-healthcare:drizzle/0000_purple_loa.sql > drizzle/0000_purple_loa.sql
git show origin/redesign/union-private-healthcare:drizzle/meta/_journal.json > drizzle/meta/_journal.json
git show origin/redesign/union-private-healthcare:drizzle/meta/0000_snapshot.json > drizzle/meta/0000_snapshot.json
git show origin/redesign/union-private-healthcare:lib/db/client.ts > lib/db/client.ts
git show origin/redesign/union-private-healthcare:lib/db/schema/app.ts > lib/db/schema/app.ts
git show origin/redesign/union-private-healthcare:lib/db/schema/auth.ts > lib/db/schema/auth.ts
git show origin/redesign/union-private-healthcare:lib/db/schema/index.ts > lib/db/schema/index.ts
git show origin/redesign/union-private-healthcare:lib/data/types.ts > lib/data/types.ts
git show origin/redesign/union-private-healthcare:lib/data/lead-mapper.ts > lib/data/lead-mapper.ts
git show origin/redesign/union-private-healthcare:lib/data/store.ts > lib/data/store.ts
git show origin/redesign/union-private-healthcare:lib/data/neon-store.ts > lib/data/neon-store.ts
mkdir -p app/api/health scripts
git show origin/redesign/union-private-healthcare:app/api/health/route.ts > app/api/health/route.ts
git show origin/redesign/union-private-healthcare:scripts/verify-neon-schema.ts > scripts/verify-neon-schema.ts
```

- [ ] **Step 2: Prove the migration is byte-identical**

```bash
shasum -a 256 drizzle/0000_purple_loa.sql
```

Expected: `239762878eb2b7e070b7d9ccb507fb743e9431a7822455609e5900481df9a0dc`. Anything else: stop.

- [ ] **Step 3: Store comment edit**

In `lib/data/store.ts`, replace:

```ts
// Neon is the only platform store. The Supabase store was removed (2026-07).
```

with:

```ts
// Neon is the only platform store.
```

- [ ] **Step 4: Write the store tests (column parity and suppression)**

Create `lib/data/neon-store.test.ts`:

```ts
// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { getTableColumns, getTableName } from "drizzle-orm"

const h = vi.hoisted(() => {
  const calls = {
    table: undefined as unknown,
    values: undefined as Record<string, unknown> | undefined,
    conflict: undefined as { target: unknown; set: Record<string, unknown> } | undefined,
  }
  const db = {
    insert(table: unknown) {
      calls.table = table
      return {
        values(values: Record<string, unknown>) {
          calls.values = values
          return {
            returning: async () => [
              { id: "00000000-0000-4000-8000-000000000001", createdAt: "2026-10-06 15:04:05.9+00" },
            ],
            onConflictDoUpdate: async (conflict: { target: unknown; set: Record<string, unknown> }) => {
              calls.conflict = conflict
            },
          }
        },
      }
    },
  }
  return { calls, db }
})

vi.mock("@/lib/db/client", () => ({
  getNeonDb: () => h.db,
  requireNeonDb: () => h.db,
}))

import { neonStore } from "@/lib/data/neon-store"
import { emailSuppressions, leads } from "@/lib/db/schema"
import type { LeadCreateInput } from "@/lib/data/types"

const FIXED_NOW = "2026-10-06T15:04:05.678Z"
const CERT_URL = "https://cert.trustedform.com/0123456789abcdef0123456789abcdef01234567"

const input: LeadCreateInput = {
  referenceNumber: "HL-TEST-0001",
  firstName: "Test",
  lastName: "Parity",
  email: "test.parity@example.com",
  phone: "(555) 010-0199",
  age: 42,
  state: "Florida",
  incomeRange: "$65,000 to $90,000",
  householdSize: "Me + spouse",
  qualifyingEvent: "Lost job coverage",
  priorities: '["nationwide"]',
  tcpaConsent: true,
  tcpaConsentAt: FIXED_NOW,
  trustedFormCertUrl: CERT_URL,
  funnelType: "private_health",
  utmSource: "facebook",
  utmMedium: "paid_social",
  utmCampaign: "dynasty_individual_q4",
  ipAddress: "203.0.113.7",
  quizAnswers: { healthScreen: "No", govCoverage: "No" },
}

// Exactly the object main's app/api/leads/route.ts passed to
// supabase.from('leads').insert(...) for the same lead (snake_case columns).
const MAIN_ROW = {
  reference_number: "HL-TEST-0001",
  first_name: "Test",
  last_name: "Parity",
  email: "test.parity@example.com",
  phone: "(555) 010-0199",
  age: 42,
  state: "Florida",
  income_range: "$65,000 to $90,000",
  household_size: "Me + spouse",
  qualifying_event: "Lost job coverage",
  priorities: '["nationwide"]',
  tcpa_consent: true,
  tcpa_consent_at: FIXED_NOW,
  trusted_form_cert_url: CERT_URL,
  funnel_type: "private_health",
  utm_source: "facebook",
  utm_medium: "paid_social",
  utm_campaign: "dynasty_individual_q4",
  ip_address: "203.0.113.7",
  quiz_answers: { healthScreen: "No", govCoverage: "No" },
  status: "new",
}

function toColumnRow(values: Record<string, unknown>) {
  const columns = getTableColumns(leads) as Record<string, { name: string }>
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => {
      const column = columns[key]
      if (!column) throw new Error(`neon-store wrote unknown property ${key}`)
      return [column.name, value]
    }),
  )
}

describe("neonStore", () => {
  beforeEach(() => {
    h.calls.table = undefined
    h.calls.values = undefined
    h.calls.conflict = undefined
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("createLead writes exactly the columns and values main's Supabase insert wrote", async () => {
    const result = await neonStore.createLead(input)
    expect(h.calls.table).toBe(leads)
    expect(toColumnRow(h.calls.values!)).toStrictEqual(MAIN_ROW)
    expect(result).toEqual({ id: "00000000-0000-4000-8000-000000000001", createdAt: "2026-10-06 15:04:05.9+00" })
  })

  it("recordSuppression upserts into email_suppressions keyed on email, app-clock timestamp", async () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date(FIXED_NOW))
    await neonStore.recordSuppression("foo@example.com", "one-click")
    expect(h.calls.table).toBe(emailSuppressions)
    expect(getTableName(emailSuppressions)).toBe("email_suppressions")
    expect(h.calls.values).toStrictEqual({ email: "foo@example.com", source: "one-click", suppressedAt: FIXED_NOW })
    expect(getTableColumns(emailSuppressions).suppressedAt.name).toBe("suppressed_at")
    expect(h.calls.conflict?.target).toBe(emailSuppressions.email)
    expect(h.calls.conflict?.set).toStrictEqual({ source: "one-click", suppressedAt: FIXED_NOW })
  })
})
```

- [ ] **Step 5: Run it to confirm the suppression test fails**

```bash
pnpm vitest run lib/data/neon-store.test.ts
```

Expected: `createLead ...` PASS; `recordSuppression ...` FAIL (the copied insert omits `suppressedAt`, so the database default would stamp the first write instead of the app clock that main used).

- [ ] **Step 6: Make the suppression write match main**

In `lib/data/neon-store.ts`, replace:

```ts
  async recordSuppression(email, source) {
    await requireNeonDb().insert(emailSuppressions).values({ email, source })
      .onConflictDoUpdate({
        target: emailSuppressions.email,
        set: { source, suppressedAt: new Date().toISOString() },
      })
  },
```

with:

```ts
  async recordSuppression(email, source) {
    // App-clock timestamp on first insert and on repeat, as the Supabase upsert wrote it.
    const suppressedAt = new Date().toISOString()
    await requireNeonDb().insert(emailSuppressions).values({ email, source, suppressedAt })
      .onConflictDoUpdate({
        target: emailSuppressions.email,
        set: { source, suppressedAt },
      })
  },
```

Run `pnpm vitest run lib/data/neon-store.test.ts`. Expected: both PASS.

- [ ] **Step 7: Write the health route test**

Create `app/api/health/route.test.ts`:

```ts
// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from "vitest"

const state = vi.hoisted(() => ({ configured: true, healthError: null as unknown }))

vi.mock("@/lib/data/store", () => ({
  getPlatformStore: async () => ({
    isConfigured: () => state.configured,
    healthCheck: async () => {
      if (state.healthError) throw state.healthError
    },
  }),
}))

import { GET } from "@/app/api/health/route"

describe("GET /api/health", () => {
  beforeEach(() => {
    state.configured = true
    state.healthError = null
  })

  it("returns 200 with provider neon when the leads table answers", async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: "ok", provider: "neon" })
  })

  it("returns 503 database_unconfigured when DATABASE_URL is missing", async () => {
    state.configured = false
    const res = await GET()
    expect(res.status).toBe(503)
    expect(await res.json()).toEqual({ status: "error", reason: "database_unconfigured", provider: "neon" })
  })

  it("returns 503 leads_table_unreachable without leaking the error text", async () => {
    state.healthError = new Error("password authentication failed for user neondb_owner")
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const res = await GET()
    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body).toEqual({ status: "error", reason: "leads_table_unreachable", provider: "neon" })
    expect(JSON.stringify(body)).not.toContain("password")
    errorSpy.mockRestore()
  })
})
```

Run `pnpm vitest run app/api/health/route.test.ts`. Expected: 3 PASS (the route was copied verbatim in Step 1). Positive control: temporarily change `"database_unconfigured"` to `"x"` in the route, re-run, expect 1 FAIL, restore.

**Tradeoff (named):** the old health response included `detail: error.message`, which is how the 2026-10-05 outage was diagnosed from outside. The new one keeps internals private; diagnosis moves to Vercel runtime logs (`[health] database check failed`).

- [ ] **Step 8: Stop `db:verify` from asserting setting values**

`db:verify` should prove the schema, not current settings (a super admin toggling Projections must not break it). In `scripts/verify-neon-schema.ts`, replace:

```ts
    assert(settingValues.projections_enabled === true, "projections_enabled must default to true")
    assert(settingValues.lead_intake_paused === false, "lead_intake_paused must default to false")
```

with:

```ts
    assert(typeof settingValues.projections_enabled === "boolean", "projections_enabled setting is missing")
    assert(typeof settingValues.lead_intake_paused === "boolean", "lead_intake_paused setting is missing")
```

- [ ] **Step 9: Bring the local env file into the worktree (read-only use)**

```bash
cp /Users/imbossmarv/dynasty-insurance-network/.env.local .env.local
git check-ignore -q .env.local && echo "ignored: ok"
```

Expected: `ignored: ok`. Never `cat` this file.

- [ ] **Step 10: Verify the live schema, read-only**

```bash
pnpm db:verify
```

Expected: JSON with `"ok": true`, `"tables": 7`, `"leads": 32`, `"appliedMigrations": 1`. It only runs SELECTs plus a session `statement_timeout`.

- [ ] **Step 11: Prove the schema files match what Drizzle recorded (writes nothing)**

```bash
DATABASE_URL_DIRECT=postgres://unused pnpm db:generate; git status --short drizzle/
```

Expected: "No schema changes, nothing to migrate" and an empty `git status` for `drizzle/`. If drizzle-kit wrote a new file, delete it and stop: the copied schema does not match the snapshot.

- [ ] **Step 12: Mechanical checks and commit**

```bash
pnpm exec tsc --noEmit && pnpm test && pnpm lint && pnpm check:guards && pnpm build
git add drizzle.config.ts drizzle lib/db lib/data app/api/health scripts/verify-neon-schema.ts
git commit -m "feat(db): Neon schema files, data store seam, health on Neon, read-only db:verify"
```

Note: `lib/supabase/admin.ts` still exists and is still imported by routes Task 7 replaces; that is expected until Task 7.
