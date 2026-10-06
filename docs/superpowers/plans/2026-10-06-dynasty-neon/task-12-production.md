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

If the legal branch landed on `main` first, the rebase brings its copy changes in; `check:guards` must still pass (it compares against the new merge base). If the separate TrustedForm fix landed, keep its two-line change in `app/api/leads/route.ts` when resolving conflicts and re-run the Task 7 tests.

- [ ] **Step 2: Owner approval (in chat)**

Ask: "Ready to switch production to Neon? I will record the current deployment for rollback, set production `DATABASE_URL` (Neon `main`, pooled), a new `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` and `NEXT_PUBLIC_SITE_URL` = `https://www.dynastyinsurancenetwork.com`, then open the pull request into `main`. Campaigns paused?" Wait for a clear yes.

- [ ] **Step 3: Record the rollback target**

```bash
vercel --scope team_3shOdpxgvnWaaNDkNwSH2s6f ls dynasty-insurance-network --prod | head -5
```

Write the current production deployment URL into `docs/build-log.md` under today's date as "rollback target".

- [ ] **Step 4: Production env vars (values never printed)**

List what exists first (names only): `vercel --scope team_3shOdpxgvnWaaNDkNwSH2s6f env ls production`. Confirm `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ADMIN_EMAIL`, `ANTHROPIC_API_KEY`, `TRUSTEDFORM_API_KEY`, `USHA_ENABLED` (and USHA credentials if enabled) are present; any missing one is reported to the owner, not invented.

```bash
npx neonctl@latest connection-string main --pooled | vercel --scope team_3shOdpxgvnWaaNDkNwSH2s6f env add DATABASE_URL production
openssl rand -base64 48 | tr -d '\n' | vercel --scope team_3shOdpxgvnWaaNDkNwSH2s6f env add BETTER_AUTH_SECRET production
printf 'https://www.dynastyinsurancenetwork.com' | vercel --scope team_3shOdpxgvnWaaNDkNwSH2s6f env add BETTER_AUTH_URL production
```

For `NEXT_PUBLIC_SITE_URL`: if it already exists in production with a different value, remove it first (`vercel --scope team_3shOdpxgvnWaaNDkNwSH2s6f env rm NEXT_PUBLIC_SITE_URL production`), then `printf 'https://www.dynastyinsurancenetwork.com' | vercel --scope team_3shOdpxgvnWaaNDkNwSH2s6f env add NEXT_PUBLIC_SITE_URL production`.

Leave the three Supabase variables in place for 7 days (rollback window).

- [ ] **Step 5: Merge (second owner confirmation)**

```bash
gh pr create --base main --head feat/dynasty-neon --title "Dynasty on Neon: database, login and dashboard" --body-file docs/plan.md
```

Owner reviews and merges (or explicitly tells Claude to merge). Vercel builds production from `main`.

- [ ] **Step 6: Verify production**

1. `curl -s https://www.dynastyinsurancenetwork.com/api/health` returns `{"status":"ok","provider":"neon"}`.
2. Owner signs in at `https://www.dynastyinsurancenetwork.com/auth/login` (forgot-password first if needed); the dashboard loads.
3. Owner submits one clearly marked test lead (first name `TEST`) with their own email: thank-you screen, both emails arrive, the lead shows on the dashboard within 15 seconds, CSV export works.
4. Claude, read-only, on Neon `main`: confirm that row has `tcpa_consent = true`, a consent time, the TrustedForm URL and an IP.
5. Owner confirms the `admin` account (Sam) cannot open `/dashboard/users` or `/dashboard/settings`.

Then the owner resumes campaigns. Watch `/api/health` and lead volume for 7 days.

- [ ] **Step 7: Rollback (only if Step 6 fails)**

```bash
vercel --scope team_3shOdpxgvnWaaNDkNwSH2s6f rollback <rollback-target-from-step-3>
```

This returns the site to the pre-switch state (leads reach the admin inbox by email only). Report to the owner.

- [ ] **Step 8: After 7 clean days (owner decision)**

Remove `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` from Vercel; the owner closes the Supabase project in the Supabase dashboard. Update `STATE.md` and `docs/build-log.md`.
