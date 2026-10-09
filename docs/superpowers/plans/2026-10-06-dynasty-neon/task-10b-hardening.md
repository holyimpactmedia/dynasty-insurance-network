# Task 10b: Lead-path resilience and a private TrustedForm claim

Part of [docs/plan.md](../../../plan.md). Read its Global Constraints and Review Focus first.

**Premise:** after Tasks 0 to 10, a slow or stale Neon connection can still lose a lead, and the TrustedForm claim cannot be verified before production or protected once its key is set.
**Observed:** not observed; found by reading in the final whole-branch review on 2026-10-09 (findings I1, I2, I3, I4, I7, M1, M2).

**Hard stop:** this slice changes TCPA and TrustedForm handling (Gate Policy: compliance). It runs only after the owner approves it in chat.

**Goal:** a hung or stale database connection can never stop the consumer's success response or the emails; a dropped connection does not lose the stored consent record; every TrustedForm claim logs its outcome; the claim is no longer a public endpoint that spends Dynasty's claims; the expired-link page is pinned by a test.

**Files:**
- Create: `lib/trustedform/claim.ts`, `lib/trustedform/claim.test.ts`, `app/auth/reset-password/page.test.tsx`
- Modify: `lib/db/client.ts`, `lib/db/client.test.ts`, `lib/data/neon-store.ts`, `lib/data/neon-store.test.ts`, `app/api/leads/route.ts`, `app/api/leads/route.test.ts`, `app/api/leads/route.trustedform.test.ts`, `docs/RUNBOOK.md`, `docs/PIPELINE.md`, `docs/SECURITY.md` (only if it names the claim route)
- Delete: `app/api/trustedform/claim/route.ts`, `app/api/trustedform/claim/route.test.ts` (its scan-phrase test moves to `lib/trustedform/claim.test.ts`), `lib/hooks/useTrustedForm.ts` (no importers; its only purpose was calling the public route)

**Interfaces:**
- Consumes: Task 3 `DORMANT_DATABASE_URL`; Task 4 store; Task 7 intake route.
- Produces: `claimTrustedFormCertificate(input, env?)` and `TRUSTEDFORM_SCAN_TERMS` from `@/lib/trustedform/claim`; log tags `TRUSTEDFORM CLAIM OK`, `TRUSTEDFORM SCAN MISMATCH`, `TRUSTEDFORM CLAIM FAILED`, `LEAD NOT STORED`.

**Not in this slice:** the dashboard layout's generic error page when Neon is down (review M3; it touches the auth gate), database-backed rate limiting, `attachDatabasePool` (needs `@vercel/functions`, a new dependency).

- [ ] **Step 1: Bound every query; never pool the placeholder URL**

Tests first, in `lib/db/client.test.ts` (reuse its `afterEach` cleanup):
- `vi.stubEnv("DATABASE_URL", DORMANT_DATABASE_URL)` (import it from `@/lib/platform/provider`): `getNeonPool()` is `null`.
- With the dead probe URL already used there, the pool's `options.query_timeout` is `8000`.

Then in `lib/db/client.ts`: import `DORMANT_DATABASE_URL` from `@/lib/platform/provider`; change the guard to `if (!connectionString || connectionString === DORMANT_DATABASE_URL) return null` with the comment `// The public placeholder is never a real database (see lib/platform/provider.ts).`; add to the `Pool` options:

```ts
      // Client-side cap on any single query, so a hung connection cannot hold a
      // request until the function time limit. It does not depend on the Neon
      // pooler honoring a statement_timeout.
      query_timeout: 8_000,
```

(`lib/auth/server.ts` already falls back to `resolveDatabaseUrl()` when `getNeonDb()` is null, which throws for the placeholder in a deployed runtime, so the fail-closed behavior is unchanged.)

- [ ] **Step 2: Retry the insert once on a dropped connection**

A pooled connection that Neon closed while the serverless instance was frozen fails on first use. The `leads.reference_number` unique index (`leads_reference_number_key`) makes one retry safe.

Tests first, in `lib/data/neon-store.test.ts` (extend its hoisted fake db so `returning` can be scripted per call and `select().from().where().limit()` returns scripted rows):
1. First insert rejects with `new Error("Connection terminated unexpectedly")`, second resolves a row: `createLead` returns `{ id, createdAt }` (ISO) and the insert ran twice.
2. First insert rejects with an error whose `cause` is `{ code: "ECONNRESET" }` (drizzle 0.45 wraps driver errors as `DrizzleQueryError` with the pg error as `cause`): retried, same as 1.
3. First insert rejects with a non-connection error (`{ code: "23502" }` cause): `createLead` rejects and the insert ran once.
4. First insert rejects with a connection error, the retry rejects with cause `{ code: "23505", constraint: "leads_reference_number_key" }`, and the select (by reference number AND email) returns the existing row: `createLead` returns that row (the first attempt was stored). Assert the select filtered on both columns.
5. Retry rejects with a 23505 on a different constraint: `createLead` rejects.

