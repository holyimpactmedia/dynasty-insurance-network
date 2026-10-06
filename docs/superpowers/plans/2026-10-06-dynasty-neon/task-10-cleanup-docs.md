# Task 10: Remove Supabase, document Neon

Part of [docs/plan.md](../../../plan.md). Read its Global Constraints first.

**Goal:** no Supabase code, migrations, types or packages remain; `.env.example` and the operator docs describe Dynasty on Neon accurately.

**Files:**
- Delete: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts`, `supabase/migrations/20260518000000_baseline.sql`, `supabase/migrations/20260519000000_dashboard_rpcs.sql`, `scripts/001_create_tables.sql`, `lib/types/database.ts`
- Modify: `package.json`, `pnpm-lock.yaml` (remove `@supabase/ssr`, `@supabase/supabase-js`)
- Replace: `.env.example`, `docs/RUNBOOK.md`, `docs/SECURITY.md`, `docs/SCHEMA.md`
- Modify: `docs/README.md` (two lines)

**Interfaces:**
- Consumes: Tasks 4 to 9 (every Supabase importer is already replaced).
- Produces: nothing new in code.

**Why:** spec section 4, Step 4. The Supabase migrations remain in git history; `drizzle/` is now the schema source of truth.

- [ ] **Step 1: Prove nothing still imports Supabase**

```bash
grep -rn "lib/supabase\|@supabase/" app lib components hooks proxy.ts scripts || echo "no Supabase importers"
```

Expected: `no Supabase importers`. Any hit: stop; the task that owns that file is incomplete.

- [ ] **Step 2: Delete the Supabase files and packages**

```bash
git rm lib/supabase/client.ts lib/supabase/server.ts lib/supabase/middleware.ts
git rm supabase/migrations/20260518000000_baseline.sql supabase/migrations/20260519000000_dashboard_rpcs.sql
git rm scripts/001_create_tables.sql lib/types/database.ts
pnpm remove @supabase/ssr @supabase/supabase-js
```

- [ ] **Step 3: Replace `.env.example`**

```bash
# Site URL - redirects and absolute URLs (production: https://www.dynastyinsurancenetwork.com)
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Neon - pooled runtime URL used by the app (host contains -pooler)
DATABASE_URL=
# Neon - direct URL, used only by drizzle-kit on a laptop. Do not set on Vercel.
DATABASE_URL_DIRECT=

# Better Auth - the exact origin this environment serves
# (production: https://www.dynastyinsurancenetwork.com; preview: the stable branch alias)
BETTER_AUTH_URL=
# At least 32 random bytes; generate a fresh one per environment (openssl rand -base64 48)
BETTER_AUTH_SECRET=

# One-time local bootstrap only (pnpm auth:bootstrap). Never set on Vercel.
AUTH_BOOTSTRAP_MODE=false
# JSON file outside the repo: [{ "email", "name", "role": "admin" | "superadmin" }]
AUTH_BOOTSTRAP_USERS_FILE=

# Resend - transactional email (lead confirmation, admin alerts, invites, password resets)
RESEND_API_KEY=re_your_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Admin email - receives a notification on every new lead
ADMIN_EMAIL=you@yourdomain.com

# CAN-SPAM compliance - shown in the consumer confirmation email footer
UNSUBSCRIBE_EMAIL=unsubscribe@yourdomain.com
HOLY_IMPACT_MAILING_ADDRESS=Your Company, LLC, 123 Main St, City, ST 00000
# Footer mailing address (components/Footer.tsx reads it)
NEXT_PUBLIC_HOLY_IMPACT_ADDRESS=

# USHA Marketplace / LeadArena - posting needs USHA_ENABLED=true plus both values;
# otherwise leads are marked usha_status='pending'.
USHA_ENABLED=false
USHA_API_URL=https://app.ushamarketplace.com/api/v1/leads
USHA_API_KEY=your-usha-api-key

# Anthropic - AI lead scoring
ANTHROPIC_API_KEY=sk-ant-your-key

# TrustedForm - claims TCPA consent certificates on lead submission
TRUSTEDFORM_API_KEY=your-trustedform-api-key
```

(Meta variables are added by Task 13, together with its kill switch.)

- [ ] **Step 4: Replace `docs/RUNBOOK.md`**

```markdown
# Runbook

