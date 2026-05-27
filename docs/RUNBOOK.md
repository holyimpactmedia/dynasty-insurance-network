# Runbook

Source of truth: [`.env.example`](../.env.example), [`supabase/migrations/`](../supabase/migrations), and the route at [`app/api/health/route.ts`](../app/api/health/route.ts).

## Environment variables

See [`.env.example`](../.env.example) for the full list with safe placeholder values. The short version:

| Var | Required? | What it does |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | public anon key (in client JS) |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | server-only — bypasses RLS for intake / admin operations |
| `NEXT_PUBLIC_SITE_URL` | yes | for absolute URLs in emails / redirects |
| `RESEND_API_KEY` | yes | transactional email (consumer confirmation + admin notification) |
| `RESEND_FROM_EMAIL` | optional | sender — defaults to `noreply@holyimpactmedia.com` |
| `ADMIN_EMAIL` | yes | receives the per-lead notification |
| `UNSUBSCRIBE_EMAIL` | optional | CAN-SPAM footer mailto |
| `HOLY_IMPACT_MAILING_ADDRESS` | optional | CAN-SPAM footer physical address |
| `USHA_ENABLED` | yes (`true`/`false`) | feature flag for the marketplace post; off → leads go `pending` |
| `USHA_API_URL` / `USHA_API_KEY` | only if `USHA_ENABLED=true` | LeadArena/USHA credentials |
| `ANTHROPIC_API_KEY` | yes | Claude API for AI lead scoring |
| `TRUSTEDFORM_API_KEY` | yes | TCPA certificate claim |

`pnpm vercel env pull` to sync from Vercel for local dev. Never commit `.env.local`.

## Deploy order

**Schema before app, always.** If the app is deployed against a project missing the migration, every dashboard query 404s (`PGRST205`) and `safeData` masks it. [`/api/health`](../app/api/health/route.ts) returns `503` in this state — wire it into your uptime check.

```bash
# 1. Apply pending migrations
supabase db push

# 2. Deploy the app
vercel --prod
```

For preview deploys against a non-production database, link a separate Supabase project and `supabase db push` to it first.

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

## Health check

`GET /api/health` returns:

| Status | Body | Meaning |
|---|---|---|
| `200` | `{"status":"ok"}` | App + Supabase + `leads` table all reachable |
| `503` | `{"status":"error","reason":"supabase_unconfigured"}` | Missing `SUPABASE_SERVICE_ROLE_KEY` or URL |
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
