# Dynasty on Neon: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan slice by slice. Each checkbox below is one slice; its steps live in the linked task file and use `- [ ]` syntax there.

**Premise:** production cannot store leads, TCPA consent records, or let anyone log in, because the Supabase project behind it is unreachable.
**Observed:** 2026-10-05 and 2026-10-06: `https://www.dynastyinsurancenetwork.com/api/health` returns `503 leads_table_unreachable`; the Supabase host no longer resolves.

**Goal:** Move the live Dynasty site from Supabase to Neon (Postgres + Better Auth + Drizzle) by porting the finished backend from the redesign branch, keeping every Dynasty page, color and legal-reviewed word as it is.

**Architecture:** One data seam (`lib/data/store.ts` returning a Neon-backed `PlatformStore`) replaces every Supabase query; Better Auth (self-hosted, email + password, admin plugin roles) replaces Supabase Auth; the dashboard reads through role-checked `/api/admin/*` routes with polling instead of browser queries and Realtime. A `lib/platform/provider.ts` check fails closed: a deployed site missing its secret or database shows the setup screen and refuses all sign-ins.

**Tech Stack:** Next.js 16.0.10 (App Router), React 19, TypeScript, pnpm 10.17.1, Neon Postgres via `pg` 8.22.0 + `drizzle-orm` 0.45.2, `better-auth` 1.6.33 + `@better-auth/drizzle-adapter` 1.6.33, Resend, vitest 4.

**Spec:** [`docs/superpowers/specs/2026-10-05-dynasty-neon-design.md`](superpowers/specs/2026-10-05-dynasty-neon-design.md) (owner-approved 2026-10-06). Executors read the spec and their task file.

**Gate status:** written 2026-10-06; `/pressure-test` and `/senior-review` pending; owner approval pending. Nothing builds until the owner approves this plan.

## Global Constraints

Every task's requirements implicitly include these.

- **Brand:** Dynasty only. No visible "Union" string, no `components/union`, no `unionprivatehealthcare`, no Union design tokens (`text-navy`, `bg-navy`, `bg-red`, `bg-surface`, `bg-surface-2`, `border-line`, `text-body`, `text-success`, `text-ink-muted`, `font-display`, `text-steel`). Enforced by `pnpm check:guards` from Task 2.
- **Legal-reviewed copy is frozen:** no change to `app/page.tsx`, `app/layout.tsx`, `app/terms/page.tsx`, `app/privacy/page.tsx`, any funnel page or layout (`app/{individual,family,cobra,ppo,self-employed,business}/**`), `components/Footer.tsx`, `components/ExitIntentDialog.tsx`, `lib/email/sendLeadConfirmation.ts`. Enforced by `pnpm check:guards`. Only Task 13 may touch them, and only with the allow-listed lines it names, after owner and legal approval.
- **No database schema change.** `drizzle/0000_purple_loa.sql` must stay byte-identical (sha256 `239762878eb2b7e070b7d9ccb507fb743e9431a7822455609e5900481df9a0dc`).
- **Pinned versions (exact, `pnpm add -E`):** `better-auth@1.6.33`, `@better-auth/drizzle-adapter@1.6.33`, `drizzle-orm@0.45.2`, `pg@8.22.0`; dev: `drizzle-kit@0.31.10`, `@types/pg@8.20.0`, `tsx@4.22.4`, `eslint@9.39.4`, `eslint-config-next@16.0.10`. `zod` stays at `3.25.76`. pnpm is the only package manager.
- **Source of ported code:** `origin/redesign/union-private-healthcare` at `84c4656`. "Copy from redesign" means `git show origin/redesign/union-private-healthcare:<path> > <path>`, then the listed edits.
- **House style:** no em-dashes or en-dashes in new code, comments, docs or copy.
- **Secrets:** never print a secret value into a session, file or commit. Env var names only.
- **Local data safety:** `.env.local` points at the Neon `main` branch, which is production data. Local runs may read; they never submit a lead, create a user, or reset a password against it. All writes happen on the Neon preview branch (Task 11).
- **Production auth origin:** `BETTER_AUTH_URL` and `NEXT_PUBLIC_SITE_URL` are exactly `https://www.dynastyinsurancenetwork.com` in production.
- **Meta tracking:** off everywhere unless `META_TRACKING_APPROVED` is exactly `"true"`; that flag is not set anywhere until legal approves.
- **Every slice ends green:** `pnpm exec tsc --noEmit`, `pnpm test`, `pnpm lint` (from Task 1), `pnpm check:guards` (from Task 2), `pnpm build`, then a commit.

## Review Focus

Failure modes the spec implies that ordinary happy-path tests would miss. Each has its pinning test in the owning task.

