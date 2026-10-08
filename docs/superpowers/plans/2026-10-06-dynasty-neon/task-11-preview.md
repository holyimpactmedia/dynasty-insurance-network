# Task 11: Preview verification (HARD STOP: keys)

Part of [docs/plan.md](../../../plan.md). Read its Global Constraints first.

**Goal:** prove the whole branch works against an isolated Neon branch, first on `localhost` with test accounts, then on the Vercel preview with the owner signing in, before anything touches production.

**Hard stop:** this task creates a Neon branch and puts secrets into Vercel's Preview environment. Ask the owner for approval in chat before Step 2, naming exactly what will be created. Never print a secret value; every secret below moves through a shell substitution or a pipe, never the terminal or chat.

**Files:**
- Create: `scripts/create-test-users.ts` (committed; refuses to run unless explicitly pointed at a non-production branch)
- Create (gitignored, never committed): `.env.development.local`, `.test-users.local.json`

**Interfaces:**
- Consumes: everything from Tasks 1 to 10.
- Produces: a Neon branch `preview`; Vercel Preview env vars scoped to git branch `feat/dynasty-neon`; a verified preview deployment.

- [ ] **Step 1: Owner approval (in chat)**

Ask: "Ready to create a Neon branch named `preview` (a copy of the current Neon data, isolated from production) and set Preview-only environment variables in Vercel for branch `feat/dynasty-neon`, with `USHA_ENABLED=false` so no preview lead reaches the marketplace. OK to proceed?" Wait for a clear yes.

- [ ] **Step 2: Neon CLI access (owner action)**

Owner runs, in a terminal (browser sign-in to their Neon account):

```bash
npx neonctl@latest auth
```

Then confirm the project is visible: `npx neonctl@latest projects list`. If more than one project is listed, ask the owner which one holds the Dynasty database and pass `--project-id <id>` to every later `neonctl` command.

Find the production branch's real name (newer Neon projects call it `production`, older ones `main`):

```bash
npx neonctl@latest branches list
```

