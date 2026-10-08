As of 2026-10-08

## Live
- Production (www.dynastyinsurancenetwork.com) serves the funnels, but its Supabase database is gone: leads are not stored and nobody can sign in. Lead emails still reach the admin.
- Legal compliance changes are live on main (PR #1); counsel is verifying them in production.

## In flight
- Dynasty on Neon: `docs/plan.md`, branch `feat/dynasty-neon`. Plan approved 2026-10-08; executing slice by slice.

## Decisions
- Move to Neon + Better Auth + Drizzle, porting the redesign branch's backend; Dynasty brand only.
- Fresh start: Supabase held only test leads.
- Users are invited with a one-time set-password link, never a typed password.
- Meta tracking ships switched off; on only after legal approves.

## Broke / learned
- An unwatched free-tier database paused and took production down; confirm the Neon plan and restore window before go-live.
- TrustedForm claims were silently failing (field names and scan phrases); fixed in the Neon slices.

## Next
1. Execute `docs/plan.md` slices 0 to 10.
2. Preview verification (hard stop: keys).
3. Production switch (hard stop: deploy).

## Keys owed
- Neon CLI sign-in for the preview branch (slice 11).
- Neon plan, restore window and compute allowance confirmation (slice 12).
- Counsel's verification of the live legal changes.
