# Dynasty on Neon: design spec

**Date:** 2026-10-05
**Status:** spec approved by the owner on 2026-10-06. No code is written until the implementation plan (`docs/plan.md`) clears the plan gate and the owner approves it.
**Sequencing (owner decision):** the legal compliance verification ran first and finished on 2026-10-06 (branch `legal/dynasty-compliance`, preview sent to counsel).

**Premise:** production cannot save leads to its database or let anyone log in, because the Supabase project behind it is unreachable.
**Observed:** 2026-10-05. `https://www.dynastyinsurancenetwork.com/api/health` returns `503 {"reason":"leads_table_unreachable","detail":"TypeError: fetch failed"}`, and the Supabase project host no longer resolves in DNS. Lead intake still sends the admin and consumer emails, but the database insert fails, so no lead (and no TCPA consent record) is stored.

---

## 1. Goal and success criteria

Move the live Dynasty site from Supabase to Neon so that:

1. Every funnel submission is stored in Neon with the same fields it stores today, including the TCPA evidence fields.
2. The owner can log in to the admin dashboard with email and password, and reset a forgotten password by email.
3. The dashboard shows leads, stats, projections and CSV export from Neon.
4. A super admin can invite admins (set-password link) and manage the Settings page.
5. No consumer-facing wording that legal reviewed changes, and nothing from the Union Private Healthcare rebrand ships.
6. Supabase code and packages are gone from the repo.

## 2. Decisions

