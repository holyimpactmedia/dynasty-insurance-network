# Task 13: Meta tracking, off by default (HARD STOP: legal)

Part of [docs/plan.md](../../../plan.md). Read its Global Constraints first.

**Preconditions (all three, or this task does not start):**
1. Task 12 is live and stable.
2. The legal branch (`legal/dynasty-compliance`) has landed on `main` and this branch is rebased on it (the funnel files differ between the two; wiring them before legal lands would mean doing it twice).
3. The owner approved, in chat, the copy-guard amendment below (Option A). Option B is the alternative if the owner wants the funnel files left byte-identical.

**Goal:** Meta Pixel and Conversions API code that ships switched off. Nothing loads and nothing is sent to Meta unless `META_TRACKING_APPROVED` is exactly `"true"`, which is not set anywhere until legal answers the open question in counsel's coverage doc (what is sent: hashed email, phone, name and country; IP address and browser user agent unhashed; Meta cookies `fbp` and `fbc`; the page URL; the pixel also reports page views with URLs including UTM and click-ID parameters). The privacy policy is not edited here.

**Files:**
- Create (copy verbatim): `lib/meta/hash.ts`, `lib/meta/meta.test.ts`
- Create (copy, then edit): `lib/meta/pixel-client.ts`, `lib/meta/capi.ts`, `components/meta/MetaPixel.tsx`
- Create (new): `lib/meta/config.ts`, `lib/meta/kill-switch.test.ts`
- Modify: `app/api/leads/route.ts`, `app/api/leads/route.test.ts`, `app/layout.tsx` (two allowed lines), the five live funnel pages (four allowed lines each), `scripts/check-guards.mjs` (allow-list), `.env.example`

**Interfaces:**
- Produces: `isMetaTrackingApproved(env?)`, `getMetaPixelId(env?)`, `getCapiConfig(env?)` from `@/lib/meta/config`; `prepareMetaLead(): MetaLeadHandle`, `fireMetaLead(handle)` from `@/lib/meta/pixel-client`; `readMetaPayload(raw)`, `sendMetaLeadEvent(input)` from `@/lib/meta/capi`; `/api/leads` accepts an optional `meta` object and its duplicate response adds `duplicate: true`.

**Option A (recommended) vs Option B (named tradeoff):** A adds four lines to each funnel page (import, prepare, send, fire after a successful non-duplicate response). It is explicit and testable, but legal-reviewed files change in code (no visible text changes). B leaves funnel files byte-identical: a small client component, rendered only when approved, wraps `window.fetch` for `POST /api/leads`, injects the `meta` payload and fires the pixel on success. B keeps the guard unchanged but patches a global, which is hidden coupling and harder to reason about. The steps below implement A.

- [ ] **Step 1: Kill-switch test first**

```bash
mkdir -p lib/meta components/meta
git show origin/redesign/union-private-healthcare:lib/meta/hash.ts > lib/meta/hash.ts
git show origin/redesign/union-private-healthcare:lib/meta/meta.test.ts > lib/meta/meta.test.ts
git show origin/redesign/union-private-healthcare:lib/meta/capi.ts > lib/meta/capi.ts
git show origin/redesign/union-private-healthcare:lib/meta/pixel-client.ts > lib/meta/pixel-client.ts
git show origin/redesign/union-private-healthcare:lib/meta/config.ts > lib/meta/config.ts
git show origin/redesign/union-private-healthcare:components/meta/MetaPixel.tsx > components/meta/MetaPixel.tsx
```

