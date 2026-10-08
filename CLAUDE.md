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