Then in `lib/data/neon-store.ts`, above `neonStore`:

```ts
// node-postgres reports a socket the server closed in several ways; drizzle
// 0.45 wraps the driver error, so look at `cause` too.
const CONNECTION_ERROR_CODES = new Set(["ECONNRESET", "EPIPE", "ETIMEDOUT", "57P01"])
const CONNECTION_ERROR_TEXT = /connection terminated|connection error|socket hang up|ECONNRESET/i

function driverError(error: unknown): { code?: string; constraint?: string; message?: string } {
  const outer = (error ?? {}) as { cause?: unknown; message?: string }
  const inner = (outer.cause ?? outer) as { code?: string; constraint?: string; message?: string }
  return { code: inner.code, constraint: inner.constraint, message: `${outer.message ?? ""} ${inner.message ?? ""}` }
}

function isConnectionError(error: unknown): boolean {
  const { code, message } = driverError(error)
  return (code !== undefined && CONNECTION_ERROR_CODES.has(code)) || CONNECTION_ERROR_TEXT.test(message ?? "")
}

function isReferenceConflict(error: unknown): boolean {
  const { code, constraint } = driverError(error)
  return code === "23505" && constraint === "leads_reference_number_key"
}
```

and change `createLead` so the insert is a local `insert()` thunk over the same values; on a connection error retry once; if the retry hits `isReferenceConflict`, select `{ id, createdAt }` where `referenceNumber` and `email` both match the input (limit 1) instead, so a reference collision with a different lead can never be mistaken for this one; any other error rethrows. Return `row ? { id: row.id, createdAt: toIsoTimestamp(row.createdAt) } : null` as today. Keep every inserted value exactly as it is (the parity test must stay green untouched).

- [ ] **Step 3: A total database budget in the intake**

The duplicate lookup is an optimization; the insert is the consent record. So the lookup gets at most 3 s, and the insert gets whatever remains of a 10 s total (at least 7 s).

