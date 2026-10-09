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

Timestamps are `timestamptz`. The data layer ([`lib/data/lead-mapper.ts`](../lib/data/lead-mapper.ts)) returns them to the app as ISO 8601 strings.

### `email_suppressions`: CAN-SPAM unsubscribe list
`email` (PK), `source`, `suppressed_at`. Written by `/api/unsubscribe`.

### `app_settings`: super admin settings
`key` (PK), `value` (jsonb), `updated_at` (trigger-maintained). Rows: `projections_enabled` (read by the dashboard), `lead_intake_paused` (present, not read by this app).

## Auth tables (Better Auth)

`user` (includes the admin plugin's `role`, `banned`, `ban_reason`, `ban_expires`), `session`, `account` (holds password hashes), `verification` (holds reset and verification tokens). Defined in [`lib/db/schema/auth.ts`](../lib/db/schema/auth.ts).

## Dashboard aggregates

Computed in [`lib/data/neon-store.ts`](../lib/data/neon-store.ts) (`getPipelineStats`, `getDailyLeadCounts`, `getFunnelBreakdown`), bucketed in `America/New_York` to match [`lib/time/ranges.ts`](../lib/time/ranges.ts).
