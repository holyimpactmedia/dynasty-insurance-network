# Security Model

> Migration note (2026-06-23): when `PLATFORM_PROVIDER=neon`, Better Auth is authoritative and Neon is reachable only from server code. Custom `admin`/`superadmin` roles preserve the current boundary; public signup is disabled outside the guarded bootstrap command. When the provider is `supabase`, the existing profile/RLS model below remains active for rollback.

Source of truth: [`lib/auth/requireAdmin.ts`](../lib/auth/requireAdmin.ts), [`lib/auth/safeRedirect.ts`](../lib/auth/safeRedirect.ts), [`lib/auth/server.ts`](../lib/auth/server.ts), [`lib/auth/permissions.ts`](../lib/auth/permissions.ts), and—while rollback support remains—[`supabase/migrations/20260518000000_baseline.sql`](../supabase/migrations/20260518000000_baseline.sql).

## Neon + Better Auth authorization

Better Auth uses email/password only. Public signup is disabled unless the one-time bootstrap process is explicitly enabled. `user` has no dashboard access, `admin` may read dashboard data, and `superadmin` additionally controls settings. Session and role validation occurs in the protected dashboard layout and every `/api/admin/*` route; the proxy's cookie-presence check is only an optimistic redirect. Session cookie caching is intentionally disabled so role changes are authoritative immediately.

The browser never connects to Neon. Dashboard data, filtering, paging, polling, and CSV export pass through authenticated server routes. The temporary `PLATFORM_PROVIDER` switch changes authentication and persistence together, preventing mixed Better Auth/Supabase browser sessions.

## Authorization — the `profiles` model

Role lives in `public.profiles.role` (`agent`, `admin`, or `superadmin`). The role is writable **only** by the service role / SQL — never by the app and never by the user. Why this matters: an earlier version of the app gated on `user.user_metadata.role`, which is freely writable by the user (`supabase.auth.updateUser({ data: { role: 'admin' } })`). Anyone with an account could self-promote. The `profiles` model closes that hole.

`superadmin` is a strict superset of `admin`: it sees everything an admin does **plus** the super-admin-only Settings panel (`/dashboard/settings`), where platform feature flags live. `is_admin()` returns true for both roles, so a super admin keeps full admin access; `is_superadmin()` gates the Settings panel and `app_settings` writes. Gates: [`requireAdmin()`](../lib/auth/requireAdmin.ts) (admin **or** super admin) and `requireSuperAdmin()` (super admin only) in the same file.

`public.is_admin(uid)` is a `SECURITY DEFINER` function:

```sql
create or replace function public.is_admin(uid uuid)
returns boolean
language sql security definer stable set search_path = public
as $$
  select exists (select 1 from public.profiles where id = uid and role in ('admin','superadmin'))
$$;
```

`public.is_superadmin(uid)` mirrors it but matches `role = 'superadmin'` only. It gates the `app_settings` write policy (RLS), so even if the in-app server action were bypassed, only a super admin's session can change a flag.

Because `SECURITY DEFINER` runs as the function owner, the `select` inside is **not** re-checked against the `profiles` RLS policy — so a policy on `profiles` can call `is_admin()` without infinite recursion. `SET search_path = public` is mandatory; without it, an attacker who can create a function in another schema could intercept the lookup.

## Where the gate runs

| Layer | What it does |
|---|---|
| Middleware ([`lib/supabase/middleware.ts`](../lib/supabase/middleware.ts)) | Refreshes the session; redirects unauthenticated requests off `/dashboard`; redirects logged-in users on `/auth/*` to `/dashboard/admin`. **It does not check role** — middleware on Edge cannot cheaply read `profiles`. |
| Layout ([`app/dashboard/layout.tsx`](../app/dashboard/layout.tsx)) | Calls `requireAdmin()` — the authoritative gate. Server-side, runs before any dashboard page renders. |
| Page (admin / projections) | Calls `requireAdmin()` again as defense in depth. React `cache()` dedupes — the layout's read and the page's read share one round-trip. |
| Admin API routes | `/api/admin/leads`, `/api/admin/stats`, and `/api/admin/export` use `requireAdminApi()` and return `401`/`403` JSON instead of redirecting. |
| Database | `leads` `SELECT` policy uses `is_admin(auth.uid())`. Even if every above layer is bypassed, RLS returns zero rows to a non-admin. |

**Verified live** during PR1 rollout: with a test admin and a freshly created non-admin authenticated user, the non-admin's `select` on `leads` returns `[]`, confirming RLS is the real boundary — not just the redirect.

## RLS policy matrix

| Table | `anon` | `authenticated` non-admin | `authenticated` admin | `service_role` |
|---|---|---|---|---|
| `leads` | `INSERT` only (public funnels) | — | `SELECT` | full |
| `profiles` | — | `SELECT` own row | `SELECT` all | full |
| `email_suppressions` | — | — | — | full |

The `leads` table is in `supabase_realtime` publication so the dashboard's subscription works. RLS applies to realtime payloads too — non-admins do not receive events.

## Seeding the first admin

The signup trigger always creates `role='agent'`. Promote by SQL:

```sql
update public.profiles set role='admin' where email='you@example.com';
```

Run from the Supabase SQL editor (service role). The app never sets `role`.

## Open redirect on login

[`lib/auth/safeRedirect.ts`](../lib/auth/safeRedirect.ts) validates the `redirectTo` query param at login, signup, and OAuth callback. Accepts a same-origin relative path starting with a single `/`. Rejects `//evil.com`, `/\\evil`, `https://evil.com`, and control-character tricks. Falls back to `/dashboard/admin`.

Tested in [`lib/auth/safeRedirect.test.ts`](../lib/auth/safeRedirect.test.ts).

## CSV formula injection

Lead fields (names, UTM values, etc.) come from untrusted public form submissions. A lead named `=HYPERLINK("http://evil/")` executes as a formula when the admin opens the CSV in Excel or Google Sheets. [`lib/csv.ts`](../lib/csv.ts) prefixes any cell starting with `= + - @ \t \r` with a single quote. Tested in [`lib/csv.test.ts`](../lib/csv.test.ts).

## Rate limiting

`/api/leads` is a public POST that spends money per call (Anthropic + Resend + USHA). [`lib/rate-limit.ts`](../lib/rate-limit.ts) is an in-memory sliding-window limiter (default 8 requests / 10 min per IP). It is best-effort across serverless instances — the DB-level duplicate-email check inside the route is the reliable backstop against scripted replays.

## Service-role key

`SUPABASE_SERVICE_ROLE_KEY` is server-only ([`lib/supabase/admin.ts`](../lib/supabase/admin.ts) reads `process.env`, **not** `NEXT_PUBLIC_*`). Never import `admin.ts` into a client component. Used inside `after()` work and the lead intake insert.

## What we do **not** do

- We do not trust `user_metadata` for authz. The signup form no longer sets it; if it were set, the gate ignores it.
- We do not expose a UI to change roles. Promotion is a database operation.
- We do not run admin-side database access from the browser. Reads and exports go through `/api/admin/*`; settings mutations remain server-side.
