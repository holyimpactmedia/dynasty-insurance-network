As of 2026-10-09

## Live
- Production (www.dynastyinsurancenetwork.com) serves the funnels, but its Supabase database is gone: leads are not stored and nobody can sign in. Lead emails still reach the admin.
- Legal compliance changes are live on main (PR #1); counsel is verifying them in production.

## In flight
- Dynasty on Neon, branch `feat/dynasty-neon`: slices 0 to 10c of `docs/plan.md` are built and reviewed. Task 11 (preview): the Neon `preview` branch exists and the local walk-through passed; the deployed preview and the owner's sign-in are next.

## Decisions
- Move to Neon + Better Auth + Drizzle, porting the redesign branch's backend; Dynasty brand only.
- Fresh start: Supabase held only test leads.
- Users are invited with a one-time set-password link, never a typed password.
- Meta tracking ships switched off; on only after legal approves.
- Lead timestamps leave the store as ISO 8601, as Supabase returned them (Safari cannot reliably parse Postgres text).
- The intake answers within 10 s whatever the database does; a slower database can leave a lead unstored while its emails still go out (RUNBOOK has the restore).
- TrustedForm claims run server side only; there is no public claim route.
- The privacy policy names Neon as host from the release on, with a new "Last Updated" date (owner, not raised with counsel).
- Better Auth rate limiting stays in memory for now; a database-backed limiter is a schema change.
- The Users page only invites; it cannot revoke or demote (fixing a mistaken invite needs owner-approved SQL).

## Broke / learned
- An unwatched free-tier database paused and took production down; confirm the Neon plan, restore window and compute allowance before go-live.
- The Neon project's `production` branch is empty; the real schema and accounts are on its `dev` branch. Never point production at a branch without a read-only `db:verify` first.
- An uptime check at or under Neon's 5-minute scale-to-zero delay keeps the database awake all month.
- Production request logs on this Vercel plan reach back about 20 hours; read failure logs promptly.
- TrustedForm claims were silently failing; fixed. Once live they are real claims on the TrustedForm account.
- The desktop preview launcher only serves the main checkout; check a worktree with its own dev server on another port.

## Next
1. Task 11: deploy the preview, set its preview-only keys, owner signs in and submits a lead; TrustedForm and an idle-connection check.
2. Owner decision on which Neon branch becomes production (recommend restoring `production` from `dev`).
3. Task 12: production switch (hard stop: deploy). Projections is off in the live settings; a super admin turns it on in Settings.

## Keys owed
- Task 11: owner signs in on the preview and submits one lead and one invite.
- `TRUSTEDFORM_API_KEY`, `RESEND_API_KEY` and `ANTHROPIC_API_KEY` confirmed for preview and production.
- Neon production branch decision; Neon plan, restore window and compute allowance confirmation (Task 12).
- Counsel's verification of the live legal changes.