Tests first, in `app/api/leads/route.test.ts` (fake timers for `setTimeout`, `clearTimeout` and `Date` only, restored in `afterEach`):
1. `findRecentDuplicate` never resolves, `createLead` resolves after 5 s (a fake-timer delay): `const pending = POST(req)`, `await vi.advanceTimersByTimeAsync(10_001)`, `await pending` gives 200; `createLead` was called (the lookup's hang did not starve the insert) and its result was used; `console.error` was called with a line containing `LEAD DEDUP LOOKUP FAILED`; running the captured callbacks calls the consumer email, the USHA post and the admin email once each.
2. `findRecentDuplicate` resolves null, `createLead` never resolves: 200 after the budget, `LEAD INSERT FAILED` logged, emails and USHA post still run once each.
3. Both never resolve: 200 no later than 10 s after the request (advance 10_001 ms; the response has settled), both failure lines logged, emails still run.
4. Both resolve quickly: no timer is left pending (`vi.getTimerCount()` is 0 after the response).

Then in `app/api/leads/route.ts`, next to the other constants:

```ts
// The longest the intake waits on the database before answering. After it the
// consumer still sees success and the emails still go out (Review Focus 1).
// Tradeoff: a database slower than this loses the stored row (the admin email
// still carries the lead; see docs/RUNBOOK.md for the restore). A late insert
// may still land, without its id for the background steps.
const LEAD_DB_BUDGET_MS = 10_000
// The duplicate lookup is only an optimization, so it may not starve the insert.
const DEDUP_LOOKUP_BUDGET_MS = 3_000

function withinBudget<T>(work: Promise<T>, deadline: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} ran past its database time budget`)),
      Math.max(0, deadline - Date.now()),
    )
  })
  return Promise.race([work, timeout]).finally(() => clearTimeout(timer))
}
```

Inside the `else` branch that runs when the store is configured, set `const startedAt = Date.now()` before the lookup, and wrap the two awaited calls: `await withinBudget(store.findRecentDuplicate(normalizedEmail, since), startedAt + DEDUP_LOOKUP_BUDGET_MS, "duplicate lookup")` and `await withinBudget(store.createLead({ ... }), startedAt + LEAD_DB_BUDGET_MS, "lead insert")`. The existing `catch` blocks and their log lines stay as they are.

Positive controls: (a) remove `withinBudget` from the lookup only; test 1 must FAIL (vitest timeout). Restore. (b) Give the lookup the full `LEAD_DB_BUDGET_MS` deadline instead of `DEDUP_LOOKUP_BUDGET_MS`; test 1 must FAIL (the 5 s insert no longer fits). Restore.

- [ ] **Step 4: Log an unstored lead as an error**

In `app/api/leads/route.ts`, replace `console.warn('Platform database not configured. Lead sent via email only.', { referenceNumber })` with `console.error('LEAD NOT STORED: platform database not configured; lead sent via email only.', { referenceNumber })`. Update the "not configured" route test to spy `console.error` and assert a call containing `LEAD NOT STORED`.

- [ ] **Step 5: TrustedForm claim as a server function**

Create `lib/trustedform/claim.test.ts` (`// @vitest-environment node`) first. Cases:
1. The scan phrases are in every live funnel: for `individual`, `family`, `cobra`, `ppo`, `self-employed`, each term of `TRUSTEDFORM_SCAN_TERMS` appears in `app/<funnel>/page.tsx` with whitespace collapsed (moved from the deleted route test).
2. With `TRUSTEDFORM_API_KEY` passed in `env` and `fetch` stubbed to a 201 JSON body `{ outcome: "success", warnings: [], scans: { required_found: [both terms], required_not_found: [] } }`: the request goes to `https://cert.trustedform.com/<id>` with method `POST`, a `Basic` authorization header for `API:<key>`, a JSON body with `reference`, `email`, `phone` and `required_scan_terms` equal to `TRUSTEDFORM_SCAN_TERMS`, and an `AbortSignal`; the result is `{ status: "claimed", outcome: "success", warnings: [], requiredFound: [both], requiredNotFound: [] }`.
3. Missing key: `{ status: "failed", reason: "TRUSTEDFORM_API_KEY is not set" }` and `fetch` not called.
4. A certificate URL with no usable id (`"https://cert.trustedform.com/"`): `failed`, `fetch` not called.
5. `fetch` resolves 404: `{ status: "failed", reason: "HTTP 404" }`.
6. `fetch` rejects with a `TimeoutError` DOMException: `failed` with a reason naming the timeout; never throws.
7. 201 with `outcome: "failure"` and `required_not_found: ["Reply STOP to opt out of SMS"]`: `claimed` with that outcome and list (the certificate is retained; the scan mismatch is reported, not hidden).
8. 201 with `warnings: ["email does not match: jane.doe@example.com", "phone 5551234567 not found", "string not found in snapshot"]`: the returned `warnings` contain neither the address nor the digit run (they read `[redacted email]` and `[redacted number]`), and the third warning is unchanged. TrustedForm writes these strings, so they are redacted before anything logs them.

Then create `lib/trustedform/claim.ts`:

