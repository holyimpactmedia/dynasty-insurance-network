# Task 0: Repo rulebook and state file

Part of [docs/plan.md](../../../plan.md). Read its Global Constraints first.

**Goal:** give this repo the two files the owner's process requires and `/next` reads first: a repo `CLAUDE.md` (stack, commands, Gate Policy hard stops, legal and brand rules) and a `STATE.md` (current truth, 60 lines max). Added after senior review: the plan's hard stops and `/next` had no rulebook to read.

**Files:**
- Create: `CLAUDE.md`, `STATE.md`, `docs/build-log.md`

**Interfaces:** none in code. Every later slice reads `CLAUDE.md` and updates `STATE.md` and `docs/build-log.md`.

- [ ] **Step 1: Write `CLAUDE.md`**

```markdown
# Dynasty Insurance Network: repo rules

The repo-level rulebook. It wins over the user-level profile wherever the two touch.

## What this is

The public Dynasty Insurance Group lead-generation site (six consumer funnels, Terms, Privacy) plus an internal admin dashboard. Operated by Holy Impact Media, LLC. Leads are stored with TCPA consent evidence, emailed to the admin, AI-scored and posted to the USHA marketplace. Live at https://www.dynastyinsurancenetwork.com.

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind 4, pnpm 10.17.1 (the only package manager), Neon Postgres via Drizzle (`lib/db`), Better Auth (`lib/auth`), Resend, Anthropic, Vercel.

## Commands

- `pnpm dev`, `pnpm build`, `pnpm test` (Vitest), `pnpm lint`, `pnpm exec tsc --noEmit`
- `pnpm check:guards`: fails if legal-reviewed consumer files changed or any Union brand string or token appears
- `pnpm db:verify` (read-only), `pnpm db:generate`, `pnpm db:migrate`

Every slice ends with all five checks green.

## Gate Policy

Hard stops (the owner approves in chat before the step runs):
- Database migrations or any schema change
- Keys and environment variables in Vercel or Neon; creating Neon branches
- Deploys to production, pushes to `main`, merging pull requests
- Authentication or access changes (roles, sessions, sign-in flow)
- Money: anything that buys, bills, or changes paid plans
- Compliance: consent text, Terms, Privacy, consumer emails, TCPA or TrustedForm handling, enabling Meta tracking
- Anything that deletes data

Routine, doc-backed slices under the approved `docs/plan.md` proceed after the mechanical checks and are logged in `docs/build-log.md`.

## Legal and brand

- Counsel's documents are the source of truth for compliance copy: apply their wording verbatim; where they left a point open, use the conservative default and flag it for them. Never edit legal-reviewed files outside an approved legal change (see `pnpm check:guards`).
- The brand is Dynasty. The Union Private Healthcare rebrand lives on branch `redesign/union-private-healthcare` and is a read-only code source; none of its branding ships.

## Data safety

- Production data is the Neon production branch. Local runs may read it; they never submit leads, create users or reset passwords against it. Writes for testing go to the Neon `preview` branch.
- Never print a secret value into a session, file or commit; refer to env var names only.

## House style

No em-dashes or en-dashes anywhere (code comments, docs, copy). Plain words.

## Where things are

`docs/plan.md` (build plan, one checkbox per slice), `STATE.md` (current truth), `docs/build-log.md` (history), `docs/RUNBOOK.md`, `docs/SECURITY.md`, `docs/SCHEMA.md`, `docs/superpowers/specs/` (approved designs).
```

- [ ] **Step 2: Write `STATE.md`**

```markdown
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
- Counsel's answers to the open questions in the coverage doc.
```

- [ ] **Step 3: Start `docs/build-log.md`**

```markdown
# Build log

## 2026-10-06
- Spec approved; plan written and reviewed (pressure test: clear after fixes; senior review: go with changes); fixes folded in.
```

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md STATE.md docs/build-log.md
git commit -m "docs: repo rulebook (Gate Policy), STATE.md and build log"
```

(Docs only; the mechanical checks start with Task 1.)
