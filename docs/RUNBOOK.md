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
- Local `.env.local` may point at `main` for read-only checks only. Never submit leads, create users or reset passwords against `main` from a laptop.

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

The first accounts come from the one-time local `pnpm auth:bootstrap` script (see the `AUTH_BOOTSTRAP_*` variables in [`.env.example`](../.env.example)). It writes to whichever database `DATABASE_URL` points at, so run it only with the owner's approval.

Roles are stored in the Better Auth `user` table and cannot be changed by the user. To change a role by hand (rare), run against the right Neon branch:

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

Wire it into an uptime check at a 5-minute or longer interval: every check wakes the Neon database, which costs compute. The dashboard polls leads every 30 s and stats every 60 s, plus once when the window regains focus, and only while its tab is visible, for the same reason.

## Lead intake when the database is down

The funnels keep working: the consumer sees success, and the confirmation email, admin email and USHA post still go out. The insert failure is logged as `LEAD INSERT FAILED` (or `LEAD DEDUP LOOKUP FAILED`). Those leads exist only in the admin emails until re-entered.

## TrustedForm claims

Each lead's TrustedForm certificate is claimed first in the background work after the response, with a 10 s timeout. A failed claim is logged as `TRUSTEDFORM CLAIM FAILED` in the Vercel runtime logs; an unclaimed certificate expires, so search the logs for that line. The claim scans the consent page for "consent to be contacted by Holy Impact Media" and "Reply STOP to opt out of SMS"; keep those phrases in step with counsel's consent text.

## USHA marketplace alerts

On a terminal `failed` status the admin notification email shows the USHA result; search the inbox for `USHA: failed`. The dashboard's Marketplace filter (`failed`) lists the backlog. [`lib/usha/postLead.ts`](../lib/usha/postLead.ts) retries 3 times. Posting stays off unless `USHA_ENABLED` is exactly `true` and both `USHA_API_URL` and `USHA_API_KEY` are set.

## Previews

Sign-in works only on the origin in `BETTER_AUTH_URL`. For previews that is the stable branch alias (for example `dynasty-insurance-network-git-<branch>-holy-impact-media.vercel.app`), not the per-deployment URL.

## Common failures

| Symptom | Cause | Fix |
|---|---|---|
| Setup screen on the dashboard | `DATABASE_URL`, `BETTER_AUTH_SECRET` or site URL missing (or a placeholder) | set them in Vercel for that environment and redeploy |
| Sign-in fails on a preview | opened the per-deployment URL | use the branch alias |
| Admin sent to `/` after sign-in | account role is `user` | change the role (Users page or SQL above) |
| Users or Settings missing from the nav | account is `admin`, not `superadmin` | expected |
| Invite or reset email never arrives | `RESEND_API_KEY` unset (or the link expired after 1 hour) | set the key; use **Forgot password** to get a new link |
| `/api/leads` returns 429 | rate limit from one IP | wait 10 min or tune [`lib/rate-limit.ts`](../lib/rate-limit.ts) |
| Leads stuck `usha_status='pending'` | `USHA_ENABLED` false or credentials missing | set them |

## Checks

`pnpm test` (Vitest), `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm check:guards` (no Union leaks; legal-reviewed files unchanged), `pnpm build`.
