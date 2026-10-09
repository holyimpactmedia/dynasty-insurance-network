# Build log

## 2026-10-06
- Spec approved; plan written and reviewed (pressure test: clear after fixes; senior review: go with changes); fixes folded in.

## 2026-10-08
- Task 1 (toolchain): `pnpm lint` now runs with the redesign's `eslint.config.mjs`. Baseline on main: 0 errors in legal-frozen files (only `@next/next/no-img-element` warnings, left as warnings); 3 errors in 2 non-frozen files.
- Disabled rule, deferred fix: `react-hooks/immutability` for `app/dashboard/admin/page.tsx` only (line 55, `errored` reassigned inside `Promise.all` async closures). Not a mechanical fix. Task 8 replaces the file; remove the override then.
- Disabled rule, deferred fix: `react-hooks/refs` for `components/dashboard/AdminDashboardClient.tsx` only (lines 186 and 190, refs written during render for realtime handlers). Moving them into effects changes timing. Task 8 replaces the data layer; remove the override then.
- Warnings left as is: 16 `@next/next/no-img-element` in landing, funnel, legal and footer files (legal-frozen), and 2 unused `eslint-disable` directives at `components/dashboard/AdminDashboardClient.tsx:196` and `:318`.
- Plan approved by the owner (single release, no live traffic; Tasks 3 to 9 batch-approved; executed subagent-driven with a task review after each slice). Branch rebased on main 62197a4 after the legal changes went live.
- Task 0 (repo rules): `CLAUDE.md`, `STATE.md`, this log.
- Task 2 (port guards): `pnpm check:guards`. Hardened in review to catch renames, mode and binary changes, empty new or deleted files and untracked files under frozen paths; each check proven to fail first.
- Task 3 (fail-closed config): `lib/platform/provider.ts`; the build-phase exemption is exact (`phase-production-build` only) and a missing site URL counts as unconfigured, both pinned by tests.

## 2026-10-09
- Task 4 (database layer): migration byte-identical (sha256 2397628...a0dc); `db:verify` read-only green against production (7 tables, 32 lead columns, 1 migration); `db:generate` reports no changes. Review fixes: lead timestamps leave the store as ISO 8601 (Postgres text form is not reliably parsed by Safari), and the pool logs `[db] idle client error` instead of crashing the instance.
- Task 5 (auth server): Better Auth on Neon, `/api/auth/*` answers 503 when unconfigured, admin gate accepts admin and superadmin. Proven: `VERCEL_ENV=production pnpm build` with no secrets succeeds.
- Task 6 (auth pages): login, forgot and reset password, error page in the Dynasty card. Review fixes: reset and sign-out handle network failures (sign-out never navigates as if signed out), and a reused reset link offers "Request a new link". Browser check at desktop and mobile passed.
- Task 7 (lead intake): stored values match main's Supabase insert field by field for every funnel (non-numeric age to null, PPO priorities to JSON text). TrustedForm claim fixed (field names and scan phrases) with a 10 s timeout. Review fix: tests now prove the consumer email, admin email and USHA post still run when the database is down, unreachable or unconfigured.
- Task 8 (dashboard): every lead read goes through `/api/admin/*` behind the role check; polling 30 s / 60 s; the Task 1 lint overrides are gone. Browser check: anonymous visits redirect to sign-in and every admin API answers 401.
- Task 9 (users and settings): super-admin invites with a one-time set-password link; Settings toggles Projections. The admin route guard now also proves 403 for a signed-in `user` and for an `admin` on super-admin-only routes.
- Task 10 (cleanup): Supabase code, migrations, types and packages removed; `.env.example`, RUNBOOK, SECURITY, SCHEMA, PIPELINE and README describe Dynasty on Neon.
- Two positive controls (deliberately weakening a security gate) were refused by the session's permission check; both ran on scratch copies instead and failed as required.
- Final whole-branch review: no PII exposure, auth bypass or consent-evidence change; safe to preview. It asks for lead-path hardening before preview (query timeout, one retry on a dead connection, TrustedForm outcome logging, a private claim call instead of the public route, a reset-page test), drafted as Task 10b for the owner's approval.
