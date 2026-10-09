# Security Model

Source of truth: [`lib/auth/server.ts`](../lib/auth/server.ts), [`lib/auth/requireAdmin.ts`](../lib/auth/requireAdmin.ts), [`lib/auth/permissions.ts`](../lib/auth/permissions.ts), [`lib/platform/provider.ts`](../lib/platform/provider.ts), [`proxy.ts`](../proxy.ts), [`lib/auth/safeRedirect.ts`](../lib/auth/safeRedirect.ts).

## Accounts and roles

Better Auth (self-hosted, email and password) stores users and sessions in Neon. Public signup is disabled in every deployed environment; accounts come only from a super admin's Users page or the local one-time bootstrap script. Email verification is required to sign in; invited accounts are marked verified because a super admin vouched for them.

Roles live on the Better Auth `user` row: `user` (no dashboard), `admin` (leads, projections), `superadmin` (also Users and Settings). The role field is server-owned (`input: false` in the admin plugin), so `POST /api/auth/update-user` with a role is rejected, and the custom roles grant no `user` permissions, so `admin/set-role` is denied too.

## Fail closed

[`lib/platform/provider.ts`](../lib/platform/provider.ts) decides whether the platform is configured. A deployed environment (Vercel production or preview) missing `DATABASE_URL`, `BETTER_AUTH_SECRET` or the site URL, or holding the public placeholder secret or database URL, is not configured (the site URL is checked for presence only, so a wrong origin is accepted and breaks sign-in and email links rather than failing closed): the dashboard renders the setup screen and `/api/auth/*` answers 503 before Better Auth loads. `lib/auth/server.ts` throws rather than sign anything with a placeholder in a deployed runtime.

## Where the gate runs

| Layer | What it does |
|---|---|
| Proxy ([`proxy.ts`](../proxy.ts)) | Sends `/dashboard/*` requests without a session cookie to `/auth/login`. Optimistic only; it never checks the role, and it steps aside when the platform is unconfigured so the setup screen can render. |
| Layout ([`app/dashboard/layout.tsx`](../app/dashboard/layout.tsx)) | `requireAdmin()`: the authoritative page gate (admin or superadmin). |
| Pages | `requireAdmin()` again (admin, projections) or `requireSuperAdmin()` (users, settings). React `cache()` shares one session read per request. |
| Admin API routes | `requireAdminApi()` / `requireSuperAdminApi()` return 401/403 JSON before any database access. A guard test ([`app/api/admin/auth-guard.test.ts`](../app/api/admin/auth-guard.test.ts)) discovers every route under `app/api/admin/**` from disk and proves it answers 401 with no session, 403 for a signed-in `user`, and 403 for an `admin` on the super-admin-only routes, before any database, data store or auth API call. |
| Server actions | The Settings save action re-checks `requireSuperAdmin()` itself. |

There is no database-level row security: the migration enables none, and the app connects with one Neon role from `DATABASE_URL`, so the app-layer gates above are the boundary. The browser never queries the database directly; every dashboard read goes through `/api/admin/*`.

## Sessions

7-day sessions, refreshed daily, checked against the database on every request (cookie cache off), so revoking a session or removing a user takes effect immediately. Resetting a password revokes that user's other sessions.

## Invites and password resets

Invites and resets use the same one-time link (1 hour). No password is ever typed, shown or emailed by a super admin; an invited account gets an unguessable throwaway password it never sees. Expired or used links land on a page that says so and offers a new link. With `RESEND_API_KEY` unset, invites and resets send nothing.

## Open redirect on login

[`lib/auth/safeRedirect.ts`](../lib/auth/safeRedirect.ts) validates `redirectTo`: same-origin relative paths with a single leading `/` only. Tested in [`lib/auth/safeRedirect.test.ts`](../lib/auth/safeRedirect.test.ts).

## Unsubscribe page

`/api/unsubscribe` records the address in `email_suppressions` and shows a confirmation page; the email address from the link is HTML-escaped before it is shown. A failed database write is logged and the requester still sees success.

## CSV formula injection

Lead fields are untrusted. [`lib/csv.ts`](../lib/csv.ts) prefixes any cell starting with `= + - @ \t \r` with a single quote. Tested in [`lib/csv.test.ts`](../lib/csv.test.ts). Exports are built server-side by `/api/admin/export`.

## Rate limiting

`/api/leads` is public and spends money per call. [`lib/rate-limit.ts`](../lib/rate-limit.ts) is an in-memory limiter (8 requests per 10 minutes per IP), best-effort across instances; the duplicate-email check in the route is the backstop. Better Auth's own rate limiting uses its default in-memory store, so it is also per instance.

## TrustedForm

TrustedForm claims run server side only, from the lead intake's background work. There is no public claim route, so nobody else can spend Dynasty's claims or read its certificates.

## Known limits

- The app's single Neon role has full read and write on every table; a role limited to what the app needs would narrow the blast radius of a code bug.
- Rate limits are per server instance, not shared.
