# Lead Pass-Through Pipeline

Source of truth: [`app/api/leads/route.ts`](../app/api/leads/route.ts) and the modules it calls.

A lead crosses the system in five stages. Stage 1 (intake) blocks the response; stages 2–5 run in `after()` so they complete reliably on Vercel without holding the user's form open.

```
┌──────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│ Consumer     │    │  /api/leads      │    │  after() background │
│ funnel page  │───▶│  validates       │───▶│  - TrustedForm      │
│ (POST JSON)  │    │  rate-limits     │    │  - confirmation     │
└──────────────┘    │  dedups by email │    │  - USHA marketplace │
                    │  inserts row     │    │  - admin notify     │
                    │  returns 200     │    │  - AI score         │
                    └──────────────────┘    └─────────────────────┘
```

## Stage 1 — Intake (synchronous)

[`app/api/leads/route.ts`](../app/api/leads/route.ts)

| Step | Behavior |
|---|---|
| Validate required fields | `firstName`, `lastName`, `email` → 400 if missing |
| TCPA consent | must be `true` → 400 otherwise |
| Rate limit per IP | [`lib/rate-limit.ts`](../lib/rate-limit.ts) — in-memory sliding window, default 8 / 10 min → 429 on burst |
| Duplicate email dedup | repeat email within 10 min → idempotent 200 with the existing `reference_number`, no re-spend on AI/USHA/email |
| Insert lead row | service-role client; persists every field the funnels send, including `quiz_answers` |
| Schedule post-response work | `after(async () => { … })` — runs after the 200 is flushed |

The response returns within tens of milliseconds. The funnel's "thank you" page never waits on AI scoring or USHA.

## Stage 2 — TrustedForm certificate claim

`POST` to [`/api/trustedform/claim`](../app/api/trustedform/claim/route.ts) with the cert URL. TCPA evidence. Self-fetch from `after()` is fine — `claim` is a separate function invocation.

## Stage 3 — Confirmation email

[`lib/email/sendLeadConfirmation.ts`](../lib/email/sendLeadConfirmation.ts) — Resend. CAN-SPAM compliant footer (unsubscribe link + physical address). Required env: `RESEND_API_KEY`, optional `RESEND_FROM_EMAIL` / `UNSUBSCRIBE_EMAIL` / `HOLY_IMPACT_MAILING_ADDRESS`.

## Stage 4 — USHA Marketplace post

[`lib/usha/postLead.ts`](../lib/usha/postLead.ts) — hardened, feature-flagged stub:

| Behavior | Detail |
|---|---|
| Feature flag | requires `USHA_ENABLED=true` **and** both `USHA_API_URL` + `USHA_API_KEY`; otherwise the lead is marked `usha_status='pending'` (visible in the dashboard) and the post is skipped |
| Retry | 3 attempts total (1 + 2 retries) with linear backoff on HTTP 429 / 5xx / network errors |
| Status writeback | on success: `usha_status='sent'`, `usha_sent_at`, `usha_lead_id`; on terminal failure: `usha_status='failed'` |
| Admin alert | the admin notification email always includes the `ushaResult`, so a `failed` status surfaces in the inbox |
| **Deferred** | the request body's field mapping and auth header format (`TODO`s in the file) — fill in once the LeadArena API spec is available |

## Stage 5 — Admin notification + AI scoring

| Step | Detail |
|---|---|
| Admin notification email | [`lib/email/notifyAdmin.ts`](../lib/email/notifyAdmin.ts) — rich HTML with full lead data + AI score + USHA result; sent to `ADMIN_EMAIL` |
| AI score | [`lib/ai/scoreLeadWithAI.ts`](../lib/ai/scoreLeadWithAI.ts) — Claude scores the lead 0–100, writes `ai_score`, `ai_score_reasons`, `predicted_close_rate`, `ai_scored_at` back onto the row. The dashboard's AI badge reads these directly. |

## Why `after()` and not `Promise.then(...)`

On Vercel serverless, work scheduled via `.then(...)` after a response is sent races a function that may be frozen or terminated. `after()` ([Next.js docs](https://nextjs.org/docs/app/api-reference/functions/after)) declares that work explicitly so the platform keeps the function alive long enough to finish. If USHA throughput or delivery guarantees ever exceed the `after()` time budget, the documented upgrade path is a Vercel Queue or Workflow.

## Dashboard timeline

The pipeline state is visible in the [`LeadDetailDrawer`](../components/dashboard/LeadDetailDrawer.tsx) for any lead:

- `created_at` — received
- `tcpa_consent_at` — TCPA recorded
- `ai_scored_at` — Claude finished scoring
- `usha_sent_at` + `usha_status` — marketplace state