The production branch is the one marked default (and the one whose endpoint host matches the host in `.env.local`'s `DATABASE_URL`; compare hosts with `grep '^DATABASE_URL=' .env.local | grep -o '@[^/:?]*'`, which prints the host name only, never the credentials before the `@`). Use that name as `<PROD_BRANCH>` here and in Task 12; record it in `docs/build-log.md`.

- [ ] **Step 3: Create the preview branch**

```bash
npx neonctl@latest branches create --name preview --parent <PROD_BRANCH>
```

It starts as a copy-on-write copy of production (the two real accounts and one test lead). Nothing written to it reaches `main`.

(Wherever a later command in this task or Task 12 says `main` for the Neon branch, use `<PROD_BRANCH>`.)

- [ ] **Step 4: Verify its schema, read-only**

```bash
DATABASE_URL="$(npx neonctl@latest connection-string preview --pooled)" pnpm db:verify
```

Expected: `"ok": true`.

- [ ] **Step 5: Test-user script**

Create `scripts/create-test-users.ts`:

```ts
// Creates verified test accounts on a NON-production Neon branch, for local
// verification only. Refuses to run unless TEST_USERS_BRANCH=preview is set and
// the process is not a deployed runtime. Credentials go to a gitignored file.
import { randomBytes } from "node:crypto"
import { writeFileSync } from "node:fs"
import { eq } from "drizzle-orm"
import { requireNeonDb } from "@/lib/db/client"
import { user as userTable } from "@/lib/db/schema/auth"

async function main() {
  if (process.env.TEST_USERS_BRANCH !== "preview") throw new Error("Set TEST_USERS_BRANCH=preview to confirm the target is the preview branch.")
  if (process.env.VERCEL_ENV) throw new Error("Refusing to run inside a deployed environment.")
  const { auth } = await import("@/lib/auth/server")
  const db = requireNeonDb()
  const accounts = [
    { email: "test-superadmin@dynasty.test", name: "Test Superadmin", role: "superadmin" as const },
    { email: "test-admin@dynasty.test", name: "Test Admin", role: "admin" as const },
  ]
  const out: Array<{ email: string; role: string; password: string }> = []
  for (const account of accounts) {
    const password = randomBytes(18).toString("base64url")
    const [existing] = await db.select({ id: userTable.id }).from(userTable).where(eq(userTable.email, account.email)).limit(1)
    if (!existing) {
      await auth.api.createUser({ body: { ...account, password, data: { emailVerified: true } } })
      await db.update(userTable).set({ emailVerified: true }).where(eq(userTable.email, account.email))
      out.push({ email: account.email, role: account.role, password })
    }
  }
  writeFileSync(".test-users.local.json", JSON.stringify(out, null, 2), { mode: 0o600 })
  console.log(`Created ${out.length} test account(s); credentials written to .test-users.local.json`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
```

Add `.test-users.local.json` to `.gitignore` (append the line), then confirm with `git check-ignore -q .test-users.local.json && echo ignored`.

Run it against the preview branch only:

```bash
TEST_USERS_BRANCH=preview DATABASE_URL="$(npx neonctl@latest connection-string preview --pooled)" BETTER_AUTH_SECRET="$(openssl rand -base64 48)" BETTER_AUTH_URL=http://localhost:3000 npx tsx scripts/create-test-users.ts
```

Never print `.test-users.local.json`; read individual values from it only when typing into the local sign-in form.

- [ ] **Step 6: Point local dev at the preview branch (no emails, no USHA)**

```bash
{
  printf 'DATABASE_URL=%s\n' "$(npx neonctl@latest connection-string preview --pooled)"
  printf 'BETTER_AUTH_SECRET=%s\n' "$(openssl rand -base64 48)"
  printf 'BETTER_AUTH_URL=http://localhost:3000\n'
  printf 'NEXT_PUBLIC_SITE_URL=http://localhost:3000\n'
  printf 'RESEND_API_KEY=\n'
  printf 'USHA_ENABLED=false\n'
  printf 'ANTHROPIC_API_KEY=\n'
} > .env.development.local
git check-ignore -q .env.development.local && echo ignored
```

(`.env.development.local` overrides `.env.local` under `next dev`. Email, USHA and AI scoring are off here on purpose.)

- [ ] **Step 7: Local walk against the preview branch (test accounts only)**

Start `preview_start` name `dev`. In the browser pane (localhost, test credentials created in Step 5), desktop and mobile:
1. `/api/health` returns `{"status":"ok","provider":"neon"}`.
2. Sign in as `test-superadmin@dynasty.test`: dashboard loads in the Dynasty look; nav shows Lead CRM, Projections, Users, Settings.
3. Submit one test lead through each funnel (`/individual`, `/family`, `/cobra`, `/ppo`, `/self-employed`) using `@dynasty.test` addresses and the PPO funnel with a priority picked. Each shows its normal thank-you screen.
4. Within 30 seconds each lead appears on the dashboard without reloading (or immediately on switching back to the tab); open one in the drawer; CSV export downloads `dynasty-leads-YYYY-MM-DD.csv`.
5. Users page: invite `invitee@dynasty.test` as admin; expect the amber "Account created, but the invite email was not sent" (email is off locally) and the user in the list.
6. Settings: switch Projections off; the nav entry disappears and `/dashboard/projections` redirects to `/dashboard/admin`; switch it back on.
7. Sign out; sign in as `test-admin@dynasty.test`: no Users or Settings in the nav; `/dashboard/users` and `/dashboard/settings` redirect away.
8. Self-promotion (Review Focus 4), as the signed-in test admin, from the browser console:
   `await fetch("/api/auth/update-user",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({role:"superadmin"})}).then(r=>r.status)` expect 400;
   `await fetch("/api/auth/admin/set-role",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({userId:"x",role:"superadmin"})}).then(r=>r.status)` expect 401 or 403.
9. `/auth/reset-password?token=bad&error=INVALID_TOKEN` shows the expired-link message (Review Focus 5).

Record the two status codes from item 8 and the role query result below in `docs/build-log.md` under today's date as the self-promotion evidence (senior review).

Then the parity check on the stored rows (Review Focus 2), read-only:

```bash
psql "$(npx neonctl@latest connection-string preview)" -c "select funnel_type, age, priorities, tcpa_consent, tcpa_consent_at is not null as consent_time, trusted_form_cert_url is not null as cert, ip_address <> 'unknown' as ip from leads where email like '%@dynasty.test' order by created_at" -c "select email, role from \"user\" where email like '%@dynasty.test' order by email"
```

(If `psql` is not installed, use the Neon console SQL editor on the `preview` branch with the same queries.) Expected: five rows; the PPO row's `priorities` reads `["<value>"]` (JSON text, not `{...}`); `tcpa_consent` true with a consent time; `test-admin` role still `admin`.

- [ ] **Step 8: Push the branch for a Vercel preview**

```bash
git push -u origin HEAD:feat/dynasty-neon
```

Find the stable branch alias (the URL that does not change per deploy):

```bash
vercel --scope team_3shOdpxgvnWaaNDkNwSH2s6f ls dynasty-insurance-network | head -5
vercel --scope team_3shOdpxgvnWaaNDkNwSH2s6f inspect <newest-preview-url> | grep -A2 Aliases
```

- [ ] **Step 9: Preview-only env vars for this branch (values never printed)**

Using the alias from Step 8 as `<ALIAS>`:

```bash
npx neonctl@latest connection-string preview --pooled | vercel --scope team_3shOdpxgvnWaaNDkNwSH2s6f env add DATABASE_URL preview feat/dynasty-neon
openssl rand -base64 48 | tr -d '\n' | vercel --scope team_3shOdpxgvnWaaNDkNwSH2s6f env add BETTER_AUTH_SECRET preview feat/dynasty-neon
printf 'https://<ALIAS>' | vercel --scope team_3shOdpxgvnWaaNDkNwSH2s6f env add BETTER_AUTH_URL preview feat/dynasty-neon
printf 'https://<ALIAS>' | vercel --scope team_3shOdpxgvnWaaNDkNwSH2s6f env add NEXT_PUBLIC_SITE_URL preview feat/dynasty-neon
printf 'false' | vercel --scope team_3shOdpxgvnWaaNDkNwSH2s6f env add USHA_ENABLED preview feat/dynasty-neon
```

For `RESEND_API_KEY`, `RESEND_FROM_EMAIL` and `ADMIN_EMAIL`, pipe the values from `.env.local` without printing them, one name at a time:

```bash
grep '^RESEND_API_KEY=' .env.local | cut -d= -f2- | tr -d '\n' | vercel --scope team_3shOdpxgvnWaaNDkNwSH2s6f env add RESEND_API_KEY preview feat/dynasty-neon
```

(repeat with `RESEND_FROM_EMAIL` and `ADMIN_EMAIL`). Then list names only to confirm: `vercel --scope team_3shOdpxgvnWaaNDkNwSH2s6f env ls preview feat/dynasty-neon`. Redeploy so the build picks them up: `vercel --scope team_3shOdpxgvnWaaNDkNwSH2s6f redeploy <newest-preview-url>`.

- [ ] **Step 10: Deployed preview checks (owner signs in)**

1. `curl -s https://<ALIAS>/api/health` returns `{"status":"ok","provider":"neon"}`.
2. Owner action (their own account; Claude never types their password): open `https://<ALIAS>/auth/forgot-password`, request a reset for their email, use the emailed link, set a password, sign in. Confirm the dashboard and the six test leads from Step 7.
3. Owner submits one lead through any funnel with their own email: the consumer confirmation email and the admin notification email arrive; the lead appears on the dashboard.
4. Owner, on the Users page, invites a second address they control: the green "Invite sent" appears, the invite email arrives, its link opens the set-password page, and the new account can sign in (proves the invite-sent signal is accurate on a real deployment).
5. Screenshot (Claude, read-only): `/auth/login`, a funnel thank-you page, desktop and mobile.

- [ ] **Step 11: Commit the test-user script**

```bash
pnpm exec tsc --noEmit && pnpm test && pnpm lint && pnpm check:guards
git add scripts/create-test-users.ts .gitignore
git commit -m "chore: preview-only test account script; ignore local test credentials"
git push
```

Report results to the owner with the screenshots before Task 12.