1. **Neon is down when a consumer submits a funnel.** Expected: the form still succeeds and the admin email, consumer email and USHA post still go out (today's behavior). Pinned in Task 7 (`dedup lookup fails` and `insert fails` route tests).
2. **PPO `priorities` (a JS array) and a non-numeric `age`.** Expected: stored exactly as the Supabase insert stored them (`'["nationwide"]'`, `NULL`), never a Postgres array literal or a failed insert that loses the TCPA record. Pinned in Task 7 parity tests plus a preview SQL check in Task 11.
3. **A deployed environment missing `BETTER_AUTH_SECRET` or `DATABASE_URL`, or holding the public placeholder values.** Expected: setup screen, `503` from `/api/auth/*`, never a session signed with the placeholder. Pinned in Tasks 3 and 5.
4. **An `admin` (not `superadmin`) trying Users, Settings, `update-user {role}` or `admin/set-role`.** Expected: 403 or 400 and the stored role unchanged. Pinned in Task 9 route tests and a live check in Task 11.
5. **An expired or reused set-password or reset link.** Expected: a clear "invalid or expired" message with a path to request a new link, not a dead disabled button. Pinned in Task 6 (page) and checked in the browser in Task 11.

## Deviations from the spec (approve with the plan)

1. `lib/data/{store,neon-store,types,lead-mapper}.ts` move from spec Step 3 into Task 4, because `/api/health` (spec Step 1) imports them.
2. Task 7 adds HTML escaping of the email address on the `/api/unsubscribe` confirmation page (a reflected XSS on main today). No visible wording changes for a normal address.
3. The "No Union" guard is widened to case-sensitive `\bUnion\b`, `union-leads`, and the Union design tokens listed above (the spec's narrower patterns miss real leaks found in review).
4. `better-auth` is pinned to `1.6.33`, not the redesign's `1.6.20`, which sits inside advisory GHSA-qq9h-g4jm-xgf3; same minor line.
5. eslint is installed and configured in Task 1 (`pnpm lint` cannot run on main today).
6. Meta funnel wiring (spec Step 5) needs four added lines per funnel page, which the copy guard forbids. Task 13 therefore runs only after the legal branch lands on `main`, and only with an owner-approved allow-list for exactly those lines (Option A). Option B, a global fetch wrapper that leaves funnel files untouched, is listed there with its cost.
7. The data-sent list in spec section 9 is corrected (IP address and user agent unhashed, Meta cookies, page URL, hashed country; no ZIP). Corrected in the spec and in counsel's coverage doc on 2026-10-06.
8. The `/auth/error` page shows fixed text instead of echoing a `?message=` value (anyone could otherwise craft a Dynasty-branded page saying anything).

## Slices

One checkbox = one slice. Hard stops wait for the owner.

- [ ] **Task 1: Toolchain.** Pinned packages, db/auth scripts, eslint config, stale `bun.lock` removed; lint baseline green. [task file](superpowers/plans/2026-10-06-dynasty-neon/task-01-toolchain.md)
- [ ] **Task 2: Port guards.** `pnpm check:guards` fails on Union leaks or any change to legal-reviewed files; each check proven to fail first. [task file](superpowers/plans/2026-10-06-dynasty-neon/task-02-guards.md)
- [ ] **Task 3: Fail-closed platform config.** `lib/platform/provider.ts` with placeholder rejection and deployed-env throws. [task file](superpowers/plans/2026-10-06-dynasty-neon/task-03-provider.md)
- [ ] **Task 4: Database layer and health.** Drizzle files byte-identical, `lib/db`, `lib/data` store, `/api/health` on Neon, `db:verify` read-only green against Neon. [task file](superpowers/plans/2026-10-06-dynasty-neon/task-04-database.md)
- [ ] **Task 5: Auth server and gates.** Better Auth server (Dynasty), gated `/api/auth/*`, `requireAdmin` accepting admin and superadmin, proxy, auth emails. [task file](superpowers/plans/2026-10-06-dynasty-neon/task-05-auth-server.md)
- [ ] **Task 6: Auth pages in the Dynasty look.** Dynasty `AuthShell`, login, forgot and reset password (with expired-link message), error page, nav sign-out, setup screen. [task file](superpowers/plans/2026-10-06-dynasty-neon/task-06-auth-pages.md)
- [ ] **Task 7: Lead intake on Neon.** `/api/leads`, unsubscribe, AI scoring, USHA status write to Neon; TCPA parity tests for all six funnels. [task file](superpowers/plans/2026-10-06-dynasty-neon/task-07-lead-intake.md)
- [ ] **Task 8: Dashboard on admin APIs.** `/api/admin/{leads,stats,export}`, polling client, admin and projections pages; every admin route proven to answer 401 without a session. [task file](superpowers/plans/2026-10-06-dynasty-neon/task-08-dashboard.md)
- [ ] **Task 9: Users and Settings.** Super-admin Users page with set-password-link invites, Settings page, nav entries. [task file](superpowers/plans/2026-10-06-dynasty-neon/task-09-users-settings.md)
- [ ] **Task 10: Remove Supabase, document Neon.** Supabase code, migrations and packages deleted; `.env.example` and docs rewritten for Dynasty on Neon. [task file](superpowers/plans/2026-10-06-dynasty-neon/task-10-cleanup-docs.md)
- [ ] **Task 11: Preview verification (HARD STOP: keys).** Neon preview branch, Vercel preview env vars, browser and SQL verification. [task file](superpowers/plans/2026-10-06-dynasty-neon/task-11-preview.md)
- [ ] **Task 12: Production switch (HARD STOP: deploy).** Production env vars, merge, verify, rollback ready. [task file](superpowers/plans/2026-10-06-dynasty-neon/task-12-production.md)
- [ ] **Task 13: Meta tracking, off by default (HARD STOP: legal).** Kill switch, pixel and server events; funnel wiring only after the legal branch lands and the guard amendment is approved. [task file](superpowers/plans/2026-10-06-dynasty-neon/task-13-meta.md)

Tasks 1 to 10 ship as one release (Task 12). Task 13 ships separately and stays switched off until legal approves.

## Out of scope (tracked elsewhere)

- TrustedForm claim field mismatch (`certificateUrl` vs `certUrl`): separate task already queued; whichever lands second rebases.
- AI scoring model ID change, restricted database role, database-backed rate limiting.
- Anything from the Union rebrand.
