# Task 10c: The privacy policy names Neon as the database host

Part of [docs/plan.md](../../../plan.md). Read its Global Constraints first.

**Premise:** after the switch, `app/privacy/page.tsx` would name Supabase as a hosting provider although Neon stores consumer data, and would not name Neon.
**Observed:** the live privacy page (`https://www.dynastyinsurancenetwork.com/privacy`) names Supabase as a host today (source line 110); this migration is what makes that wrong.

**Owner decision (2026-10-09, in chat):** change "Supabase" to "Neon" in that line; do not raise it with counsel (a factual vendor update that counsel's documents did not cover).

**Required consequence (pressure test H1):** section 14 of the policy promises "We will post the updated policy on this page and update the 'Last Updated' date." So the `Last Updated: May 7, 2026` line (line 14) changes to the date of this commit in the same slice, and Task 12 re-sets it to the merge day if that differs. Two exact replacements, nothing else.

**Hard stop:** Privacy text (Gate Policy: compliance) in a legal-frozen file. Approved by the owner for exactly this one replacement; nothing else in any frozen file changes.

**Goal:** the privacy policy's service-provider sentence reads "hosting (Vercel, Neon)", and `pnpm check:guards` allows exactly that replacement and nothing else.

**Files:**
- Modify: `scripts/check-guards.mjs` (an exact-replacement allow-list; quoted diff headers get no allowance, carried from the Task 2 review)
- Modify: `app/privacy/page.tsx` (one word)

- [ ] **Step 1: Prove the guard blocks the edit today**

Make the Step 3 edit, run `pnpm check:guards`: it must FAIL naming `app/privacy/page.tsx` (one removed line, one added line). Undo the edit (`git checkout -- app/privacy/page.tsx`) and confirm the guard passes.

- [ ] **Step 2: Exact-replacement allow-list in the guard**

In `scripts/check-guards.mjs`, replace everything from the comment line `// Added lines allowed per file. Empty until the owner approves an amendment` through the closing `}` of the `for (const line of diff.split("\n")) {` loop (the line before `// A new file under a frozen path counts even before it is committed.`) with:

```js
// Added lines allowed per file. Empty until the owner approves an amendment
// (Task 13).
const ALLOWED_ADDITIONS = {}

// Exact, owner-approved replacements inside frozen files, as [from, to] pairs.
// A removed line passes only when the same hunk adds that very line with
// `from` replaced by `to` once and nothing else changed. Every other removed
// line is a violation.
const ALLOWED_REPLACEMENTS = {
  // Owner, 2026-10-09: consumer data moved from Supabase to Neon (Task 10c);
  // section 14 of the policy requires the "Last Updated" date to move with it.
  "app/privacy/page.tsx": [
    ["hosting (Vercel, Supabase)", "hosting (Vercel, Neon)"],
    ["Last Updated: May 7, 2026", "Last Updated: <RELEASE_DATE>"],
  ],
}

const mergeBase = execFileSync("git", ["merge-base", "HEAD", BASE], { encoding: "utf8" }).trim()
const diff = execFileSync("git", [
  "diff", "--unified=0", "--no-color", "--no-ext-diff", "--no-textconv", "--no-renames",
  "--src-prefix=a/", "--dst-prefix=b/", mergeBase, "--", ...FROZEN,
], { encoding: "utf8" })
let currentFile = ""
let inHunk = false
let removed = []
let added = []

// Judge one hunk's removed and added lines together, so an allowed
// replacement pairs a removed line with its exact counterpart.
function closeHunk() {
  const pairs = ALLOWED_REPLACEMENTS[currentFile] || []
  const usedAdded = new Set()
  for (const minus of removed) {
    const text = minus.slice(1)
    const allowed = pairs.some(([from, to]) => {
      if (!text.includes(from)) return false
      const index = added.findIndex((plus, i) => !usedAdded.has(i) && plus === `+${text.replace(from, to)}`)
      if (index === -1) return false
      usedAdded.add(index)
      return true
    })
    if (!allowed) problems.push(`frozen file changed (${currentFile}): ${minus}`)
  }
  added.forEach((plus, i) => {
    if (usedAdded.has(i)) return
    if ((ALLOWED_ADDITIONS[currentFile] || []).some((re) => re.test(plus))) return
    problems.push(`frozen file changed (${currentFile}): ${plus}`)
  })
  removed = []
  added = []
}

for (const line of diff.split("\n")) {
  if (line.startsWith("diff --git ")) {
    closeHunk()
    // A path git had to quote (non-ASCII and similar) does not match the plain
    // form; it gets a name no allowance can match, so every change in it counts.
    const header = line.match(/^diff --git a\/(.+) b\/(.+)$/)
    currentFile = header ? header[2] : `(unparsed path) ${line.slice("diff --git ".length)}`
    inHunk = false
    continue
  }
  if (line.startsWith("@@")) {
    closeHunk()
    inHunk = true
    continue
  }
  if (!inHunk) {
    // Mode and binary changes have no hunk lines; any of them is a change.
    if (/^(Binary files |old mode |new mode |new file mode |deleted file mode )/.test(line)) problems.push(`frozen file changed (${currentFile}): ${line}`)
    continue
  }
  if (line.startsWith("-")) removed.push(line)
  else if (line.startsWith("+")) added.push(line)
}
closeHunk()
```

Keep the line `const BASE = ...`, the `FROZEN` list, the untracked-file check and everything below it unchanged. Run `pnpm check:guards`: it passes (no frozen file has changed yet).

`<RELEASE_DATE>` is today's date written the way the page writes dates (for example `October 9, 2026`); use the same string in Step 3.

- [ ] **Step 3: The privacy edit**

In `app/privacy/page.tsx`, replace `hosting (Vercel, Supabase)` with `hosting (Vercel, Neon)` (one occurrence, line 110) and `Last Updated: May 7, 2026` with `Last Updated: <RELEASE_DATE>` (line 14). Nothing else in the file changes. Run `pnpm check:guards`: it passes.

- [ ] **Step 4: Prove the allowance is exact (each must FAIL, then undo it)**

Starting from the Step 3 state each time:
1. Change `Neon` on that line to `Neon Inc`: FAIL.
2. Keep the correct word, also change `email delivery (Resend)` on the same line to `email delivery (Resend, Inc.)`: FAIL.
3. Keep the correct line, change one character on any other line of `app/privacy/page.tsx`: FAIL naming that line.
4. Change one character in `components/Footer.tsx`: FAIL.
5. Quoted path: create `app/cobra/naïve.tsx` containing `export {}`, `git add` it, run the guard: FAIL (the new file under a frozen path). Then `git rm --cached app/cobra/naïve.tsx`, delete the file, and confirm `git status --short` shows only the two intended files.
6. Change the date to a different day than `<RELEASE_DATE>`: FAIL.
7. Re-run the Task 2 controls against the restructured guard (no regression): `git mv components/Footer.tsx components/Footer2.tsx` (staged rename) FAIL, then move it back; `chmod +x components/Footer.tsx` FAIL, then `chmod -x`; `touch app/cobra/empty.tsx && git add app/cobra/empty.tsx` (staged empty new file) FAIL, then `git rm --cached` and delete; delete any one line of `app/terms/page.tsx` (a removal with no matching addition) FAIL, then `git checkout -- app/terms/page.tsx`.

After the last control, `git diff` shows exactly the guard change and the two privacy replacements, and `pnpm check:guards` passes. Note in the report: control 5 proves the guard still fails closed on a quoted path; the hardening's real value arrives with Task 13's additions allowance.

**Gate (2026-10-09):** `/pressure-test` CLEAR AFTER FIXES (H1 date moves with the change, per section 14; M1 Task 2 controls re-run); `/senior-review` GO WITH CHANGES (tell the owner the date changes and counsel can see it; remove the pairs after release in Task 12 Step 8; note what control 5 proves). All folded in.

- [ ] **Step 5: Mechanical checks and commit**

```bash
pnpm exec tsc --noEmit && pnpm test && pnpm lint && pnpm check:guards && pnpm build
git add scripts/check-guards.mjs app/privacy/page.tsx
git commit -m "fix(privacy): name Neon as the database host (owner-approved); guard allows exactly that replacement"
```