```ts
// Claims a TrustedForm certificate (TCPA proof of consent) with Dynasty's key.
// Server only: called from the lead intake's background work. There is no
// public route for it, so nobody else can spend claims or read certificates.
const TRUSTEDFORM_API_BASE = "https://cert.trustedform.com"
const CLAIM_TIMEOUT_MS = 10_000

// Phrases TrustedForm must find on the page the consumer saw. Each appears
// verbatim in the approved consent text of every live funnel (pinned by
// lib/trustedform/claim.test.ts); keep them in step with counsel's text.
export const TRUSTEDFORM_SCAN_TERMS = [
  "consent to be contacted by Holy Impact Media",
  "Reply STOP to opt out of SMS",
] as const

export type ClaimInput = { certUrl: string; reference: string; email?: string | null; phone?: string | null }

export type ClaimResult =
  | { status: "claimed"; outcome: string | null; warnings: string[]; requiredFound: string[]; requiredNotFound: string[] }
  | { status: "failed"; reason: string }

// TrustedForm writes the warning text and may quote lead data in it; strip
// anything that looks like an email address or a phone number before it is
// returned (and therefore before anything logs it).
function redactWarning(warning: string): string {
  return warning
    .replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, "[redacted email]")
    .replace(/\+?\d[\d\s().-]{5,}\d/g, "[redacted number]")
}

function certIdFrom(certUrl: string): string | null {
  const last = certUrl.split(/[?#]/)[0].split("/").filter(Boolean).pop() ?? ""
  // Letters and digits only, so a crafted URL cannot reach any other TrustedForm path.
  return /^[A-Za-z0-9]+$/.test(last) ? last : null
}

export async function claimTrustedFormCertificate(
  input: ClaimInput,
  env: { TRUSTEDFORM_API_KEY?: string } = process.env,
): Promise<ClaimResult> {
  const apiKey = env.TRUSTEDFORM_API_KEY
  if (!apiKey) return { status: "failed", reason: "TRUSTEDFORM_API_KEY is not set" }
  const certId = certIdFrom(input.certUrl)
  if (!certId) return { status: "failed", reason: "certificate URL has no certificate id" }

  const body: Record<string, unknown> = { reference: input.reference, required_scan_terms: TRUSTEDFORM_SCAN_TERMS }
  if (input.email) body.email = input.email
  if (input.phone) body.phone = input.phone

  try {
    const response = await fetch(`${TRUSTEDFORM_API_BASE}/${certId}`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`API:${apiKey}`).toString("base64")}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(CLAIM_TIMEOUT_MS),
    })
    if (!response.ok) return { status: "failed", reason: `HTTP ${response.status}` }
    const data = (await response.json()) as {
      outcome?: string
      warnings?: string[]
      scans?: { required_found?: string[]; required_not_found?: string[] }
    }
    return {
      status: "claimed",
      outcome: data.outcome ?? null,
      warnings: (data.warnings ?? []).map(redactWarning),
      requiredFound: data.scans?.required_found ?? [],
      requiredNotFound: data.scans?.required_not_found ?? [],
    }
  } catch (error) {
    const name = error instanceof Error ? error.name : "Error"
    return { status: "failed", reason: name === "TimeoutError" ? `timed out after ${CLAIM_TIMEOUT_MS} ms` : `${name}: request failed` }
  }
}
```

- [ ] **Step 6: The intake calls it directly and logs the outcome**

Tests first, rewrite `app/api/leads/route.trustedform.test.ts` to mock `@/lib/trustedform/claim` (`claimTrustedFormCertificate` as a hoisted `vi.fn`) instead of stubbing `fetch`:
1. Called once with `{ certUrl, reference: <response referenceNumber>, email: "a@b.com", phone: "5550100" }`.
2. `claimed` + `outcome: "success"` + empty `requiredNotFound`: a `console.log` line containing `TRUSTEDFORM CLAIM OK`, no error log.
3. `claimed` + `outcome: "failure"` + one phrase not found: a `console.error` line containing `TRUSTEDFORM SCAN MISMATCH`, carrying the missing phrase and the warnings.
4. `failed`: a `console.error` line containing `TRUSTEDFORM CLAIM FAILED` with the reason; the consumer email and the admin email still run once each.
5. The mock rejects (defensive): `TRUSTEDFORM CLAIM FAILED` logged and the emails still run.
6. No certificate URL in the body: not called.
No log line may contain the consumer's email or phone (assert on the logged arguments).

Then in `app/api/leads/route.ts` replace the step 1 block inside `after()` (the self-fetch, from `if (trustedFormCertUrl) {` through its closing brace) with:

```ts
      // 1. Claim the TrustedForm certificate (TCPA compliance evidence). An
      //    unclaimed certificate expires, so failures are logged loudly, and a
      //    claimed certificate whose consent phrases were not found is reported
      //    too (TrustedForm keeps it, but the evidence is weaker).
      if (trustedFormCertUrl) {
        try {
          const claim = await claimTrustedFormCertificate({
            certUrl: trustedFormCertUrl,
            reference: referenceNumber,
            email: normalizedEmail,
            phone,
          })
          if (claim.status === "failed") {
            console.error('TRUSTEDFORM CLAIM FAILED:', claim.reason, { referenceNumber })
          } else if (claim.outcome !== 'success' || claim.requiredNotFound.length > 0) {
            console.error('TRUSTEDFORM SCAN MISMATCH:', {
              referenceNumber,
              outcome: claim.outcome,
              requiredNotFound: claim.requiredNotFound,
              warnings: claim.warnings,
            })
          } else {
            console.log('TRUSTEDFORM CLAIM OK:', { referenceNumber, requiredFound: claim.requiredFound })
          }
        } catch (err) {
          console.error('TRUSTEDFORM CLAIM FAILED:', err instanceof Error ? err.message : 'unknown error', { referenceNumber })
        }
      }
```

