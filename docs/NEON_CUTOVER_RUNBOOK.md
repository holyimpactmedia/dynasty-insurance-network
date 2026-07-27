# Neon Cutover Runbook + Vercel Environment Variables

**Prepared:** 2026-07-20
**Applies to branch:** `redesign/union-private-healthcare` (commit `72a0b1d` and later, where Supabase was removed from the code).

This is the path from "the code is Neon-only" to "the deployed dashboard works and the Supabase bill stops." Auth and data are involved, so treat the production section as a gated, hard-stop change.

---

## 0. Measured starting state (2026-07-20)

| Fact | Evidence | Consequence |
|---|---|---|
| Production runs on **Supabase** | `GET https://dynastyinsurancenetwork.com/api/health` → `leads_table_unreachable`, `detail: fetch failed` (the Supabase SDK uses `fetch`; a Neon/`pg` failure looks different) | Real historical leads live in Supabase, not Neon. |
| Supabase is currently **unreachable / likely paused** | Same health error; direct REST calls also fail | Production lead capture may be degraded right now. Resume the Supabase project before exporting any data. |
| **Neon is healthy** | Local `GET /api/health` → `200 {"provider":"neon"}` | The target is ready. |
| **Auth users already live in Neon** | `holyimpactmedia@gmail.com` (superadmin), `samlamy@becomedynasty.com` (admin) exist in the Neon `user` table | Nothing to migrate for auth. Supabase had no auth users. |
| Neon `leads` table has **1 test row** (2026-06-23) | Direct query | Confirms production never cut over; Neon is effectively empty. |

**Bottom line:** the only open data question is *lead history in Supabase*. Everything else is done or empty.

---

## 1. Vercel environment variables

Set these in **Vercel → Project `dynasty-insurance-network` → Settings → Environment Variables**. Each variable is scoped to an environment (Production / Preview / Development). Use the same working values you already have in local `.env.local` unless noted.

### Required (the app will not function without these)

| Variable | Scope | Notes |
|---|---|---|
| `DATABASE_URL` | Runtime, all envs | Neon **pooled** URL (host contains `-pooler`). Runtime queries + Better Auth. |
| `BETTER_AUTH_SECRET` | Runtime, all envs | 32+ random bytes. Must be **stable** — rotating it logs everyone out. Reuse the value in `.env.local`. |
| `BETTER_AUTH_URL` | Runtime, per env | The **exact origin this environment serves**. Must match, or auth cookies and redirects break. Prod: `https://dynastyinsurancenetwork.com` (or `https://unionprivatehealthcare.com` once the domain is switched). Preview: the branch alias URL (below). |
| `NEXT_PUBLIC_SITE_URL` | **Build-time**, per env | Public URL for canonical/OG tags and the auth fallback. Baked at build and exposed to the browser, so a change requires a redeploy. |
| `RESEND_API_KEY` | Runtime, all envs | Sends confirmations, admin alerts, portal invites, password resets. |
| `ADMIN_EMAIL` | Runtime, all envs | Recipient of new-lead admin alerts. Alerts are silently skipped if unset. |

### Recommended (things break quietly without them)

| Variable | Scope | Notes |
|---|---|---|
| `RESEND_FROM_EMAIL` | Runtime | `Name <addr@verified-domain>`. Must be a Resend-verified sending domain. Currently a stale Dynasty value — set the Union sender. Overrides the from-name set in code. |
| `ANTHROPIC_API_KEY` | Runtime | AI lead scoring. Without it, scoring no-ops (leads still save, `ai_score` stays null). |
| `TRUSTEDFORM_API_KEY` | Runtime | Claims/retains TrustedForm certs (TCPA proof). Cert capture works without it, but the claim will not persist. Was previously empty. |
| `HOLY_IMPACT_MAILING_ADDRESS` | Runtime | Physical address in the CAN-SPAM email footer. Compliance. |

### Optional

| Variable | Scope | Notes |
|---|---|---|
| `ANTHROPIC_MODEL` | Runtime | Defaults to `claude-sonnet-4-6`. |
| `UNSUBSCRIBE_EMAIL` | Runtime | Defaults to `unsubscribe@holyimpactmedia.com`. |
| `USHA_ENABLED` | Runtime | `true` to post leads to the USHA marketplace. Default off — leads are marked `pending`. |
| `USHA_API_URL`, `USHA_API_KEY` | Runtime | Required only if `USHA_ENABLED=true`. |

### Not a Vercel variable

| Variable | Where | Notes |
|---|---|---|
| `DATABASE_URL_DIRECT` | Local / CI only | Neon **unpooled** (direct) URL. Used by Drizzle Kit for `pnpm db:migrate` and `pnpm db:verify`. Not needed in the Vercel runtime. |
| `AUTH_BOOTSTRAP_MODE`, `AUTH_BOOTSTRAP_USERS_FILE` | Local only | For the one-time bootstrap script. Never set `AUTH_BOOTSTRAP_MODE` in a deployed environment. |

---

## 2. Make the Preview dashboard work — on an isolated Neon branch

**Decision (2026-07-20):** Preview runs against its **own Neon branch**, never the production database. A Neon branch is a copy-on-write clone: isolated data, its own connection string, cheap to create and reset. Test users and test leads created on Preview never touch production.

### 2a. Create the Neon branch

Dashboard: Neon → project → **Branches → New branch** (name it `preview`), then copy both its **pooled** and **direct** connection strings.

Or with the CLI (`npm i -g neonctl`, then `neonctl auth`):

