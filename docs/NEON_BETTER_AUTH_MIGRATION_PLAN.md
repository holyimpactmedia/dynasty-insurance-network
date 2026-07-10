# Neon + Better Auth Migration

**Status:** Implemented in code; infrastructure rehearsal and production cutover remain operator actions.  
**Prepared:** 2026-06-23  
**Scope:** Strict Supabase parity. No unrelated authentication, lead-processing, or product redesign.

## Architecture

| Capability | Rollback mode | Target mode |
|---|---|---|
| Switch | `PLATFORM_PROVIDER=supabase` (default) | `PLATFORM_PROVIDER=neon` |
| Database | Supabase Postgres | Neon Postgres |
| Runtime driver | Supabase SDK | `pg` + `drizzle-orm/node-postgres`, pooled URL |
| Migrations/imports | Supabase CLI/direct URL | Drizzle Kit/direct URL |
| Authentication | Supabase Auth | Better Auth email/password |
| Authorization | `profiles.role` | Better Auth `user`/`admin`/`superadmin` |
| Dashboard data | Authenticated Next.js APIs | Same APIs |
| Live updates | 8-second visible-tab polling | Same polling |

The temporary provider switch controls authentication and persistence together. Supabase remains the default until the production cutover. Browser code never receives a Neon connection string.

## Implemented changes

- Drizzle schema reproduces `leads`, `app_settings`, and `email_suppressions`, including marketplace constraint, indexes, timestamps, update triggers, and settings seeds.
- Better Auth core/Admin tables live in the same Neon database. Public signup is disabled unless the one-time `AUTH_BOOTSTRAP_MODE=true` guard is explicitly set.
- Custom roles grant dashboard read to `admin` and `superadmin`; only `superadmin` may change settings. Better Auth administrative user-management permissions are not granted.
- Resend sends password reset and verification messages. Sessions last seven days and are read from the database without role cookie caching.
- Dashboard search, filters, paging, stats, and CSV now use `/api/admin/*`; all routes repeat server-side authorization.
- Supabase Realtime was replaced with visible-tab polling: active page every 8 seconds, stats every 15 seconds, immediate refresh on focus, aborting stale requests.
- `lead_intake_paused` is internal-only. While true, `/api/leads` returns `503` and `Retry-After: 900`.
- Provider-neutral repositories back lead intake, AI writeback, USHA status, suppressions, settings, dashboards, and health checks.
- Scripts cover auth bootstrap, table-only migration, source/destination reconciliation, and post-cutover reverse synchronization.

## Configuration

Runtime:

```dotenv
PLATFORM_PROVIDER=supabase

# Rollback provider
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_DIRECT_URL=postgresql://...

# Target provider
DATABASE_URL=postgresql://...-pooler.../neondb?sslmode=require
DATABASE_URL_DIRECT=postgresql://.../neondb?sslmode=require
BETTER_AUTH_URL=https://dynastyinsurancegroup.com
BETTER_AUTH_SECRET=<32-plus-random-bytes>
```

`DATABASE_URL` is the pooled runtime credential. `DATABASE_URL_DIRECT` is used only by Drizzle and transfer scripts. Keep the runtime role non-owner and grant only required table access after schema provisioning.

Current project decision (2026-06-23): Supabase contains three disposable leads, no auth users, and no suppressions. The initial production move starts with empty Neon application tables, so `SUPABASE_DIRECT_URL`, the initial dump/restore, and source reconciliation are not required. Reverse sync still uses the existing Supabase URL and service-role key.

## Rehearsal

Use a disposable Neon branch and Vercel Preview.

1. Set Preview to `PLATFORM_PROVIDER=neon` with Preview-only Neon and Better Auth variables.
2. Apply the migration twice; the second invocation must be a no-op:

   ```bash
   pnpm db:migrate
   pnpm db:migrate
   pnpm db:verify
   ```