Import `claimTrustedFormCertificate` from `@/lib/trustedform/claim`. Delete the `TRUSTEDFORM_CLAIM_TIMEOUT_MS` constant (the timeout now lives in the claim function).

Positive control: change `TRUSTEDFORM_SCAN_TERMS[1]` to `"I agree to the terms"`; claim test 1 must FAIL naming a funnel. Restore.

- [ ] **Step 7: Remove the public claim route and its dead client hook**

First, a read-only look for outside callers (the route is public on production today): the controller searches the production project's Vercel runtime logs, as far back as retention allows, for requests to `/api/trustedform/claim` (Vercel MCP `get_runtime_logs` or the dashboard's log search). Any request that the leads route did not make (another user agent or origin, or a `GET ?certId=`) means an outside caller exists: stop and ask the owner before deleting. Record the log window actually searched in `docs/build-log.md`. A short window proves little on its own; the deletion rests on there being no caller in this repo (the only one, `lib/hooks/useTrustedForm.ts`, has no importers) and no documented integration.

```bash
git rm app/api/trustedform/claim/route.ts app/api/trustedform/claim/route.test.ts lib/hooks/useTrustedForm.ts
grep -rn "trustedform/claim\|useTrustedForm" app lib components || echo "no references left"
```

Expected: `no references left` (docs are updated in Step 9).

- [ ] **Step 8: Pin the expired-link page (Review Focus 5)**

Create `app/auth/reset-password/page.test.tsx` with Testing Library (jsdom). Mock `next/navigation` (`useSearchParams` from a per-test `URLSearchParams`, `useRouter` with a `push` spy) and `@/lib/auth/client` (`authClient.resetPassword` as a `vi.fn`). Mock `next/image` to a plain `img` if it fails under jsdom. Cases:
1. No token: "This reset link is invalid or expired." and a "Request a new link" link to `/auth/forgot-password`; no password field.
2. `?token=x&error=INVALID_TOKEN`: same.
3. `?token=x`, type a password, submit, `resetPassword` resolves `{ error: { code: "INVALID_TOKEN", message: "Invalid token" } }`: the invalid-link panel with "Request a new link" replaces the form.
4. `?token=x`, submit, `resetPassword` rejects: "Could not reach the server. Check your connection and try again." and the submit button is enabled again.
5. `?token=x`, submit, `resetPassword` resolves `{ data: {}, error: null }`: `push` called with `/auth/login`.

Positive control: in the page, remove `|| tokenRejected` from `linkInvalid`; case 3 must FAIL. Restore.

- [ ] **Step 9: Docs**

- `docs/RUNBOOK.md`, "TrustedForm claims": the claim runs inside the intake's background work through `lib/trustedform/claim.ts` (no public route); search the Vercel runtime logs for `TRUSTEDFORM CLAIM FAILED` (not claimed: expires) and `TRUSTEDFORM SCAN MISMATCH` (claimed, but a consent phrase was not found on the page snapshot); `TRUSTEDFORM CLAIM OK` lists the phrases found. Drop the sentence about the route not gating on `outcome`.
- `docs/RUNBOOK.md`, "Lead intake when the database is down": the unconfigured line is now `LEAD NOT STORED`; the intake waits at most 10 s on the database before answering (the duplicate lookup at most 3 s of it); each query is capped at 8 s (which also bounds dashboard CSV export and sign-in queries); one retry on a dropped connection. State the tradeoff: a database slower than the budget can leave a lead unstored while its emails still go out, and the restore is the owner-approved SQL above.
- `docs/RUNBOOK.md`: one sentence that these log lines live only as long as the Vercel plan's runtime-log retention, so read them promptly or keep a log drain.
- `docs/PIPELINE.md`: the TrustedForm stage calls `claimTrustedFormCertificate` directly (no self-fetch); remove the Deployment Protection note.
- `docs/SECURITY.md`: if it lists `/api/trustedform/claim`, remove it; add one line: TrustedForm claims run server side only.
- Grep `docs/` once for `trustedform/claim` and fix any other mention.

- [ ] **Step 10: Mechanical checks and commit**

```bash
pnpm exec tsc --noEmit && pnpm test && pnpm lint && pnpm check:guards && pnpm build
git add lib/db lib/data lib/trustedform app/api/leads app/auth/reset-password docs/RUNBOOK.md docs/PIPELINE.md docs/SECURITY.md
git commit -m "fix(leads): database budget, one retry on a dropped connection, private TrustedForm claim with logged outcome; pin the expired-link page"
```

(The three `git rm` deletions from Step 7 are already staged.)