```bash
neonctl branches create --name preview
neonctl connection-string preview --pooled     # -> DATABASE_URL (Preview scope)
neonctl connection-string preview              # -> DATABASE_URL_DIRECT (for migrations)
```

### 2b. Apply the schema + seed a login to the branch

A fresh branch created from an empty parent has no tables and **no users** — you cannot log in until you provision one. Run locally, pointed at the branch's **direct** URL:

```bash
DATABASE_URL_DIRECT="<branch-direct-url>" pnpm db:migrate
DATABASE_URL_DIRECT="<branch-direct-url>" pnpm db:verify

# seed a super admin into the branch (sends a set-password link)
AUTH_BOOTSTRAP_MODE=true \
AUTH_BOOTSTRAP_USERS_FILE=/absolute/private/path/users.json \
DATABASE_URL="<branch-pooled-url>" \
BETTER_AUTH_URL="https://dynasty-insurance-network-git-redesign-06a667-holy-impact-media.vercel.app" \
pnpm auth:bootstrap
```

(If the branch was cloned from a populated parent instead, it already carries those users — skip the bootstrap.)

### 2c. Set the Preview-scope env vars in Vercel

Vercel → project → Settings → Environment Variables, scope **Preview**:

- `DATABASE_URL` = the branch **pooled** URL (the one thing that differs from production).
- `BETTER_AUTH_URL` and `NEXT_PUBLIC_SITE_URL` = the **stable branch alias** `https://dynasty-insurance-network-git-redesign-06a667-holy-impact-media.vercel.app` (per-deployment URLs change every push; the branch alias does not).
- `BETTER_AUTH_SECRET`, `RESEND_API_KEY`, `ADMIN_EMAIL`, plus the Recommended vars — same values as production is fine.

### 2d. Redeploy and verify

Redeploy the branch (push, or Vercel → Deployments → Redeploy), then:

- `<branch-alias>/api/health` → `200 {"provider":"neon"}`.
- Sign in at `<branch-alias>/auth/login` with the seeded super admin.

Preview also sits behind Vercel's own deployment-protection login — separate from the app's auth. Use the share link from Section 1 of the earlier notes for people without Vercel access.

---

## 3. Production cutover

A ~30-minute window. This touches live systems; do not run it casually.

### 3a. Pre-cutover decisions

1. **Resume Supabase** (it appears paused). In the Supabase dashboard, un-pause the project so you can read its data.
2. **Decide on lead history.** Measure first:
   ```bash
   # counts only, run where Supabase is reachable
   curl -s -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
     -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
     -H "Prefer: count=exact" -I \
     "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/leads?select=id"
   # read the total from the content-range header (e.g. */842)
   ```
   - **Few / disposable leads** → start Neon empty (nothing to do).
   - **Real lead history you want to keep** → export `leads`, `app_settings`, `email_suppressions` from Supabase and import into Neon before flipping. (Auth users are already in Neon; do not touch them.)

### 3b. Cutover steps

1. Record the current production deployment ID and env snapshot (for rollback).
2. Pause paid campaigns so no new leads arrive mid-flip.
3. If migrating data, do the Supabase → Neon export/import now and verify row counts match.
4. Apply the Neon schema and confirm it is idempotent:
   ```bash
   pnpm db:migrate && pnpm db:migrate && pnpm db:verify   # 2nd run is a no-op
   ```
5. Confirm the superadmin exists in Neon (already true: `holyimpactmedia@gmail.com`). If a password reset is needed, trigger it from the deployed site so the link uses the production origin, not localhost.
6. Set the **Production** env vars from Section 1 (Required + Recommended). `BETTER_AUTH_URL` / `NEXT_PUBLIC_SITE_URL` = the production domain.
7. Merge/deploy this branch to production. (This is the step that conflicts with the "preview only" rule — it must be an explicit, separate decision.)
8. **Verify on production:**
   - `GET /api/health` → `200 {"provider":"neon"}`.
   - Sign in as superadmin; confirm the Lead CRM loads.
   - Submit one clearly marked test lead; confirm it persists, the admin email arrives, TrustedForm cert is captured, and it appears in the dashboard + CSV export.
   - Confirm an Admin (Sam) cannot reach `/dashboard/settings` or `/dashboard/users`.
9. Resume campaigns. Monitor `/api/health` and lead volume for 7 days.

---

## 4. Decommission Supabase (this is what stops the bill)

Only after production has run cleanly on Neon for several days:

1. Take a final encrypted export of the Supabase database and store it per your backup policy.
2. Remove the Supabase environment variables from Vercel (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`). The code no longer reads them, but clearing them removes the last references.
3. Delete or downgrade the Supabase project in the Supabase dashboard. **Removing the code did not cancel the account — this step does.**

---

## 5. Rollback (note: the easy switch is gone)

Before, rollback was flipping `PLATFORM_PROVIDER=supabase`. That switch and the Supabase adapters were removed in `72a0b1d`, so rollback is now a **code** operation:

1. Revert to the pre-removal commit (`git revert 72a0b1d` or redeploy the commit before it) to restore the dual-provider code.
2. Restore the Supabase env vars and set `PLATFORM_PROVIDER=supabase`.
3. Redeploy.

Keep a Supabase export and the pre-removal deployment reachable for 7 days before decommissioning. This is the tradeoff of deleting the fallback: a cleaner codebase, but rollback now costs a deploy instead of an env toggle.

---

## Verification gates (before any deploy)

```bash
pnpm build && pnpm test && pnpm exec eslint app lib components
```
All green as of `72a0b1d` (65 tests). Also confirm `GET /api/health` returns `provider: neon` in the target environment.
