As of 2026-10-06

## Live
- Production (www.dynastyinsurancenetwork.com) serves the funnels, but its Supabase database is gone: leads are not stored and nobody can sign in. Lead emails still reach the admin.

## In flight
- Dynasty on Neon: `docs/plan.md`, branch `feat/dynasty-neon`. Plan approved; executing slice by slice.
- Legal compliance changes on `legal/dynasty-compliance`, preview shared with counsel for sign-off.

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
- Counsel's sign-off on the legal preview.
