# Dynasty: Engineering Docs

Master index. **This file is an index only: every fact lives in exactly one sub-doc below.** When something changes, update the sub-doc the change belongs in, not this page. Each sub-doc carries a "Source of truth" line pointing at the code or migration it documents.

| Doc | What it covers |
|---|---|
| [PIPELINE.md](./PIPELINE.md) | The lead pass-through flow: funnel → `/api/leads` → `after()` work (TCPA / TrustedForm / AI scoring / USHA) → marketplace. What each stage does, where it lives, and what's deferred. |
| [SCHEMA.md](./SCHEMA.md) | The database: tables, columns, auth tables, aggregates, and the Drizzle migration workflow. |
| [SECURITY.md](./SECURITY.md) | Better Auth accounts and roles, the fail-closed setup check, where each gate runs (proxy, layout, pages, admin APIs), sessions, invites and password resets, the `redirectTo` guard, the unsubscribe page, CSV-injection note, rate limiting. |
| [RUNBOOK.md](./RUNBOOK.md) | Operations: env vars, Neon branches, schema changes, giving someone dashboard access, the `/api/health` check, lead intake when the database is down, TrustedForm and USHA alerts, common failures. |

## How the application is built

A Next.js 16 / React 19 application on Neon Postgres with Better Auth. It is a **lead pass-through tracker**, not a CRM. Consumer funnels capture insurance leads; TCPA consent and the TrustedForm certificate are recorded, the lead is AI-scored, and it is forwarded to the USHA Marketplace for agents to buy. The admin dashboard tracks each lead through that pipeline and shows the money (leads sent × sell price).

The codebase shipped in five PR-sized changes:

1. **PR0**: Build integrity (removed `ignoreBuildErrors`, added Vitest).
2. **PR1**: Schema + authorization + closed the open mutation routes ([SCHEMA.md](./SCHEMA.md), [SECURITY.md](./SECURITY.md)).
3. **PR2**: Reliable intake: `after()`, rate limit + dedup, USHA hardened stub ([PIPELINE.md](./PIPELINE.md)).
4. **PR3**: Dashboard data layer: TZ-correct, paginated, SQL-aggregated, CSV-safe.
5. **PR4**: These docs.

A later change moved the database and sign-in to Neon Postgres (Drizzle) and Better Auth; the plan is in [plan.md](./plan.md) and the history in [build-log.md](./build-log.md).

Last updated: 2026-10-09.
