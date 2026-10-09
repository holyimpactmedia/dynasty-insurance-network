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
    ["Last Updated: May 7, 2026", "Last Updated: October 9, 2026"],
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
// A new file under a frozen path counts even before it is committed.
const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard", "--", ...FROZEN], { encoding: "utf8" })
for (const f of untracked.split("\n").filter(Boolean)) problems.push(`untracked file under a frozen path: ${f}`)

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
