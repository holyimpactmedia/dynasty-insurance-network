# Runbook

Source of truth: [`.env.example`](../.env.example), [`drizzle/`](../drizzle), [`scripts/verify-neon-schema.ts`](../scripts/verify-neon-schema.ts) and [`app/api/health/route.ts`](../app/api/health/route.ts).

## Environment variables

See [`.env.example`](../.env.example) for the full list. The short version:

| Var | Required? | What it does |
|---|---|---|
| `DATABASE_URL` | yes | Neon pooled URL; every query and Better Auth |
| `BETTER_AUTH_SECRET` | yes | signs sessions and reset links; 32+ random bytes; stable (rotating it signs everyone out) |
| `BETTER_AUTH_URL` | yes | the exact origin this environment serves; sign-in only works from this origin |
| `NEXT_PUBLIC_SITE_URL` | yes | absolute links in emails and metadata; baked in at build |
| `RESEND_API_KEY` | yes | all email; with it unset, nothing is sent, including dashboard invites and password resets |
| `RESEND_FROM_EMAIL` | optional | sender; invite, reset and confirmation emails fall back to `noreply@holyimpactmedia.com` and the admin alert falls back to `noreply@dynasty.app`, so set it |
| `ADMIN_EMAIL` | yes | receives the per-lead notification |
| `UNSUBSCRIBE_EMAIL`, `HOLY_IMPACT_MAILING_ADDRESS` | optional | CAN-SPAM footer |
| `USHA_ENABLED` | yes (`true`/`false`) | marketplace post; off means leads stay `pending` |
| `USHA_API_URL` / `USHA_API_KEY` | only if `USHA_ENABLED=true` | LeadArena/USHA credentials |
| `ANTHROPIC_API_KEY` | yes | AI lead scoring |
| `TRUSTEDFORM_API_KEY` | yes | TCPA certificate claim |
| `DATABASE_URL_DIRECT` | laptop only | Neon direct URL for drizzle-kit; never on Vercel |

If `DATABASE_URL`, `BETTER_AUTH_SECRET` or the site URL is missing in a deployed environment, the dashboard shows the setup screen and `/api/auth/*` answers 503. That is deliberate (fail closed).

## Databases

- **Production:** the Neon project's `main` branch.
- **Preview:** a separate Neon branch named `preview`. Preview deployments never point at production data.
- Local `.env.local` may point at `main` for read-only checks only. Never submit leads, create users or reset passwords against `main` from a laptop. The one exception is the owner-approved `pnpm auth:bootstrap` run described under "Give someone dashboard access".

The app connects through a `pg` pool (max 5 connections, 30 s idle timeout, 10 s connect timeout) per serverless instance. An idle connection that Neon closes is logged as `[db] idle client error`; the pool drops it and carries on.

## Schema changes

The schema is defined in [`lib/db/schema/`](../lib/db/schema) and applied by Drizzle migrations in [`drizzle/`](../drizzle).

```bash
pnpm db:generate     # writes a new migration from schema changes (needs DATABASE_URL_DIRECT set, even a dummy)
pnpm db:migrate      # applies pending migrations (uses DATABASE_URL_DIRECT)
pnpm db:verify       # read-only: asserts tables, columns, triggers, indexes, one applied migration
```

Never edit or regenerate a migration that has shipped: Drizzle records each file's hash and timestamp. Schema change before app deploy, always. A migration is a hard stop that the owner approves. `db:verify` asserts exactly one applied migration, so update that count in [`scripts/verify-neon-schema.ts`](../scripts/verify-neon-schema.ts) in the same change that adds a second one.

## Give someone dashboard access

Sign in as a super admin, open **Users**, enter name, email and role. They receive a one-time "set your password" link that expires in 1 hour; if it expires they use **Forgot password** on the sign-in page. Roles: `admin` sees leads and projections; `superadmin` also manages users and settings. With `RESEND_API_KEY` unset no email goes out, so set it first.

The first accounts come from the one-time local `pnpm auth:bootstrap` script (see the `AUTH_BOOTSTRAP_*` variables in [`.env.example`](../.env.example)). It creates the listed users in whichever database `DATABASE_URL` points at and emails each a set-password link. Run it only after the owner approves; it is the one laptop operation allowed to create users on production. Set `AUTH_BOOTSTRAP_MODE` back to `false` (or delete it) in `.env.local` straight after the run: while it is `true`, public sign-up is open for anything run locally against that database.

Roles are stored in the Better Auth `user` table and cannot be changed by the user. The Users page only creates new accounts; it cannot change an existing user's role. To change a role by hand (rare), get the owner's approval first (access changes are a hard stop), then run against the right Neon branch:

```sql
update "user" set role = 'admin' where email = 'person@example.com';
```

## Health check

`GET /api/health` returns:

| Status | Body | Meaning |
|---|---|---|
| `200` | `{"status":"ok","provider":"neon"}` | app and the `leads` table reachable |
| `503` | `{"status":"error","reason":"database_unconfigured","provider":"neon"}` | `DATABASE_URL` missing |
| `503` | `{"status":"error","reason":"leads_table_unreachable","provider":"neon"}` | database unreachable or schema missing; details in Vercel runtime logs (`[health] database check failed`) |

`/api/health` checks only the database: a `200` does not prove sign-in works (a missing `BETTER_AUTH_SECRET` or site URL still shows the setup screen).

