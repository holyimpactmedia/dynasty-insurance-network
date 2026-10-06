# Task 2: Port guards

Part of [docs/plan.md](../../../plan.md). Read its Global Constraints first.

**Goal:** one command, `pnpm check:guards`, that fails when (a) any legal-reviewed consumer file differs from where this branch left `main`, or (b) any Union brand string, path or design token appears in shipped code. Each check is proven able to fail before it is trusted.

**Files:**
- Create: `scripts/check-guards.mjs`
- Modify: `package.json` (one script)

**Interfaces:**
- Consumes: git history (`origin/main`), the source tree.
- Produces: `pnpm check:guards` (exit 0 = pass, exit 1 = list of violations). Every later task runs it. Task 13 extends `ALLOWED_ADDITIONS` only with owner approval.

**Why:** the spec (section 6) requires that the Neon move changes no legal-reviewed wording and ships nothing from the Union rebrand. Review found that the redesign's design tokens (`bg-navy`, `font-display`, ...) do not exist in Dynasty's CSS, so a copied page renders unstyled with no build error; the token check catches that.

- [ ] **Step 1: Write the guard script**

Create `scripts/check-guards.mjs`:

```js
#!/usr/bin/env node
// Port guards for the Dynasty Neon move (spec section 6). Exit 1 on any violation.
//
// 1. Legal-reviewed consumer files must not change on this branch.
// 2. No Union brand strings, paths or design tokens in shipped code.
import { execFileSync } from "node:child_process"
import { readFileSync, readdirSync, statSync } from "node:fs"
import path from "node:path"

const BASE = process.env.GUARD_BASE || "origin/main"
const problems = []

// ── 1. Frozen consumer copy ───────────────────────────────────────────────────
const FROZEN = [
  "app/page.tsx",
  "app/layout.tsx",
  "app/terms/page.tsx",
  "app/privacy/page.tsx",
  "app/individual",
  "app/family",
  "app/cobra",
  "app/ppo",
  "app/self-employed",
  "app/business",
  "components/Footer.tsx",
  "components/ExitIntentDialog.tsx",
  "lib/email/sendLeadConfirmation.ts",
]

// Added lines allowed per file. Empty until the owner approves an amendment
// (Task 13). Removed lines are never allowed.
const ALLOWED_ADDITIONS = {}

const mergeBase = execFileSync("git", ["merge-base", "HEAD", BASE], { encoding: "utf8" }).trim()
const diff = execFileSync(
  "git",
  ["diff", "--unified=0", "--no-color", mergeBase, "--", ...FROZEN],
  { encoding: "utf8" },
)
let currentFile = ""
for (const line of diff.split("\n")) {
  if (line.startsWith("+++ ")) {
    currentFile = line.replace(/^\+\+\+ (b\/)?/, "")
    continue
  }
  if (line.startsWith("--- ")) continue
  if (!line.startsWith("+") && !line.startsWith("-")) continue
  if (line.startsWith("+")) {
    const allowed = ALLOWED_ADDITIONS[currentFile] || []
    if (allowed.some((re) => re.test(line))) continue
  }
  problems.push(`frozen file changed (${currentFile}): ${line}`)
}
// Deleting or renaming a frozen file shows up in the diff above as removed lines.

// ── 2. No Union leaks ────────────────────────────────────────────────────────
const SCAN_DIRS = ["app", "components", "lib", "scripts", "hooks", "proxy.ts"]
const SKIP = new Set(["scripts/check-guards.mjs"])
const EXTENSIONS = /\.(ts|tsx|js|jsx|mjs|cjs|css)$/
const UNION_PATTERNS = [
  /\bUnion\b/, // case-sensitive: never matches zod's z.union(
  /union-leads/,
  /unionprivatehealthcare/i,
  /components\/union/,
]
const UNION_TOKENS =
  /(^|[^\w-])(text-navy|bg-navy|border-navy|bg-red|text-ink-muted|bg-surface-2|bg-surface|border-line|text-body|text-success|font-display|text-steel|bg-steel)([^\w-]|$)/

function walk(target) {
  let stats
  try {
    stats = statSync(target)
  } catch {
    return []
  }
  if (stats.isFile()) return [target]
  return readdirSync(target).flatMap((name) => walk(path.join(target, name)))
}

for (const file of SCAN_DIRS.flatMap(walk)) {
  const rel = file.split(path.sep).join("/")
  if (SKIP.has(rel) || !EXTENSIONS.test(rel)) continue
  const lines = readFileSync(file, "utf8").split("\n")
  lines.forEach((text, index) => {
    for (const re of UNION_PATTERNS) {
      if (re.test(text)) problems.push(`Union string in ${rel}:${index + 1}: ${text.trim()}`)
    }
    if (UNION_TOKENS.test(text)) problems.push(`Union design token in ${rel}:${index + 1}: ${text.trim()}`)
  })
}

if (problems.length) {
  console.error(`check:guards FAILED (${problems.length})`)
  for (const p of problems) console.error(`  ${p}`)
  process.exit(1)
}
console.log(`check:guards passed (base ${BASE} at ${mergeBase.slice(0, 7)})`)
```

- [ ] **Step 2: Add the script entry**

In `package.json`, replace:

```json
    "test:watch": "vitest",
```

with:

```json
    "test:watch": "vitest",
    "check:guards": "node scripts/check-guards.mjs",
```

- [ ] **Step 3: Run it on the clean branch**

```bash
git fetch origin main && pnpm check:guards
```

Expected: `check:guards passed (base origin/main at 00e3b20)`. If it reports a Union string or token that already exists on `main`, stop: report it to the owner (it would mean the live site already carries redesign residue) rather than weakening the pattern.

- [ ] **Step 4: Positive control 1, frozen copy (must FAIL)**

```bash
printf '\n' >> components/Footer.tsx && pnpm check:guards; echo "exit=$?"
```

Expected: `check:guards FAILED` naming `components/Footer.tsx`, `exit=1`. Then restore:

```bash
git checkout -- components/Footer.tsx && pnpm check:guards
```

Expected: passes again.

- [ ] **Step 5: Positive control 2, Union string (must FAIL)**

```bash
printf '\n// Union Private Healthcare\n' >> lib/utils.ts && pnpm check:guards; echo "exit=$?"
```

Expected: `Union string in lib/utils.ts:...`, `exit=1`. Restore with `git checkout -- lib/utils.ts`.

- [ ] **Step 6: Positive control 3, Union token (must FAIL)**

```bash
printf '\nexport const tokenProbe = "bg-navy"\n' >> lib/utils.ts && pnpm check:guards; echo "exit=$?"
```

Expected: `Union design token in lib/utils.ts:...`, `exit=1`. Restore with `git checkout -- lib/utils.ts`.

- [ ] **Step 7: Positive control 4, zod is not flagged (must PASS)**

```bash
printf '\nexport const zodProbe = "z.union("\n' >> lib/utils.ts && pnpm check:guards; echo "exit=$?"
```

Expected: `check:guards passed`, `exit=0` (proves the case-sensitive pattern does not flag `z.union`). Restore with `git checkout -- lib/utils.ts`.

- [ ] **Step 8: Mechanical checks**

```bash
pnpm exec tsc --noEmit && pnpm test && pnpm lint && pnpm check:guards
```

- [ ] **Step 9: Commit**

```bash
git add scripts/check-guards.mjs package.json
git commit -m "chore: add port guards (frozen legal copy, no Union leaks), each proven to fail"
```