Source of truth: [`.env.example`](../.env.example), [`drizzle/`](../drizzle), [`scripts/verify-neon-schema.ts`](../scripts/verify-neon-schema.ts) and [`app/api/health/route.ts`](../app/api/health/route.ts).

## Environment variables

See [`.env.example`](../.env.example) for the full list. The short version:

| Var | Required? | What it does |
|---|---|---|
| `DATABASE_URL` | yes | Neon pooled URL; every query and Better Auth |
| `BETTER_AUTH_SECRET` | yes | signs sessions and reset links; 32+ random bytes; stable (rotating it signs everyone out) |
| `BETTER_AUTH_URL` | yes | the exact origin this environment serves; sign-in only works from this origin |
| `NEXT_PUBLIC_SITE_URL` | yes | absolute URLs in emails and metadata; baked in at build |
| `RESEND_API_KEY` | yes | all email |
| `RESEND_FROM_EMAIL` | optional | sender; defaults to `noreply@holyimpactmedia.com` |
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

## Schema changes

The schema is defined in [`lib/db/schema/`](../lib/db/schema) and applied by Drizzle migrations in [`drizzle/`](../drizzle).

```bash
pnpm db:generate     # writes a new migration from schema changes (needs DATABASE_URL_DIRECT set, even a dummy)
pnpm db:migrate      # applies pending migrations (uses DATABASE_URL_DIRECT)
pnpm db:verify       # read-only: asserts tables, columns, triggers, indexes, one applied migration
```

Never edit or regenerate a migration that has shipped: Drizzle records each file's hash and timestamp. Schema change before app deploy, always. A migration is a hard stop that the owner approves.

## Give someone dashboard access

Sign in as a super admin, open **Users**, enter name, email and role. They receive a one-time "set your password" link that expires in 1 hour; if it expires they use **Forgot password** on the sign-in page. Roles: `admin` sees leads and projections; `superadmin` also manages users and settings.

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

Wire it into an uptime check at a 5-minute or longer interval: every check wakes the Neon database, which costs compute. The dashboard polls every 30 s (leads) and 60 s (stats) only while its tab is visible, for the same reason.

## Lead intake when the database is down

The funnels keep working: the consumer sees success, and the confirmation email, admin email and USHA post still go out. The insert failure is logged as `LEAD INSERT FAILED` (or `LEAD DEDUP LOOKUP FAILED`). Those leads exist only in the admin emails until re-entered.

## USHA marketplace alerts

On a terminal `failed` status the admin notification email shows the USHA result; search the inbox for `USHA: failed`. The dashboard's Marketplace filter (`failed`) lists the backlog. [`lib/usha/postLead.ts`](../lib/usha/postLead.ts) retries 3 times.

## Previews

Sign-in works only on the origin in `BETTER_AUTH_URL`. For previews that is the stable branch alias (for example `dynasty-insurance-network-git-<branch>-holy-impact-media.vercel.app`), not the per-deployment URL.

## Common failures

| Symptom | Cause | Fix |
|---|---|---|
| Setup screen on the dashboard | `DATABASE_URL`, `BETTER_AUTH_SECRET` or site URL missing (or a placeholder) | set them in Vercel for that environment and redeploy |
| Sign-in fails on a preview | opened the per-deployment URL | use the branch alias |
| Admin sent to `/` after sign-in | account role is `user` | change the role (Users page or SQL above) |
| Users or Settings missing from the nav | account is `admin`, not `superadmin` | expected |
| `/api/leads` returns 429 | rate limit from one IP | wait 10 min or tune [`lib/rate-limit.ts`](../lib/rate-limit.ts) |
| Leads stuck `usha_status='pending'` | `USHA_ENABLED` false or credentials missing | set them |

## Checks

`pnpm test` (Vitest), `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm check:guards` (no Union leaks; legal-reviewed files unchanged), `pnpm build`.
```

- [ ] **Step 5: Replace `docs/SECURITY.md`**

```markdown
# Security Model

Source of truth: [`lib/auth/server.ts`](../lib/auth/server.ts), [`lib/auth/requireAdmin.ts`](../lib/auth/requireAdmin.ts), [`lib/auth/permissions.ts`](../lib/auth/permissions.ts), [`lib/platform/provider.ts`](../lib/platform/provider.ts), [`proxy.ts`](../proxy.ts), [`lib/auth/safeRedirect.ts`](../lib/auth/safeRedirect.ts).

