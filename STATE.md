As of 2026-10-09

## Live
- Production (www.dynastyinsurancenetwork.com) serves the funnels, but its Supabase database is gone: leads are not stored and nobody can sign in. Lead emails still reach the admin.
- Legal compliance changes are live on main (PR #1); counsel is verifying them in production.

## In flight
- Dynasty on Neon, branch `feat/dynasty-neon`: slices 0 to 10 of `docs/plan.md` are built and reviewed. The whole-branch review passed with fixes: lead-path hardening (Task 10b, drafted) should land before the preview so the preview tests what ships.

## Decisions
- Move to Neon + Better Auth + Drizzle, porting the redesign branch's backend; Dynasty brand only.
- Fresh start: Supabase held only test leads.
- Users are invited with a one-time set-password link, never a typed password.
- Meta tracking ships switched off; on only after legal approves.
- Lead timestamps leave the store as ISO 8601, as Supabase returned them (Safari cannot reliably parse Postgres text).
- Better Auth rate limiting stays in memory for now; a database-backed limiter is a schema change.
- The Users page only invites; it cannot revoke or demote (a mistyped invite becomes a live admin once used; fixing it needs owner-approved SQL).

## Broke / learned
- An unwatched free-tier database paused and took production down; confirm the Neon plan, restore window and compute allowance before go-live.
- An uptime check at or under Neon's 5-minute scale-to-zero delay keeps the database awake all month.
- TrustedForm claims were silently failing (field names and scan phrases); fixed. Once live they are real claims on the TrustedForm account.
- The desktop preview launcher only serves the main checkout; check a worktree with its own dev server on another port.

## Next
1. Owner decision on Task 10b (lead-path hardening), then build it.
2. Task 11: preview verification on a Neon `preview` branch (hard stop: keys).
3. Decide the privacy policy's hosting line before Task 12.
4. Task 12: production switch (hard stop: deploy). Projections is off in the live settings; a super admin turns it on in Settings.

## Keys owed
- Approval of Task 10b and Task 11; Neon CLI sign-in (`npx neonctl@latest auth`).
- Privacy policy, `app/privacy/page.tsx`: lists "hosting (Vercel, Supabase)"; after cutover Neon stores consumer data. Owner decides the edit and whether counsel sees it.
- `TRUSTEDFORM_API_KEY`, `RESEND_API_KEY` and `ANTHROPIC_API_KEY` confirmed for preview and production.
- Neon plan, restore window and compute allowance confirmation (Task 12).
- Counsel's verification of the live legal changes.