| Decision | Why |
|---|---|
| **Dynasty stays the brand.** Nothing Union ships. | Owner: "we're still focused on Dynasty, not switching to Union yet." Legal reviewed Dynasty only. |
| **Approach: copy backend-only files from `origin/redesign/union-private-healthcare`, hand-merge the shared files.** | That branch already contains a tested Neon + Better Auth + Drizzle stack, and the live Neon schema was generated from it. Replaying its commits would drag the rebrand along; a rewrite would discard tested code. |
| **Fresh start, no Supabase data copy.** | Owner: existing Supabase rows are test leads only. |
| **Login stays self-hosted Better Auth** (not Neon's managed "Neon Auth"). | The two real accounts already live in Better Auth tables in Neon; switching would mean recreating them for no gain. |
| **Users page invites by set-password link**, not a temporary password. | No password ever passes through the super admin or a text message. Owner approved. |
| **Settings page included.** | Owner scope choice. |
| **Meta Pixel + Conversions API built, switched off in production until legal approves.** | Dynasty privacy policy §7.2 says "We do not share the personal information you submit through quiz forms with advertisers." Meta's server events send hashed email, phone, name and ZIP from those forms to Meta. Legal has not reviewed Meta. Owner's standing rule: legal decides; conservative default meanwhile. |
| **Work happens on `feat/dynasty-neon` in a separate git worktree off `main`.** | The uncommitted legal work on `legal/dynasty-compliance` stays untouched. The two branches land independently. |

## 3. Verified starting state (2026-10-05)

**Neon (queried read-only):**
- Tables: `user`, `session`, `account`, `verification`, `leads`, `email_suppressions`, `app_settings`, plus `drizzle.__drizzle_migrations`.
- Accounts: `holyimpactmedia@gmail.com` (role `superadmin`, verified), `samlamy@becomedynasty.com` (role `admin`, verified).
- `leads`: 1 test row.
- `leads` columns include every field Dynasty's `app/api/leads/route.ts` inserts today (`reference_number` through `status`). **No schema change is needed for the port.**

**Supabase dependencies on `main`** (full inventory taken 2026-10-05):
- Clients: `lib/supabase/{client,server,middleware,admin}.ts`.
- Auth: `app/auth/login/page.tsx` (`signInWithPassword`), `proxy.ts` session refresh, `lib/auth/requireAdmin.ts` (role from `profiles`), `components/dashboard/DashboardNav.tsx` (`signOut`), `app/auth/callback/route.ts` (unused).
- Queries: `leads` (intake insert and dedupe, health count, AI score update, USHA status update, dashboard reads, CSV export), `profiles`, `email_suppressions` (unsubscribe upsert).
- RPCs: `get_pipeline_stats`, `get_daily_lead_counts`, `get_funnel_breakdown`.
- Realtime: `components/dashboard/AdminDashboardClient.tsx` subscribes to `leads` inserts and updates.
- Security today rests on Supabase row rules (`is_admin(auth.uid())`); the browser reads `leads` directly.
- Tests: `app/api/leads/route.test.ts` mocks the Supabase admin client.

## 4. Work order

Each step ends working with tests green before the next starts. **Steps 1 to 4 deploy together as one release**; a half-switched site is worse than either side. Step 5 can release separately.

### Step 1. Foundation
- Add packages: `better-auth`, `drizzle-orm`, `pg`, `@types/pg`, `drizzle-kit` (versions as on the redesign branch, re-checked against current releases at build time).
- Copy: `lib/db/client.ts`, `lib/db/schema/{app,auth,index}.ts`, `drizzle.config.ts`, `drizzle/` (migration + meta), `scripts/verify-neon-schema.ts`, `package.json` scripts `db:generate`, `db:migrate`, `db:verify`.
- `app/api/health/route.ts` reads Neon.
- No database change: `db:verify` must pass against the existing Neon schema.

### Step 2. Login
- Copy: `lib/auth/{server,client,permissions,bootstrap}.ts` (+ tests), `app/api/auth/[...all]/route.ts`, `scripts/bootstrap-auth-users.ts`, `lib/email/{sendAuthEmail,fromAddress}.ts` (+ test).
- New pages in the Dynasty look: `app/auth/forgot-password/page.tsx`, `app/auth/reset-password/page.tsx`; login form rebuilt on Better Auth in the existing Dynasty login design.
- Hand-merge: `lib/auth/requireAdmin.ts` (role from the Better Auth session; accepts `admin` and `superadmin`; adds `requireSuperAdmin` / `requireSuperAdminApi`), `proxy.ts` (cookie-presence redirect only), `app/auth/error/page.tsx`, `components/dashboard/DashboardNav.tsx` (sign out).
- Every visible string Dynasty-branded (for example the Better Auth `appName` and all auth email copy).

### Step 3. Lead intake and background jobs
- Hand-merge to Neon: `app/api/leads/route.ts` (+ test rewritten off the Supabase mock), `app/api/unsubscribe/route.ts`, `lib/ai/scoreLeadWithAI.ts`, `lib/usha/postLead.ts`, `lib/types/lead.ts`.
- Copy the data layer: `lib/data/{store,neon-store,types,lead-mapper,dashboard-view}.ts`, `lib/api/lead-filters.ts` (+ test).
- The fields written per lead are identical to today's insert.

### Step 4. Dashboard, Users, Settings, Supabase removal
- Copy: `app/api/admin/{leads,stats,export,users}/route.ts` (+ users test).
- Hand-merge, keeping the Dynasty look: `app/dashboard/{layout,admin/page,projections/page}.tsx`, `components/dashboard/{AdminDashboardClient,LeadDetailDrawer,SetupRequired}.tsx`. Lead data loads through the admin routes (server side, role-checked) instead of directly in the browser. Realtime becomes polling every 8 to 15 seconds.
- Users page: `app/dashboard/users/page.tsx`, `components/dashboard/UsersPanel.tsx`, `lib/email/sendPortalInvite.ts`. **Changed from the redesign version:** the super admin enters name, email and role only; the account is created and a one-time set-password link is emailed. Tests updated to match.
- Settings page: `app/dashboard/settings/{page,loading}.tsx`, `components/dashboard/SettingsPanel.tsx`, `lib/settings.ts`.
- Delete: `lib/supabase/*`, `app/auth/callback/route.ts`, `lib/types/database.ts`, `supabase/migrations/*` (history stays in git; `drizzle/` becomes the schema source of truth), `scripts/001_create_tables.sql`, the `@supabase/*` packages, and the Supabase variables from `.env.example`.
- Docs updated: `docs/RUNBOOK.md`, `docs/SCHEMA.md`, `docs/SECURITY.md`, `docs/README.md`, plus a Dynasty version of the Neon cutover runbook.

### Step 5. Meta tracking (switched off in production)
- Copy: `lib/meta/{config,hash,capi,pixel-client}.ts` (+ tests), `components/meta/MetaPixel.tsx`.
- New wiring (not a copy): fire the `Lead` event from each live Dynasty funnel's submit, deduplicated with the server event by a shared event id.
- An explicit production kill switch keeps the pixel and server events off regardless of which Meta variables are present, until legal approves. The privacy policy is not edited in this branch.

### Step 6. Production switch (hard stop)
See section 7.

## 5. Security design

- **Accounts:** created only by a super admin (Users page) or the local one-time bootstrap script. Public signup is disabled in every deployed environment.
- **Sessions:** 7-day expiry; the cookie cache stays off, so every request checks the session in the database and revocation is immediate.
- **Role checks:** the proxy redirects requests with no session cookie away from `/dashboard`; the authoritative check runs in the dashboard layout, each page, and every admin API route. Users and Settings are super admin only.
- **No self-promotion:** the role field cannot be written by the user through the auth API. A test signs in as an admin, attempts to set its own role to `superadmin`, and must fail.
- **Fail closed:** the redesign code falls back to a hard-coded placeholder secret and a dummy database when variables are missing. On Dynasty, a deployed environment (Vercel production or preview) with `BETTER_AUTH_SECRET` or `DATABASE_URL` missing refuses all logins and renders the existing "setup required" screen.
- **App-layer authorization replaces row rules:** the app connects to Neon as the database owner, so every admin route must check the role. A guard test calls every route under `app/api/admin/` without a session and expects 401 from each.
- **Cookie origin:** `BETTER_AUTH_URL` is exactly `https://www.dynastyinsurancenetwork.com` in production (the apex redirects to `www`), and the stable branch alias in preview.
- **Known limits left in place** (each needs a database change, out of scope): the app uses the Neon owner role rather than a restricted one; Better Auth's rate limiter is per server instance (memory).

## 6. Compliance guards

1. **No consumer-copy changes.** A check diffs these paths against `main` and fails on any difference: `app/page.tsx`, every funnel `app/<funnel>/page.tsx` and `layout.tsx`, `app/layout.tsx`, `app/terms/page.tsx`, `app/privacy/page.tsx`, `components/Footer.tsx`, `components/ExitIntentDialog.tsx`, `lib/email/sendLeadConfirmation.ts`. Step 5 may add the Meta component mount to `app/layout.tsx` only; that single allowed difference is listed explicitly in the check.
2. **TCPA evidence parity.** A test submits each live funnel's payload and asserts the stored record carries `tcpa_consent`, `tcpa_consent_at`, `trusted_form_cert_url`, `ip_address`, `funnel_type`, UTM fields and `quiz_answers` exactly as the current insert builds them.
3. **Unsubscribe.** A test confirms the unsubscribe route writes to `email_suppressions` in Neon.
4. **No Union.** A check fails if `Union Private Healthcare`, `unionprivatehealthcare`, or `components/union` appears in `app/`, `components/`, `lib/` or `scripts/`.
5. **Every guard is proven able to fail** (a deliberate violation first, then removed) before it is trusted.
6. **Legal branch protection.** Before the worktree is created, the uncommitted legal work is committed to `legal/dynasty-compliance` (local only, not pushed). Whichever of the two branches lands second is rebased and every guard re-runs.

## 7. Verification, production switch, rollback

**Preview (its own Neon branch, never production data):**
- `pnpm build`, `pnpm exec tsc --noEmit`, lint, `pnpm test`, and the guards in section 6.
- `db:verify` against the preview Neon branch.
- Browser walk in the built-in browser: one clearly marked test lead through each live funnel; check the stored record, the admin email, the consumer email (wording unchanged) and the unsubscribe link; owner sets a password via the emailed link and signs in; the admin account is refused on Users and Settings; a new lead appears on the dashboard within 15 seconds; CSV export downloads; screenshots at desktop and mobile.

**Production switch (hard stop; owner approves at that moment):**
1. Record the current production deployment id.
2. Production variables: `DATABASE_URL` (Neon pooled URL of the main branch holding the two accounts), a newly generated `BETTER_AUTH_SECRET` (not the laptop value), `BETTER_AUTH_URL` and `NEXT_PUBLIC_SITE_URL` = `https://www.dynastyinsurancenetwork.com`, plus the existing Resend, admin email and Anthropic variables.
3. Merge `feat/dynasty-neon` to `main` and deploy.
4. Check `/api/health` returns 200 from Neon, the owner logs in, and one marked test lead flows end to end.

**Rollback:** Vercel instant rollback to the recorded deployment returns the site to today's state (leads arrive by email only). Supabase variables stay in Vercel for 7 days after the switch; then they are removed and the Supabase project is closed.

## 8. Out of scope (tracked separately)

- **Legal Phase 6 verification** of the legal remediation (53-screen coverage matrix against `~/Desktop/dynasty/Dynasty_Screenshots_Reviewed EAG .docx` and `~/Desktop/dynasty/5-31-26 Terms EAG Redline.docx`). Runs first, on `legal/dynasty-compliance`.
- **TrustedForm claim bug:** `app/api/leads/route.ts` sends `certificateUrl`; `app/api/trustedform/claim/route.ts` reads `certUrl`, so every claim returns 400. Separate fix.
- Restricted database role and database-backed rate limiting.
- Everything Union: rebrand, universal quiz, ZIP-to-state, Union emails.

## 9. Question for legal (Erica Gibbs)

May Dynasty send Meta (Facebook) a "Lead" event when a visitor submits a quiz form, including SHA-256 hashed email, phone, name and ZIP for ad matching? If yes, what wording replaces privacy policy §7.2 ("We do not share the personal information you submit through quiz forms with advertisers")? Until answered, Meta tracking stays off in production.