## Accounts and roles

Better Auth (self-hosted, email and password) stores users and sessions in Neon. Public signup is disabled in every deployed environment; accounts come only from a super admin's Users page or the local one-time bootstrap script. Email verification is required to sign in; invited accounts are marked verified because a super admin vouched for them.

Roles live on the Better Auth `user` row: `user` (no dashboard), `admin` (leads, projections), `superadmin` (also Users and Settings). The role field is server-owned (`input: false` in the admin plugin), so `POST /api/auth/update-user` with a role is rejected, and the custom roles grant no `user` permissions, so `admin/set-role` is denied too.

## Fail closed

[`lib/platform/provider.ts`](../lib/platform/provider.ts) decides whether the platform is configured. A deployed environment (Vercel production or preview) missing `DATABASE_URL`, `BETTER_AUTH_SECRET` or the site URL, or holding the public placeholder values, is not configured: the dashboard renders the setup screen and `/api/auth/*` answers 503 before Better Auth loads. `lib/auth/server.ts` throws rather than sign anything with a placeholder in a deployed runtime.

## Where the gate runs

| Layer | What it does |
|---|---|
| Proxy ([`proxy.ts`](../proxy.ts)) | Sends `/dashboard/*` requests without a session cookie to `/auth/login`. Optimistic only; it never checks the role. |
| Layout ([`app/dashboard/layout.tsx`](../app/dashboard/layout.tsx)) | `requireAdmin()`: the authoritative page gate (admin or superadmin). |
| Pages | `requireAdmin()` again (admin, projections) or `requireSuperAdmin()` (users, settings). React `cache()` shares one session read per request. |
| Admin API routes | `requireAdminApi()` / `requireSuperAdminApi()` return 401/403 JSON before any database access. A guard test ([`app/api/admin/auth-guard.test.ts`](../app/api/admin/auth-guard.test.ts)) proves every route under `app/api/admin/**` answers 401 without a session. |
| Server actions | The Settings save action re-checks `requireSuperAdmin()` itself. |

There is no database-level row security: the app connects to Neon as the database owner, so the app-layer gates above are the boundary. The browser never queries the database directly; every dashboard read goes through `/api/admin/*`.

## Sessions

7-day sessions, refreshed daily, checked against the database on every request (cookie cache off), so revoking a session or removing a user takes effect immediately. Resetting a password revokes that user's other sessions.

## Invites and password resets

Invites and resets use the same one-time link (1 hour). No password is ever typed, shown or emailed by a super admin; an invited account gets an unguessable throwaway password it never sees. Expired or used links land on a page that says so and offers a new link.

## Open redirect on login

[`lib/auth/safeRedirect.ts`](../lib/auth/safeRedirect.ts) validates `redirectTo`: same-origin relative paths with a single leading `/` only. Tested in [`lib/auth/safeRedirect.test.ts`](../lib/auth/safeRedirect.test.ts).

## Unsubscribe page

`/api/unsubscribe` writes the suppression list and shows a confirmation page; the email address from the link is HTML-escaped before it is shown.

## CSV formula injection

Lead fields are untrusted. [`lib/csv.ts`](../lib/csv.ts) prefixes any cell starting with `= + - @ \t \r` with a single quote. Tested in [`lib/csv.test.ts`](../lib/csv.test.ts). Exports are built server-side by `/api/admin/export`.

## Rate limiting

`/api/leads` is public and spends money per call. [`lib/rate-limit.ts`](../lib/rate-limit.ts) is an in-memory limiter (8 requests per 10 minutes per IP), best-effort across instances; the duplicate-email check in the route is the backstop. Better Auth's own sign-in limiter is also per instance.

## Known limits

- The app uses the Neon owner role; a restricted role would narrow the blast radius of a code bug.
- Rate limits are per server instance, not shared.
```

- [ ] **Step 6: Replace `docs/SCHEMA.md`**

```markdown
# Database Schema