3. Bootstrap internal users from a JSON file stored outside Git:

   ```json
   [
     { "email": "owner@example.com", "name": "Owner Name", "role": "superadmin" },
     { "email": "admin@example.com", "name": "Admin Name", "role": "admin" }
   ]
   ```

   ```bash
   AUTH_BOOTSTRAP_MODE=true \
   AUTH_BOOTSTRAP_USERS_FILE=/absolute/private/path/users.json \
   pnpm auth:bootstrap
   ```

   The command generates unknown temporary passwords, marks known internal emails verified, assigns roles, and sends reset links. Never set bootstrap mode in a deployed environment.

4. Verify the empty Neon schema with `pnpm db:verify`.
5. Verify login, role denials, dashboard data, filters, CSV, settings, and one marked test lead.
6. Rehearse reverse synchronization using an ISO cutover timestamp; it writes through the Supabase service-role API and does not require a Supabase direct URL:

   ```bash
   CUTOVER_AT=2026-06-23T12:00:00Z pnpm db:rollback
   ```

7. Destroy the rehearsal branch and repeat from the written steps. Production requires two successful rehearsals and one reverse-sync rehearsal.

## Production cutover: one approved path

Use a 30-minute window. Do not queue or dual-write.

1. Freeze auth membership/role changes and record the deployment IDs and environment snapshots.
2. Pause paid campaigns.
3. Set Supabase `app_settings.lead_intake_paused=true` and verify intake returns retryable `503`.
4. Wait for existing `after()` activity to drain; confirm no new lead inserts or marketplace/AI updates are still arriving.
5. Apply Drizzle migrations to the empty production Neon database.
6. Run `pnpm db:verify`. The three disposable Supabase leads are deliberately not imported.
7. Run `pnpm auth:bootstrap` for `holyimpactmedia@gmail.com` as the initial superadmin and complete the password reset.
8. Deploy with `PLATFORM_PROVIDER=neon` and the target credentials.
9. Verify super-admin login.
10. Submit one clearly marked test lead; verify persistence, confirmation/admin email, TrustedForm, USHA status, AI score, dashboard display, export, and deduplication.
11. Set Neon `app_settings.lead_intake_paused=false`, verify intake, then resume campaigns.
12. Record the cutover timestamp and monitor for seven days.

## Rollback

Keep Supabase and both code adapters available for seven days. Do not change auth membership/roles during this period.

If Neon has accepted production activity:

1. Pause campaigns and set Neon `lead_intake_paused=true`.
2. Run `CUTOVER_AT=<recorded ISO timestamp> pnpm db:rollback`.
3. Reconcile Neon and Supabase.
4. Restore the recorded deployment/environment with `PLATFORM_PROVIDER=supabase`.
5. Verify Supabase health, admin login, and a marked lead.
6. Set Supabase `lead_intake_paused=false` and resume campaigns.

The rollback script upserts leads changed since cutover using `updated_at`, suppressions since cutover using `suppressed_at`, and the full settings set.

## Seven-day cleanup

After seven stable days and explicit approval:

- Remove the Supabase adapters, callback, packages, credentials, migrations from the active path, and `PLATFORM_PROVIDER` switch.
- Hardwire Neon/Better Auth.
- Preserve a final encrypted Supabase export according to backup policy.
- Update public/privacy and engineering documentation to remove migration-era dual-provider wording.
- Decommission Supabase only after the final backup and sign-off.

## Verification gates

```bash
pnpm lint
pnpm test
pnpm build
```

Additionally verify:

- Empty-schema migration and second-run no-op.
- Defaults, update triggers, indexes, numeric values, JSONB, arrays, and timestamps.
- No session, user, admin, and super-admin paths across every dashboard API.
- Public signup remains disabled outside bootstrap mode.
- Search, filtering, mobile/desktop paging, CSV formula protection, and polling.
- Two full migration rehearsals and one rollback rehearsal.

## Explicitly deferred

- Lead idempotency/dedup redesign.
- Lead-insert failure semantic changes.
- 2FA, OAuth, organizations, user-management UI, and impersonation.
- Audit-log/observability platform work.
- Data-retention policy changes.
- Font hosting and unrelated UI lint cleanup.
- New database constraints absent from Supabase.
