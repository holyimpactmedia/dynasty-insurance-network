# Database Schema

Source of truth: [`supabase/migrations/`](../supabase/migrations). The generated TypeScript types live at [`lib/types/database.ts`](../lib/types/database.ts) and are regenerated with `supabase gen types typescript`.

## Migration workflow — Supabase CLI

```bash
# one-time
supabase init               # if supabase/config.toml does not exist
supabase login              # uses a personal access token
supabase link --project-ref gkrhzjhhcaykckypxygt

# day-to-day
supabase migration new <descriptive-name>   # creates a timestamped file
# edit the file…
supabase db push                            # applies it to the linked project
supabase gen types typescript --linked > lib/types/database.ts
```

Never edit `supabase/migrations/<timestamp>_baseline.sql` after it ships. Every schema change is a new numbered migration file. The CLI handles ordering — we do not paste SQL into the dashboard by hand.

## Tables

### `leads` — the lead pass-through record
Every column the consumer funnels POST plus the pipeline state. 32 columns total.

| Group | Columns |
|---|---|
| Identity | `id` (uuid PK), `reference_number` (unique), `created_at`, `updated_at` |
| Contact | `first_name`, `last_name`, `email`, `phone`, `age`, `state` |
| Qualification | `income_range`, `household_size`, `qualifying_event`, `priorities`, `quiz_answers` (jsonb) |
| TCPA / TrustedForm | `tcpa_consent`, `tcpa_consent_at`, `trusted_form_cert_url` |
| Attribution | `funnel_type` (default `private_health`), `utm_source/medium/campaign`, `ip_address` |
| AI scoring | `ai_score`, `ai_score_reasons` (text[]), `predicted_close_rate`, `ai_scored_at` |
| Marketplace | `sell_price` (default 28), `usha_status` (`pending`/`sent`/`failed`), `usha_sent_at`, `usha_lead_id` |
| Legacy | `status` (defaults to `new`; kept for back-compat — no CRM pipeline is built on it) |

Acquisition cost and gross margin are **not** stored per row. Acquisition cost is a portfolio number (ad spend ÷ leads); modeling it per row would bake a fictional number into the schema. The slider-based `ProjectionsCalculators` handles cost / ROI scenarios.

### `profiles` — the authorization source of truth
One row per `auth.users`. `role text not null default 'agent' check (role in ('agent','admin'))`. Writable **only** by the service role / SQL — there is no client-side write policy. Auto-provisioned by an `AFTER INSERT ON auth.users` trigger; existing users were backfilled in the baseline migration.

### `email_suppressions` — CAN-SPAM unsubscribe list
`email text primary key`, `source text`, `suppressed_at timestamptz`. Written only by [`/api/unsubscribe`](../app/api/unsubscribe/route.ts) via service role.

## Functions

| Function | Use |
|---|---|
| `public.is_admin(uid uuid)` | `SECURITY DEFINER`, `SET search_path = public`. The recursion-safe admin check called by every RLS policy and by [`requireAdmin`](../lib/auth/requireAdmin.ts). |
| `public.handle_new_user()` | Trigger function — auto-creates a `profiles` row for every new auth user with `role='agent'`. |
| `public.set_updated_at()` | Trigger function — keeps `updated_at` fresh. |

## Aggregate RPCs (dashboard)

All `SECURITY INVOKER` (respect RLS — the admin's session). All bucketed in `America/New_York`.

| RPC | Returns |
|---|---|
| `get_pipeline_stats()` | one row: `total_leads`, `leads_today`, `leads_month`, `sent_count`, `sent_revenue`, `sent_revenue_month`, `tcpa_verified` |
| `get_daily_lead_counts()` | last 7 ET days: `(day date, count bigint)` |
| `get_funnel_breakdown()` | per funnel: `(funnel_type, leads, sent, revenue)` |

## Indexes

- `leads (email)` — used by intake dedup
- `leads (reference_number)` — implicit, from `UNIQUE`
- `leads (created_at DESC)` — every dashboard list/order
- `leads (usha_status)` — marketplace filter / sent count
- `leads (funnel_type)` — funnel filter / breakdown

## RLS policies

Enabled on `leads`, `profiles`, `email_suppressions`. Service role bypasses RLS everywhere.

| Table | Anon | Authenticated |
|---|---|---|
| `leads` | `INSERT` (public funnels) | `SELECT` if `is_admin(auth.uid())` |
| `profiles` | — | `SELECT` if own row or admin; no `INSERT`/`UPDATE` |
| `email_suppressions` | — | — (service-role only) |

The `leads` table is in the `supabase_realtime` publication so the dashboard's subscription receives inserts/updates.

## Common failure: `PGRST205`

`Could not find the table 'public.leads' in the schema cache` means the migration was not applied. Run `supabase db push` against the project. The app's [`/api/health`](../app/api/health/route.ts) returns `503` in this state.