Source of truth: [`lib/db/schema/app.ts`](../lib/db/schema/app.ts), [`lib/db/schema/auth.ts`](../lib/db/schema/auth.ts) and the applied migration [`drizzle/0000_purple_loa.sql`](../drizzle/0000_purple_loa.sql). Database: Neon Postgres.

## Migration workflow (Drizzle)

```bash
pnpm db:generate   # new migration from schema changes
pnpm db:migrate    # apply (uses DATABASE_URL_DIRECT)
pnpm db:verify     # read-only assertions against the target database
```

Never edit a shipped migration. The trigger function and seed rows at the end of `0000_purple_loa.sql` were written by hand; drizzle-kit neither generates nor detects them.

## Application tables

### `leads`: the lead pass-through record (32 columns)

| Group | Columns |
|---|---|
| Identity | `id` (uuid PK), `reference_number` (unique), `created_at`, `updated_at` (trigger-maintained) |
| Contact | `first_name`, `last_name`, `email`, `phone`, `age`, `state` |
| Qualification | `income_range`, `household_size`, `qualifying_event`, `priorities` (text; the PPO funnel's list is stored as JSON text), `quiz_answers` (jsonb) |
| TCPA / TrustedForm | `tcpa_consent`, `tcpa_consent_at`, `trusted_form_cert_url` |
| Attribution | `funnel_type` (default `private_health`), `utm_source`, `utm_medium`, `utm_campaign`, `ip_address` |
| AI scoring | `ai_score`, `ai_score_reasons` (text[]), `predicted_close_rate`, `ai_scored_at` |
| Marketplace | `sell_price` (default 28), `usha_status` (`pending`/`sent`/`failed`, check constraint), `usha_sent_at`, `usha_lead_id` |
| Legacy | `status` (defaults to `new`) |

Indexes support intake dedup (email), the dashboard ordering (created_at), and the marketplace and funnel filters; the exact list is in the migration and asserted by `db:verify`.

### `email_suppressions`: CAN-SPAM unsubscribe list
`email` (PK), `source`, `suppressed_at`. Written by `/api/unsubscribe`.

### `app_settings`: super admin settings
`key` (PK), `value` (jsonb), `updated_at`. Rows: `projections_enabled` (read by the dashboard), `lead_intake_paused` (present, not read by this app).

## Auth tables (Better Auth)

`user` (includes the admin plugin's `role`, `banned`, `ban_reason`, `ban_expires`), `session`, `account` (holds password hashes), `verification` (holds reset and verification tokens). Defined in [`lib/db/schema/auth.ts`](../lib/db/schema/auth.ts).

## Dashboard aggregates

Computed in [`lib/data/neon-store.ts`](../lib/data/neon-store.ts) (`getPipelineStats`, `getDailyLeadCounts`, `getFunnelBreakdown`), bucketed in `America/New_York` to match [`lib/time/ranges.ts`](../lib/time/ranges.ts).
```

- [ ] **Step 7: Update `docs/README.md`**

Replace:

```markdown
| [SCHEMA.md](./SCHEMA.md) | The database — tables, columns, indexes, RPCs, RLS, and the Supabase CLI migration workflow. |
```

with:

```markdown
| [SCHEMA.md](./SCHEMA.md) | The database: tables, columns, auth tables, aggregates, and the Drizzle migration workflow. |
```

Replace `A Next.js 16 / React 19 / Supabase application.` with `A Next.js 16 / React 19 application on Neon Postgres with Better Auth.`

Then read the rest of `docs/README.md` and fix any other sentence that still describes Supabase, RLS or the profiles table, using the facts in the three docs above.

- [ ] **Step 8: Prove the docs no longer describe Supabase as current**

```bash
grep -n -i "supabase\|RLS\|profiles" docs/README.md docs/RUNBOOK.md docs/SCHEMA.md docs/SECURITY.md || echo "clean"
```

Expected: `clean`.

- [ ] **Step 9: Mechanical checks and commit**

```bash
pnpm exec tsc --noEmit && pnpm test && pnpm lint && pnpm check:guards && pnpm build
git add -A lib/supabase supabase scripts/001_create_tables.sql lib/types/database.ts package.json pnpm-lock.yaml .env.example docs/README.md docs/RUNBOOK.md docs/SECURITY.md docs/SCHEMA.md
git commit -m "chore: remove Supabase code, migrations and packages; document Dynasty on Neon"
```
