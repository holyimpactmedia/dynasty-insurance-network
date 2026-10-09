# Task 12: Production switch (HARD STOP: deploy)

Part of [docs/plan.md](../../../plan.md). Read its Global Constraints first.

**Goal:** `www.dynastyinsurancenetwork.com` runs on Neon: leads store with TCPA evidence, the owner signs in, and a one-command rollback is ready.

**Hard stop:** production deploy and production keys. Ask the owner in chat before Step 2 and again before Step 5. Pause paid campaigns for the switch window (owner action) so no lead arrives mid-deploy.

**Files:** none in code. This task changes Vercel Production settings and `main`.

**Interfaces:**
- Consumes: the branch verified in Task 11.
- Produces: production on Neon; a recorded rollback target.

- [ ] **Step 1: Rebase check against `main`**

```bash
git fetch origin && git rebase origin/main
pnpm exec tsc --noEmit && pnpm test && pnpm lint && pnpm check:guards && pnpm build
```

If the legal branch landed on `main` first, the rebase brings its copy changes in; `check:guards` must still pass (it compares against the new merge base), and the TrustedForm scan-phrase test (Task 7) must still pass against legal's consent text.

- [ ] **Step 2: Owner confirmations and approval (in chat)**

The outage this plan repairs came from an unwatched free-tier database pausing. Before switching, the owner confirms, from the Neon console (Billing and the project's settings):
1. The Neon plan, and that it does not delete or permanently suspend an idle project.
2. The point-in-time restore window (how far back the database can be restored).
3. The compute allowance, given that every dashboard poll and uptime check wakes the database.
4. From Vercel (team settings, plan): how long runtime logs are kept. The `TRUSTEDFORM CLAIM FAILED`, `TRUSTEDFORM SCAN MISMATCH`, `LEAD INSERT FAILED` and `LEAD NOT STORED` lines are the only signal for a lost claim or record; if logs are kept a day or less, the owner decides whether to add a log drain or an emailed alert (a follow-up, not part of this switch).

Record the four answers in `docs/build-log.md`, with the compute math for the uptime check in Step 6.7 (its interval, the hours of compute it keeps awake per month, and the plan's allowance). If the plan is a free tier, say so plainly to the owner as a risk to stored TCPA records before continuing.

Also confirm the owner's decision on the privacy policy's service-provider line (`app/privacy/page.tsx` names Supabase as a host; after this switch Neon stores consumer data). That file is legal-frozen: any edit goes through an owner-approved legal change, never this task.

Then ask: "Ready to switch production to Neon? I will record the current deployment for rollback, set production `DATABASE_URL` (Neon `<PROD_BRANCH>`, pooled), a new `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL` = `https://www.dynastyinsurancenetwork.com`, then open the pull request into `main`; `NEXT_PUBLIC_SITE_URL` is set in the same window as the merge. Campaigns paused?" Wait for a clear yes.

- [ ] **Step 3: Record the rollback target**

```bash
vercel --scope team_3shOdpxgvnWaaNDkNwSH2s6f ls dynasty-insurance-network --prod | head -5
```

Write the current production deployment URL into `docs/build-log.md` under today's date as "rollback target".

- [ ] **Step 4: Production env vars (values never printed)**

List what exists first (names only): `vercel --scope team_3shOdpxgvnWaaNDkNwSH2s6f env ls production`. Confirm `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ADMIN_EMAIL`, `ANTHROPIC_API_KEY`, `TRUSTEDFORM_API_KEY`, `USHA_ENABLED` (and USHA credentials if enabled) are present; any missing one is reported to the owner, not invented.

```bash
npx neonctl@latest connection-string <PROD_BRANCH> --pooled | sed 's/sslmode=require/sslmode=verify-full/' | vercel --scope team_3shOdpxgvnWaaNDkNwSH2s6f env add DATABASE_URL production
openssl rand -base64 48 | tr -d '\n' | vercel --scope team_3shOdpxgvnWaaNDkNwSH2s6f env add BETTER_AUTH_SECRET production
printf 'https://www.dynastyinsurancenetwork.com' | vercel --scope team_3shOdpxgvnWaaNDkNwSH2s6f env add BETTER_AUTH_URL production
```

Before the first command, confirm the SSL mode without printing the string: `npx neonctl@latest connection-string <PROD_BRANCH> --pooled | grep -o 'sslmode=[a-z-]*'` must print `sslmode=require`. (`sslmode=verify-full` keeps today's certificate checking; `pg` 8 treats `require` the same way, but `pg` 9 will not.)

Leave the three Supabase variables in place for 7 days (rollback window).

Recommended, owner configures in the Vercel dashboard (no code): a Vercel Firewall rate-limit rule on `/api/auth/sign-in/email` and `/api/auth/request-password-reset`. Better Auth's own limiter keeps its counts in memory per serverless instance, so it is weak against a spread-out password-guessing attempt.

- [ ] **Step 5: Merge (second owner confirmation)**

```bash
gh pr create --base main --head feat/dynasty-neon --title "Dynasty on Neon: database, login and dashboard" --body-file docs/plan.md
```

Right before the merge, set `NEXT_PUBLIC_SITE_URL` (it is baked into the build and drives the unsubscribe link in every consumer email): if it already exists in production with a different value, remove it first (`vercel --scope team_3shOdpxgvnWaaNDkNwSH2s6f env rm NEXT_PUBLIC_SITE_URL production`), then `printf 'https://www.dynastyinsurancenetwork.com' | vercel --scope team_3shOdpxgvnWaaNDkNwSH2s6f env add NEXT_PUBLIC_SITE_URL production`.

Owner reviews and merges (or explicitly tells Claude to merge). Vercel builds production from `main`.

- [ ] **Step 6: Verify production**

1. `curl -s https://www.dynastyinsurancenetwork.com/api/health` returns `{"status":"ok","provider":"neon"}`.
2. Owner signs in at `https://www.dynastyinsurancenetwork.com/auth/login` (forgot-password first if needed); the dashboard loads. The reset email's link points at `https://www.dynastyinsurancenetwork.com` (not the apex or a preview host), and signing out returns to the login page.
3. Owner submits one clearly marked test lead (first name `TEST`) with their own email: thank-you screen, both emails arrive, the lead shows on the dashboard within 30 seconds, CSV export works.
4. Claude, read-only, on Neon `<PROD_BRANCH>`: confirm that row has `tcpa_consent = true`, a consent time, the TrustedForm URL and an IP; and Vercel runtime logs show `TRUSTEDFORM CLAIM OK` listing both consent phrases for its reference number (not merely the absence of `TRUSTEDFORM CLAIM FAILED`).
5. CAN-SPAM check (pressure test H1): the owner clicks the unsubscribe link in the test lead's confirmation email. Expected: it opens `https://www.dynastyinsurancenetwork.com/api/unsubscribe?...` showing "You've been unsubscribed", and Claude confirms (read-only) a row for that address in `email_suppressions`.
6. Owner confirms the `admin` account (Sam) cannot open `/dashboard/users` or `/dashboard/settings`.
7. Uptime monitoring: the owner (or Claude, with approval) points an uptime check at `/api/health` every 15 to 30 minutes. Each check wakes the database; at 5 minutes or less (Neon's default scale-to-zero delay) the database never sleeps and uses compute all month. Use the interval recorded with the compute math in Step 2.

Then the owner resumes campaigns. Watch `/api/health` and lead volume for 7 days.

- [ ] **Step 7: Rollback (only if Step 6 fails)**

```bash
vercel --scope team_3shOdpxgvnWaaNDkNwSH2s6f rollback <rollback-target-from-step-3>
```

This returns the site to the pre-switch state (leads reach the admin inbox by email only). Report to the owner.

- [ ] **Step 8: After 7 clean days (owner decision)**

Remove `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` from Vercel; the owner closes the Supabase project in the Supabase dashboard. Update `STATE.md` and `docs/build-log.md`.