Create `lib/meta/kill-switch.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest"
import { getCapiConfig, getMetaPixelId, isMetaTrackingApproved } from "./config"
import { sendMetaLeadEvent } from "./capi"
import { MetaPixel } from "@/components/meta/MetaPixel"

// Fake values: a deployment that has Meta configured but not approved.
const PIXEL = "123456789012345"
const configured = { NEXT_PUBLIC_META_PIXEL_ID: PIXEL, META_CAPI_ACCESS_TOKEN: "test-token-not-real" }

function stubConfigured(approval: string) {
  vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", PIXEL)
  vi.stubEnv("META_CAPI_ACCESS_TOKEN", "test-token-not-real")
  vi.stubEnv("META_TRACKING_APPROVED", approval)
}

describe("Meta legal kill switch", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it("stays off when pixel id and token are set but approval is missing", () => {
    expect(isMetaTrackingApproved(configured)).toBe(false)
    expect(getMetaPixelId(configured)).toBe("")
    expect(getCapiConfig(configured).enabled).toBe(false)
  })

  it.each(["TRUE", "True", "1", "yes", "on", " true", "true "])("treats %j as not approved", (flag) => {
    expect(getCapiConfig({ ...configured, META_TRACKING_APPROVED: flag }).enabled).toBe(false)
  })

  it("turns on only with the exact flag plus both Meta variables", () => {
    const approved = { ...configured, META_TRACKING_APPROVED: "true" }
    expect(getMetaPixelId(approved)).toBe(PIXEL)
    expect(getCapiConfig(approved).enabled).toBe(true)
    expect(getCapiConfig({ META_TRACKING_APPROVED: "true", NEXT_PUBLIC_META_PIXEL_ID: PIXEL }).enabled).toBe(false)
  })

  it("refuses a pixel id that is not a plain number", () => {
    expect(getMetaPixelId({ META_TRACKING_APPROVED: "true", NEXT_PUBLIC_META_PIXEL_ID: "1');alert(1);//" })).toBe("")
  })

  it("renders no pixel without approval, even when configured", () => {
    stubConfigured("")
    expect(MetaPixel()).toBeNull()
  })

  it("never calls Meta without approval, even when configured", async () => {
    stubConfigured("")
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
    await sendMetaLeadEvent({ eventId: "e1", email: "jane@example.com" })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  // Positive control: proves the two "off" assertions above can fail.
  it("renders the pixel and calls Meta once approved", async () => {
    stubConfigured("true")
    expect(MetaPixel()).not.toBeNull()
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)
    await sendMetaLeadEvent({ eventId: "e1", email: "jane@example.com" })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(String(fetchMock.mock.calls[0][0])).not.toContain("test-token-not-real")
  })
})
```

Run `pnpm vitest run lib/meta`. Expected: the kill-switch file FAILS (functions missing; the copied config turns on whenever pixel id and token exist).

- [ ] **Step 2: Config with the legal gate**

Replace `lib/meta/config.ts` entirely with:

```ts
// Meta (Facebook) Pixel + Conversions API config.
//
// LEGAL GATE: tracking is OFF unless META_TRACKING_APPROVED is exactly "true".
// The Pixel ID and CAPI token alone never turn anything on. Do not set the flag
// in any environment until legal approves Meta tracking. Changing it needs a redeploy.
//
//   META_TRACKING_APPROVED     server only; exactly "true" enables tracking
//   NEXT_PUBLIC_META_PIXEL_ID  public dataset (pixel) id, digits only
//   META_CAPI_ACCESS_TOKEN     SECRET, server only, never exposed to the browser
//   META_CAPI_TEST_EVENT_CODE  optional, routes events to Meta's Test Events tool
//   META_GRAPH_VERSION         optional, defaults to v25.0

export interface MetaEnv {
  META_TRACKING_APPROVED?: string
  NEXT_PUBLIC_META_PIXEL_ID?: string
  META_CAPI_ACCESS_TOKEN?: string
  META_CAPI_TEST_EVENT_CODE?: string
  META_GRAPH_VERSION?: string
}

// Read lazily so nothing is frozen at import time and tests can stub the env.
function readMetaEnv(): MetaEnv {
  return {
    META_TRACKING_APPROVED: process.env.META_TRACKING_APPROVED,
    NEXT_PUBLIC_META_PIXEL_ID: process.env.NEXT_PUBLIC_META_PIXEL_ID,
    META_CAPI_ACCESS_TOKEN: process.env.META_CAPI_ACCESS_TOKEN,
    META_CAPI_TEST_EVENT_CODE: process.env.META_CAPI_TEST_EVENT_CODE,
    META_GRAPH_VERSION: process.env.META_GRAPH_VERSION,
  }
}

export function isMetaTrackingApproved(env: MetaEnv = readMetaEnv()): boolean {
  return env.META_TRACKING_APPROVED === "true"
}

/** Pixel id to load, or "" when tracking is not approved or the id is not a plain number. */
export function getMetaPixelId(env: MetaEnv = readMetaEnv()): string {
  if (!isMetaTrackingApproved(env)) return ""
  const id = (env.NEXT_PUBLIC_META_PIXEL_ID || "").trim()
  return /^\d{5,20}$/.test(id) ? id : ""
}

// Server-only. Do not import where the returned token could reach the client.
export function getCapiConfig(env: MetaEnv = readMetaEnv()) {
  const pixelId = getMetaPixelId(env)
  const token = (env.META_CAPI_ACCESS_TOKEN || "").trim()
  const version = (env.META_GRAPH_VERSION || "v25.0").trim()
  const testEventCode = (env.META_CAPI_TEST_EVENT_CODE || "").trim()
  return {
    enabled: pixelId.length > 0 && token.length > 0,
    pixelId,
    token,
    version,
    testEventCode: testEventCode || undefined,
  }
}
```

In `components/meta/MetaPixel.tsx`, replace `import { META_PIXEL_ID } from "@/lib/meta/config"` with `import { getMetaPixelId } from "@/lib/meta/config"`; replace `  if (!META_PIXEL_ID) return null` with:

```tsx
  const pixelId = getMetaPixelId()
  if (!pixelId) return null
```

and replace both `${META_PIXEL_ID}` occurrences with `${pixelId}`. Replace the comment `// NEXT_PUBLIC_META_PIXEL_ID is unset, so the site stays inert until configured.` with `// tracking is not legally approved (lib/meta/config.ts), whatever else is set.`

If `lib/meta/meta.test.ts` imports `META_PIXEL_ID` or `isPixelConfigured`, change those assertions to `getMetaPixelId()` with an explicit env object.

Run `pnpm vitest run lib/meta`. Expected: all PASS.

- [ ] **Step 3: Lead-event helpers**

Append to `lib/meta/pixel-client.ts`:

```ts
export interface MetaLeadHandle {
  eventId: string
  payload: { eventId: string; fbp?: string; fbc?: string; eventSourceUrl?: string }
}

/** Call once per submit, before fetch("/api/leads"); send `payload` as body.meta. */
export function prepareMetaLead(): MetaLeadHandle {
  const eventId = newEventId()
  const { fbp, fbc } = getFbIdentifiers()
  const eventSourceUrl = typeof window !== "undefined" ? window.location.href : undefined
  return { eventId, payload: { eventId, fbp, fbc, eventSourceUrl } }
}

/** Call only after /api/leads accepted a new lead. No-op while the pixel is off. */
export function fireMetaLead(handle: MetaLeadHandle): void {
  metaTrack("Lead", {}, handle.eventId)
}
```

Append to `lib/meta/capi.ts`:

```ts
/** Untrusted `meta` object from the browser: keep short strings only. */
export function readMetaPayload(raw: unknown): { eventId?: string; fbp?: string; fbc?: string; eventSourceUrl?: string } {
  if (!raw || typeof raw !== "object") return {}
  const r = raw as Record<string, unknown>
  const pick = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined)
  return { eventId: pick(r.eventId, 100), fbp: pick(r.fbp, 200), fbc: pick(r.fbc, 500), eventSourceUrl: pick(r.eventSourceUrl, 2000) }
}
```

