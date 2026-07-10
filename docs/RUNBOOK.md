# Runbook

> Neon cutover and rollback commands are defined in [NEON_BETTER_AUTH_MIGRATION_PLAN.md](./NEON_BETTER_AUTH_MIGRATION_PLAN.md). Supabase remains the default provider until `PLATFORM_PROVIDER=neon` is explicitly deployed.

Source of truth: [`.env.example`](../.env.example), [`lib/db/schema/`](../lib/db/schema), [`drizzle/`](../drizzle), [`supabase/migrations/`](../supabase/migrations) during rollback support, and [`app/api/health`](../app/api/health/route.ts).

## Environment variables

See [`.env.example`](../.env.example) for the full list with safe placeholder values. The short version:

| Var | Required? | What it does |
|---|---|---|
| `PLATFORM_PROVIDER` | yes | `supabase` (default/rollback) or `neon`; switches auth and persistence together |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | public anon key (in client JS) |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | server-only — bypasses RLS for intake / admin operations |
| `SUPABASE_DIRECT_URL` | only when preserving source data | direct source connection used by the optional initial transfer/reconciliation tools |
| `DATABASE_URL` | Neon mode | pooled Neon runtime URL for `pg` |
| `DATABASE_URL_DIRECT` | Neon migration work | direct Neon URL used only by Drizzle and transfer tools |
| `BETTER_AUTH_URL` / `BETTER_AUTH_SECRET` | Neon mode | canonical auth origin and server-only signing secret |
| `AUTH_BOOTSTRAP_MODE` | one-time local command only | must be exactly `true` to create internal Better Auth accounts |
| `AUTH_BOOTSTRAP_USERS_FILE` | bootstrap only | absolute path to an operator-owned JSON list outside Git |
| `NEXT_PUBLIC_SITE_URL` | yes | for absolute URLs in emails / redirects |
| `RESEND_API_KEY` | yes | transactional email (consumer confirmation + admin notification) |
| `RESEND_FROM_EMAIL` | optional | sender — defaults to `noreply@holyimpactmedia.com` |
| `ADMIN_EMAIL` | yes | receives the per-lead notification |
| `UNSUBSCRIBE_EMAIL` | optional | CAN-SPAM footer mailto |
| `HOLY_IMPACT_MAILING_ADDRESS` | optional | CAN-SPAM footer physical address |
| `USHA_ENABLED` | yes (`true`/`false`) | feature flag for the marketplace post; off → leads go `pending` |
| `USHA_API_URL` / `USHA_API_KEY` | only if `USHA_ENABLED=true` | LeadArena/USHA credentials |
| `ANTHROPIC_API_KEY` | yes | Claude API for AI lead scoring |
| `ANTHROPIC_MODEL` | optional | pinned scoring model; defaults to `claude-sonnet-4-6` |
| `TRUSTEDFORM_API_KEY` | yes | TCPA certificate claim |

`pnpm vercel env pull` to sync from Vercel for local dev. Never commit `.env.local`.

## Deploy order

**Schema before app, always.** In Supabase mode, apply Supabase migrations first. In Neon mode, run Drizzle migrations against `DATABASE_URL_DIRECT` first. [`/api/health`](../app/api/health/route.ts) returns `503` when the active provider or `leads` table is unavailable.

```bash
# 1. Apply pending migrations
supabase db push

# 2. Deploy the app
vercel --prod
```

For Neon preview deploys, use a disposable Neon branch, run `pnpm db:migrate` twice, and confirm the second run is a no-op before deploying with `PLATFORM_PROVIDER=neon`.

## Apply migrations

```bash
supabase link --project-ref <ref>          # one-time per machine
supabase db push                            # idempotent; safe to re-run
supabase gen types typescript --linked > lib/types/database.ts
```

Migrations live in [`supabase/migrations/`](../supabase/migrations) with `<YYYYMMDDHHMMSS>_*.sql` names. Never edit a migration that has shipped — write a new one.

## Promote the first admin

After someone signs up they get a `profiles` row with `role='agent'` (auto-provisioned by the trigger). Promote them via the Supabase SQL editor:

```sql
update public.profiles set role='admin' where email='you@example.com';
```

Verify:

```sql
select email, role from public.profiles order by email;
```

The change is instant — there is no JWT cache; [`requireAdmin`](../lib/auth/requireAdmin.ts) reads `profiles` on every request (memoized per request via `cache()`).

## Promote a super admin

`superadmin` adds the Settings panel (`/dashboard/settings`) on top of full admin access. Same SQL path — promote an existing `profiles` row:

```sql
update public.profiles set role='superadmin' where email='you@example.com';
```

The `20260529000000_superadmin_and_settings.sql` migration already promotes `holyimpactmedia@gmail.com` if that account has signed up; re-run the `update` above if they sign up later. From the Settings panel a super admin can toggle the **Projections** section off — that hides it from the nav and blocks `/dashboard/projections` for everyone (the flag lives in `app_settings.projections_enabled`).

## Health check

`GET /api/health` returns:

| Status | Body | Meaning |
|---|---|---|
| `200` | `{"status":"ok","provider":"…"}` | App + active database + `leads` table all reachable |
| `503` | `{"status":"error","reason":"database_unconfigured","provider":"…"}` | Active provider credentials are missing |
| `503` | `{"status":"error","reason":"leads_table_unreachable",…}` | App is up but the `leads` table isn't (usually = migration not applied) |

## USHA marketplace alerts

USHA failures **do not** silently pile up. On a terminal `failed` status, the per-lead admin notification email surfaces the `ushaResult` — search your inbox for `USHA: failed`. The dashboard's "Sent to Marketplace" stat and the Marketplace filter (set to `failed`) let you triage the backlog.

If USHA goes down for an extended period, leads will accumulate as `pending` (when disabled) or `failed` (when enabled and erroring). The bounded retry in [`lib/usha/postLead.ts`](../lib/usha/postLead.ts) is 3 attempts; persistent outages need either: (a) replaying via a script that re-calls `postLeadToUsha` for affected rows, or (b) upgrading to a Vercel Queue / Workflow (noted in [PIPELINE.md](./PIPELINE.md)).

## Common failures

| Symptom | Cause | Fix |
|---|---|---|
| Dashboard shows all zeros, no errors | Migration not applied (`PGRST205`) | `supabase db push`; check `/api/health` |
| Admin redirected to `/` after login | Their `profiles.role` is `agent`, not `admin` | Promote via SQL (see above) |
| Realtime not updating the table | Either `supabase_realtime` publication missing `leads`, or RLS authorization is off for the channel | Re-run the baseline migration's `ALTER PUBLICATION` line; check Supabase dashboard → Database → Replication |
| Login goes to `/dashboard/admin` then bounces to `/` | The user is logged in but not an admin — expected behavior | Promote them |
| `/api/leads` returning 429 | Rate limit hit from one IP | Wait 10 min, or tune the limiter in [`lib/rate-limit.ts`](../lib/rate-limit.ts) |
| Leads stuck `usha_status='pending'` | `USHA_ENABLED` is `false` or credentials missing | Set `USHA_ENABLED=true` + add API URL/key |

## Tests

`pnpm test` runs Vitest. The suite covers `safeRedirect` (open-redirect guard), `csvCell` (CSV injection), `splitShares` (partner reconciliation), `startOfTodayUtc` (TZ boundaries), `checkRateLimit`, and `/api/leads` route validation.

`pnpm build` runs Next's full type-check. **`ignoreBuildErrors` is off** — a type error fails the build.