Wire it into an uptime check at an interval well above Neon's scale-to-zero delay (5 minutes by default), for example every 15 to 30 minutes. Every check wakes the database, and a check every 5 minutes or less keeps it awake around the clock, which uses compute all month; confirm the interval against the Neon plan's compute allowance. The dashboard polls leads every 30 s and stats every 60 s, plus once when the window regains focus, and only while its tab is visible, for the same reason.

## Lead intake when the database is down

The funnels keep working: the consumer sees success, and the confirmation email, admin email and USHA post still go out. The intake waits at most 10 s on the database before answering, and the duplicate lookup gets at most 3 s of that so it cannot starve the insert. Each query is also capped at 8 s on the client side (`query_timeout` in [`lib/db/client.ts`](../lib/db/client.ts)), which bounds the dashboard CSV export and sign-in queries too: a query that needs longer fails instead of hanging. A pooled connection that Neon closed gets one retry of the insert (the unique reference number makes that safe). A failed write is logged as `LEAD INSERT FAILED` (or `LEAD DEDUP LOOKUP FAILED`); with `DATABASE_URL` missing or set to the public placeholder, the line is the error `LEAD NOT STORED`. Such a lead exists only in the admin notification email.

Tradeoff: a database slower than the budget can leave a lead unstored while its emails still go out (a late insert may still land afterward, without its id for the background steps). Two consequences to know:

- A duplicate lookup slower than 3 s lets a repeat submission through, so the emails and the flag-gated USHA post can go out twice for one person.
- A background retry can store the row after `LEAD INSERT FAILED` was logged, so check for the `reference_number` before a manual restore. A duplicate restore fails safely on the unique index.

Search the logs for `LEAD INSERT FAILED` and `LEAD NOT STORED` after any Neon incident. `LEAD INSERT FAILED` with "insert returned no row" means the reference number was already taken by a different lead, so nothing was stored for this one.

Restoring one is an owner-approved SQL insert into `leads` on the production branch that copies the original values from that admin email: `reference_number`, name, email, phone, age, state, funnel, income, household, qualifying event, priorities, UTM fields, the consent time (`tcpa_consent_at`), `ip_address` and `trusted_form_cert_url`, with `tcpa_consent = true` (the intake refuses any lead without consent). Never re-submit the lead through a public funnel: that records your IP address, a new consent time and a new or missing TrustedForm certificate as if the consumer had consented again. The quiz answers are not in the admin email and cannot be restored.

## TrustedForm claims

Each lead's TrustedForm certificate is claimed first in the background work after the response, by [`lib/trustedform/claim.ts`](../lib/trustedform/claim.ts) with a 10 s timeout. There is no public route for it: the claim runs server side only, with `TRUSTEDFORM_API_KEY`. Search the Vercel runtime logs for:

- `TRUSTEDFORM CLAIM FAILED`: the certificate was not claimed (key missing, unusable certificate URL, a TrustedForm error or a timeout), so it expires.
- `TRUSTEDFORM SCAN MISMATCH`: the certificate was claimed, but a consent phrase was not found on the page snapshot (or the outcome was not `success`). TrustedForm keeps the certificate, but the evidence is weaker. The line lists the missing phrases and TrustedForm's warnings, with email addresses and numbers removed.
- `TRUSTEDFORM CLAIM OK`: claimed and every phrase found; the line lists them.

A lead that carried a certificate URL and has none of these lines means the background work did not finish; check the certificate in TrustedForm. The claim scans the consent page for "consent to be contacted by Holy Impact Media" and "Reply STOP to opt out of SMS"; keep those phrases in step with counsel's consent text ([`lib/trustedform/claim.test.ts`](../lib/trustedform/claim.test.ts) pins them against every funnel page).

All of these log lines live only as long as the Vercel plan's runtime-log retention, so read them promptly or keep a log drain.

## USHA marketplace alerts

On a terminal `failed` status the admin notification email shows the USHA result in its body (the subject does not carry it); search the inbox for `USHA Post Failed`. The dashboard's Marketplace filter (`failed`) lists the backlog. [`lib/usha/postLead.ts`](../lib/usha/postLead.ts) makes up to 3 attempts. Posting stays off unless `USHA_ENABLED` is exactly `true` and both `USHA_API_URL` and `USHA_API_KEY` are set.

## Previews

Sign-in works only on the origin in `BETTER_AUTH_URL`. For previews that is the stable branch alias (for example `dynasty-insurance-network-git-<branch>-holy-impact-media.vercel.app`), not the per-deployment URL.

## Common failures

| Symptom | Cause | Fix |
|---|---|---|
| Setup screen on the dashboard | `DATABASE_URL`, `BETTER_AUTH_SECRET` or site URL missing (or a placeholder) | set them in Vercel for that environment and redeploy |
| Sign-in fails on a preview | opened the per-deployment URL | use the branch alias |
| Admin sent to `/` after sign-in | account role is `user` | change the role with the SQL in "Give someone dashboard access", after the owner approves (the Users page only creates new accounts) |
| Users or Settings missing from the nav | account is `admin`, not `superadmin` | expected |
| Invite or reset email never arrives | `RESEND_API_KEY` unset (or the link expired after 1 hour) | set the key; use **Forgot password** to get a new link |
| `/api/leads` returns 429 | rate limit from one IP | wait 10 min or tune [`lib/rate-limit.ts`](../lib/rate-limit.ts) |
| Leads stuck `usha_status='pending'` | `USHA_ENABLED` false or credentials missing | set them |

## Checks

`pnpm test` (Vitest), `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm check:guards` (no Union leaks; legal-reviewed files unchanged), `pnpm build`.