- [ ] **Step 4: Server event in the intake route (tests first)**

In `app/api/leads/route.test.ts`, replace the existing `vi.mock("next/server", ...)` block with the capturing version and add the other mocks:

```ts
const meta = vi.hoisted(() => ({ callbacks: [] as Array<() => Promise<void>>, sent: [] as unknown[] }))
vi.mock("next/server", async (orig) => ({
  ...(await orig<typeof import("next/server")>()),
  after: vi.fn((cb: () => Promise<void>) => {
    meta.callbacks.push(cb)
  }),
}))
vi.mock("@/lib/meta/capi", async (orig) => ({
  ...(await orig<typeof import("@/lib/meta/capi")>()),
  sendMetaLeadEvent: vi.fn(async (i: unknown) => {
    meta.sent.push(i)
  }),
}))
vi.mock("@/lib/email/sendLeadConfirmation", () => ({ sendLeadConfirmation: vi.fn() }))
vi.mock("@/lib/email/notifyAdmin", () => ({ notifyAdmin: vi.fn() }))
vi.mock("@/lib/usha/postLead", () => ({ postLeadToUsha: vi.fn() }))
vi.mock("@/lib/ai/scoreLeadWithAI", () => ({ scoreAndUpdateLead: vi.fn() }))
```

In its `beforeEach`, add `meta.callbacks = []` and `meta.sent = []`. Add these tests inside the `describe`:

```ts
  it("passes the browser event id to the server Lead event", async () => {
    await POST(makeReq({ ...validLead, meta: { eventId: "evt-123", fbp: "fb.1.1.1" } }, "5.5.5.5"))
    for (const cb of meta.callbacks) await cb()
    expect(meta.sent).toEqual([expect.objectContaining({ eventId: "evt-123", fbp: "fb.1.1.1", email: "a@b.com" })])
  })

  it("flags a duplicate and sends no Lead event", async () => {
    state.duplicateReference = "HL-EXISTING"
    const res = await POST(makeReq({ ...validLead, meta: { eventId: "evt-dup" } }, "6.6.6.6"))
    expect((await res.json()).duplicate).toBe(true)
    for (const cb of meta.callbacks) await cb()
    expect(meta.sent).toEqual([])
  })
```

Run: FAIL. Then in `app/api/leads/route.ts`:
- Add `import { readMetaPayload, sendMetaLeadEvent } from '@/lib/meta/capi'` after the `checkRateLimit` import.
- In the body destructure, add `      meta,` after `      quizAnswers,`.
- After the `ipAddress` line, add `    const userAgent = request.headers.get('user-agent')`.
- In the duplicate response, add `          duplicate: true,` after `          message: 'Lead already received',`.
- Inside `after()`, after the AI-scoring try/catch, add:

```ts
      // 5. Meta Conversions API "Lead". Legal-gated in lib/meta/config.ts (no-op unless
      //    META_TRACKING_APPROVED is "true"). Shares event_id with the browser Pixel.
      try {
        const clientMeta = readMetaPayload(meta)
        await sendMetaLeadEvent({
          eventId: clientMeta.eventId || `srv-${referenceNumber}`,
          eventSourceUrl: clientMeta.eventSourceUrl || request.headers.get('referer'),
          firstName,
          lastName,
          email: normalizedEmail,
          phone,
          zip: null, // Dynasty funnels collect state, not ZIP
          fbp: clientMeta.fbp ?? null,
          fbc: clientMeta.fbc ?? null,
          clientIp: ipAddress,
          userAgent,
        })
      } catch (err) {
        console.error('Meta CAPI error:', err)
      }
```

Run `pnpm vitest run app/api/leads`: all PASS (parity tests unchanged).

- [ ] **Step 5: Guard amendment (exactly the approved lines)**

In `scripts/check-guards.mjs`, replace `const ALLOWED_ADDITIONS = {}` with:

