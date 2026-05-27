# Dynasty — Engineering Docs

Master index. **This file is an index only — every fact lives in exactly one sub-doc below.** When something changes, update the sub-doc the change belongs in, not this page. Each sub-doc carries a "Source of truth" line pointing at the code or migration it documents.

| Doc | What it covers |
|---|---|
| [PIPELINE.md](./PIPELINE.md) | The lead pass-through flow — funnel → `/api/leads` → `after()` work (TCPA / TrustedForm / AI scoring / USHA) → marketplace. What each stage does, where it lives, and what's deferred. |
| [SCHEMA.md](./SCHEMA.md) | The database — tables, columns, indexes, RPCs, RLS, and the Supabase CLI migration workflow. |
| [SECURITY.md](./SECURITY.md) | Authorization model (`profiles` + `is_admin`), the RLS policy matrix, why `user_metadata` is not trusted, first-admin seeding, the `redirectTo` guard, rate limiting, CSV-injection note. |
| [RUNBOOK.md](./RUNBOOK.md) | Operations — env vars, deploy order, applying migrations, the `/api/health` check, promoting an admin, USHA failure alerts, common failures. |

## How the application is built

A Next.js 16 / React 19 / Supabase application. It is a **lead pass-through tracker** — not a CRM. Consumer funnels capture insurance leads → TCPA consent + TrustedForm cert are recorded → the lead is AI-scored → it is forwarded to the USHA Marketplace for agents to buy. The admin dashboard tracks each lead through that pipeline and shows the money (leads sent × sell price).

The codebase ships in five PR-sized changes documented in [`.claude/plans/lets-make-a-plan-transient-aurora.md`](../.claude/plans/lets-make-a-plan-transient-aurora.md):

1. **PR0** — Build integrity (removed `ignoreBuildErrors`, added Vitest).
2. **PR1** — Schema + authorization + closed the open mutation routes ([SCHEMA.md](./SCHEMA.md), [SECURITY.md](./SECURITY.md)).
3. **PR2** — Reliable intake: `after()`, rate limit + dedup, USHA hardened stub ([PIPELINE.md](./PIPELINE.md)).
4. **PR3** — Dashboard data layer: TZ-correct, paginated, RPC-backed, CSV-safe.
5. **PR4** — These docs.

Last updated: 2026-05-19.