```js
const META_FUNNEL_LINES = [
  /^\+\s*import \{ prepareMetaLead, fireMetaLead \} from "@\/lib\/meta\/pixel-client"$/,
  /^\+\s*const metaLead = prepareMetaLead\(\)$/,
  /^\+\s*meta: metaLead\.payload,$/,
  /^\+\s*if \(!data\.duplicate\) fireMetaLead\(metaLead\)$/,
]
// Owner-approved amendment (Task 13, Option A). Added lines only; removals never allowed.
const ALLOWED_ADDITIONS = {
  "app/layout.tsx": [
    /^\+\s*import \{ MetaPixel \} from "@\/components\/meta\/MetaPixel"$/,
    /^\+\s*<MetaPixel \/>$/,
  ],
  "app/individual/page.tsx": META_FUNNEL_LINES,
  "app/family/page.tsx": META_FUNNEL_LINES,
  "app/cobra/page.tsx": META_FUNNEL_LINES,
  "app/ppo/page.tsx": META_FUNNEL_LINES,
  "app/self-employed/page.tsx": META_FUNNEL_LINES,
}
```

- [ ] **Step 6: Wire the pixel and the five live funnels**

In `app/layout.tsx`: add `import { MetaPixel } from "@/components/meta/MetaPixel"` after the last import, and `<MetaPixel />` on its own line right after `<Analytics />`.

In each of `app/individual/page.tsx`, `app/family/page.tsx`, `app/cobra/page.tsx`, `app/ppo/page.tsx`, `app/self-employed/page.tsx`, inside the submit handler that posts to `/api/leads`:
1. After the file's last `import` line, add `import { prepareMetaLead, fireMetaLead } from "@/lib/meta/pixel-client"`.
2. On the line after `const urlParams = new URLSearchParams(window.location.search)`, add `const metaLead = prepareMetaLead()`.
3. Inside the `JSON.stringify({ ... })` body, on the line after the `utmCampaign: urlParams.get(...)` entry, add `meta: metaLead.payload,`.
4. After the statement that throws when `!response.ok` (a one-line `if` in most funnels; a three-line `if { throw }` block in individual), add `if (!data.duplicate) fireMetaLead(metaLead)`.

Match each file's existing indentation. Change nothing else.

- [ ] **Step 7: Prove the guard still bites**

```bash
pnpm check:guards
```

Expected: pass. Then append any other line to `app/cobra/page.tsx` (for example `// probe`), run again: must FAIL; restore.

- [ ] **Step 8: Env example**

Append to `.env.example`:

```bash
# Meta Pixel + Conversions API. OFF until legal approves.
# The pixel id and token alone never enable tracking; only META_TRACKING_APPROVED=true does.
META_TRACKING_APPROVED=false
NEXT_PUBLIC_META_PIXEL_ID=
META_CAPI_ACCESS_TOKEN=
META_CAPI_TEST_EVENT_CODE=
META_GRAPH_VERSION=
```

- [ ] **Step 9: Mechanical checks, browser check, commit**

```bash
pnpm exec tsc --noEmit && pnpm test && pnpm lint && pnpm check:guards && pnpm build
```

With the dev server, open a funnel and confirm in the network panel that no request goes to `connect.facebook.net` or `graph.facebook.com` (flag unset). Then:

```bash
git add lib/meta components/meta app/api/leads app/layout.tsx app/individual/page.tsx app/family/page.tsx app/cobra/page.tsx app/ppo/page.tsx app/self-employed/page.tsx scripts/check-guards.mjs .env.example
git commit -m "feat(meta): pixel and CAPI behind a legal kill switch (off unless META_TRACKING_APPROVED=true)"
```

Enabling (setting `META_TRACKING_APPROVED=true` plus the Meta variables in Vercel production) is a separate owner decision after legal approves, together with any privacy-policy wording legal provides.
