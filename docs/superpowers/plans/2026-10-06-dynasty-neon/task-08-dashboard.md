# Task 8: Dashboard on admin APIs

Part of [docs/plan.md](../../../plan.md). Read its Global Constraints first.

**Goal:** the admin dashboard and projections read leads only through role-checked server routes (`/api/admin/leads`, `/api/admin/stats`, `/api/admin/export`), refresh by polling (30 s leads, 60 s stats, plus on window focus) instead of Supabase Realtime, and look exactly as they do today. A guard test proves every route under `app/api/admin/**` answers 401 with no session.

**Files:**
- Create (copy verbatim): `lib/api/lead-filters.ts`, `lib/api/lead-filters.test.ts`, `lib/data/dashboard-view.ts`, `app/api/admin/leads/route.ts`, `app/api/admin/stats/route.ts`
- Create (copy, then edit): `app/api/admin/export/route.ts`, `app/dashboard/admin/page.tsx` (replaces main's)
- Create (new): `lib/settings.ts`, `app/api/admin/auth-guard.test.ts`
- Modify: `components/dashboard/AdminDashboardClient.tsx` (data layer only), `app/dashboard/projections/page.tsx`
- Untouched on purpose: `components/dashboard/LeadDetailDrawer.tsx`, `ProjectionsCalculators.tsx`, `RealVsProjectedChart.tsx` (every redesign change there is Union styling)

**Interfaces:**
- Consumes: Task 4 store (`listLeads`, `listAllLeads`, `getPipelineStats`, `getDailyLeadCounts`, `getFunnelBreakdown`, `getRecentLeadTimes`, `getSetting`); Task 5 `requireAdmin`, `requireAdminApi`; Task 3 `isPlatformConfigured`; existing `@/lib/csv` `toCsv`.
- Produces:
  - `GET /api/admin/leads?page&pageSize&search&funnel&marketplaceStatus&minScore` returns `{ items: Lead[], total: number }`; 400 on invalid params (search over 120 chars).
  - `GET /api/admin/stats` returns `{ stats: { totalLeads, leadsToday, sentToMarketplace, tcpaVerified }, dailyData: { day, leads }[], funnels: FunnelRow[] }`.
  - `GET /api/admin/export?<same filters>` returns a CSV attachment named `dynasty-leads-YYYY-MM-DD.csv`.
  - `getProjectionsEnabled(): Promise<boolean>` and `SETTING_KEYS = { projectionsEnabled: "projections_enabled" }` from `@/lib/settings` (used by Task 9).

**Why:** on Supabase, the database's own row rules stopped a non-admin from reading leads even though the browser queried directly. On Neon the app connects with full rights, so every read must go through a server route that checks the role first.

- [ ] **Step 1: Copy the verbatim files**

```bash
mkdir -p lib/api app/api/admin/leads app/api/admin/stats app/api/admin/export
git show origin/redesign/union-private-healthcare:lib/api/lead-filters.ts > lib/api/lead-filters.ts
git show origin/redesign/union-private-healthcare:lib/api/lead-filters.test.ts > lib/api/lead-filters.test.ts
git show origin/redesign/union-private-healthcare:lib/data/dashboard-view.ts > lib/data/dashboard-view.ts
git show origin/redesign/union-private-healthcare:app/api/admin/leads/route.ts > app/api/admin/leads/route.ts
git show origin/redesign/union-private-healthcare:app/api/admin/stats/route.ts > app/api/admin/stats/route.ts
git show origin/redesign/union-private-healthcare:app/api/admin/export/route.ts > app/api/admin/export/route.ts
git show origin/redesign/union-private-healthcare:app/dashboard/admin/page.tsx > app/dashboard/admin/page.tsx
```

Run `pnpm vitest run lib/api`. Expected: PASS on zod 3.25.76 (the filters use only `z.object`, `z.coerce`, `z.enum`, `ZodError`).

- [ ] **Step 2: Export filename and admin page comment**

In `app/api/admin/export/route.ts`, replace:

```ts
    const filename = `union-leads-${new Date().toISOString().slice(0, 10)}.csv`
```

with:

```ts
    const filename = `dynasty-leads-${new Date().toISOString().slice(0, 10)}.csv`
```

In `app/dashboard/admin/page.tsx`, replace `  // Authenticated + admin, role read from the profiles table.` with `  // Authenticated + admin or superadmin, role read from the Better Auth session.`

- [ ] **Step 3: Settings reader (projections toggle only)**

Create `lib/settings.ts`:

```ts
import { getPlatformStore } from "@/lib/data/store"

/**
 * App-wide feature flags stored in the `app_settings` table and controlled by
 * the super admin from the Settings panel. Writes happen only from the
 * super-admin Settings page; reads happen server side.
 *
 * Every getter fails open to a safe default so a missing row or unconfigured
 * database never hard-breaks the dashboard.
 */

export const SETTING_KEYS = {
  projectionsEnabled: "projections_enabled",
} as const

async function readSetting(key: string): Promise<unknown> {
  try {
    return await (await getPlatformStore()).getSetting(key)
  } catch {
    return undefined
  }
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value
  if (value === "true") return true
  if (value === "false") return false
  return fallback
}

/** Whether the Projections dashboard is enabled. Defaults to true. */
export async function getProjectionsEnabled(): Promise<boolean> {
  return asBoolean(await readSetting(SETTING_KEYS.projectionsEnabled), true)
}
```

(The redesign's `lead_intake_paused` reader is left out on purpose: it was a cutover lever for copying data out of Supabase, which this fresh start does not do, and a row left at `true` would make every funnel quietly return 503. The row stays in the database untouched.)

- [ ] **Step 4: Write the admin-route guard test first**

Create `app/api/admin/auth-guard.test.ts`:

```ts
import { readdirSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

// Guard (spec section 5): every route handler under app/api/admin/** answers
// 401 when nobody is signed in, before it touches the database, the auth API
// or email. Routes are discovered from disk, so a new admin route is covered
// the moment its file exists. The real gates in lib/auth/requireAdmin.ts run;
// only the session lookup underneath them is faked (to "no session").

const tripwire = vi.hoisted(() => ({ calls: [] as string[] }))

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
  cookies: async () => ({ get: () => undefined, getAll: () => [] }),
}))

vi.mock("@/lib/platform/provider", () => ({ isPlatformConfigured: () => true }))

vi.mock("@/lib/auth/server", () => ({
  auth: {
    api: new Proxy({} as Record<string, unknown>, {
      get(_target, prop) {
        // The session lookup: nobody is signed in.
        if (prop === "getSession") return async () => null
        if (typeof prop !== "string" || prop === "then") return undefined
        // Any other auth API call before the gate is a failure.
        return async () => {
          tripwire.calls.push(`auth.api.${prop}`)
          throw new Error(`auth.api.${prop} reached without a session`)
        }
      },
    }),
  },
}))

vi.mock("@/lib/db/client", () => {
  const trip = (name: string) => () => {
    tripwire.calls.push(name)
    throw new Error(`${name} reached without a session`)
  }
  return { getNeonPool: trip("getNeonPool"), getNeonDb: trip("getNeonDb"), requireNeonDb: trip("requireNeonDb") }
})

vi.mock("@/lib/data/store", () => ({
  getPlatformStore: async () => {
    tripwire.calls.push("getPlatformStore")
    throw new Error("getPlatformStore reached without a session")
  },
}))

const ADMIN_API_DIR = fileURLToPath(new URL(".", import.meta.url))
const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const

// Every route file below app/api/admin, as "leads/route.ts" and so on.
const routeFiles = readdirSync(ADMIN_API_DIR, { recursive: true, encoding: "utf8" })
  .map((entry) => entry.split(path.sep).join("/"))
  .filter((rel) => /(^|\/)route\.(ts|tsx|js|mjs)$/.test(rel))
  .sort()

// Positive control on discovery: a guard that finds no routes proves nothing.
// Task 9 adds "users/route.ts" to this list.
const KNOWN_ROUTES = ["export/route.ts", "leads/route.ts", "stats/route.ts"]

type Handler = (
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) => Promise<Response>

describe("admin API guard: no session means 401", () => {
  beforeEach(() => {
    tripwire.calls = []
    // Look fully configured, so a 401 can only come from the missing session.
    vi.stubEnv("DATABASE_URL", "postgresql://guard:guard@127.0.0.1:1/guard")
    vi.stubEnv("BETTER_AUTH_SECRET", "guard-test-secret-at-least-32-characters")
    vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000")
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("discovers every known admin route", () => {
    expect(routeFiles).toEqual(expect.arrayContaining(KNOWN_ROUTES))
  })

  it.each(routeFiles)("%s answers 401 for every method it exports", async (rel) => {
    const mod = (await import(/* @vite-ignore */ path.join(ADMIN_API_DIR, rel))) as Record<string, unknown>
    const methods = HTTP_METHODS.filter((method) => typeof mod[method] === "function")
    expect(methods.length, `${rel} exports no HTTP handler`).toBeGreaterThan(0)

    const urlPath = rel.replace(/\/?route\.\w+$/, "")
    for (const method of methods) {
      const request = new NextRequest(`http://localhost/api/admin/${urlPath}`, {
        method,
        ...(method === "GET" ? {} : { headers: { "content-type": "application/json" }, body: "{}" }),
      })
      const response = await (mod[method] as Handler)(request, { params: Promise.resolve({}) })
      expect(response.status, `${method} ${rel}`).toBe(401)
    }
    expect(tripwire.calls, `${rel} reached a protected dependency before the auth check`).toEqual([])
  })
})
```

Run `pnpm vitest run app/api/admin`. Expected: PASS (the copied routes call `requireAdminApi()` first).

- [ ] **Step 5: Prove the guard can fail (two controls)**

1. Create `app/api/admin/canary/route.ts`:

```ts
// Deliberate violation to prove the guard test can fail. Delete after the run.
export async function GET() {
  return Response.json({ ok: true })
}
```

Run `pnpm vitest run app/api/admin/auth-guard.test.ts`. Expected: exactly one FAIL, `canary/route.ts answers 401 ...` with `expected 200 to be 401`. Delete the canary (`rm -r app/api/admin/canary`) and re-run: PASS.

2. Temporarily remove the two `requireAdminApi` lines from `app/api/admin/stats/route.ts`. Expected: FAIL (`getPlatformStore` reached, status not 401). Restore with `git checkout -- app/api/admin/stats/route.ts` if already committed, otherwise undo the edit. Re-run: PASS.

- [ ] **Step 6: Dashboard client reads through the admin APIs**

In `components/dashboard/AdminDashboardClient.tsx`, replace lines 1 through 403 (from `"use client"` through the line `  }, [applyFilters])` that closes `handleExport`) with exactly this block, leaving lines 404 to 713 (all markup) byte-identical except the one edit after the block:

```tsx
"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Activity,
  Download,
  RefreshCw,
  Search,
  Inbox,
  Globe,
  ShieldCheck,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { AIScoreBadge } from "@/components/dashboard/AIScoreBadge"
import { LeadDetailDrawer } from "@/components/dashboard/LeadDetailDrawer"
import type { Lead } from "@/lib/types/lead"
import { FUNNEL_LABELS } from "@/lib/types/lead"

// Polling replaces Supabase Realtime. Both polls run only while the tab is
// visible; a focus refresh covers a returning admin. Kept slow on purpose: each
// poll wakes the Neon database, and this dashboard does not need seconds-fresh data.
const LEADS_POLL_MS = 30_000
const STATS_POLL_MS = 60_000

interface DashboardStats {
  totalLeads: number
  leadsToday: number
  sentToMarketplace: number
  tcpaVerified: number
}

interface DailyCount {
  day: string
  leads: number
}

interface FunnelRow {
  funnel_type: string
  leads: number
  sent: number
  revenue: number
}

interface AdminDashboardClientProps {
  initialStats: DashboardStats
  initialLeads: Lead[]
  totalLeadCount: number
  pageSizeMobile: number
  pageSizeDesktop: number
  initialDailyData: DailyCount[]
  funnelBreakdown: FunnelRow[]
  errored: boolean
}

// ── helpers ───────────────────────────────────────────────────────────────────

function getTimeAgo(date: Date): string {
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function MarketplaceBadge({ status }: { status: string | null | undefined }) {
  if (!status) return <span className="text-xs text-gray-400">Not sent</span>
  const styles: Record<string, string> = {
    sent: "bg-green-100 text-green-700 border-green-200",
    failed: "bg-red-100 text-red-700 border-red-200",
    pending: "bg-amber-100 text-amber-700 border-amber-200",
  }
  return (
    <Badge className={`${styles[status] ?? "bg-gray-100 text-gray-500"} text-xs`}>
      {status}
    </Badge>
  )
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  accent: string
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500 font-medium">{label}</span>
        <Icon className={`w-4 h-4 ${accent}`} />
      </div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </Card>
  )
}

// ── component ────────────────────────────────────────────────────────────────

export default function AdminDashboardClient({
  initialStats,
  initialLeads,
  totalLeadCount,
  pageSizeMobile,
  pageSizeDesktop,
  initialDailyData,
  funnelBreakdown,
  errored,
}: AdminDashboardClientProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [stats, setStats] = useState(initialStats)
  const [dailyData, setDailyData] = useState(initialDailyData)
  const [funnels, setFunnels] = useState(funnelBreakdown)
  const [totalCount, setTotalCount] = useState(totalLeadCount)
  const [page, setPage] = useState(0)
  // Initialized to the desktop size to match the server-rendered list; the
  // matchMedia effect below narrows it to mobile on small screens.
  const [pageSize, setPageSize] = useState(pageSizeDesktop)
  const [loading, setLoading] = useState(false)
  // Separate flags so a good stats refresh never hides a failed lead load
  // (or the reverse). Either one shows the banner.
  const [leadsError, setLeadsError] = useState(errored)
  const [statsError, setStatsError] = useState(errored)

  // Drawer
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Filters
  const [search, setSearch] = useState("")
  const [filterFunnel, setFilterFunnel] = useState("all")
  const [filterMarketplace, setFilterMarketplace] = useState("all")
  const [filterMinScore, setFilterMinScore] = useState("0")

  // Current page size, readable inside polling callbacks without stale closures.
  const pageSizeRef = useRef(pageSize)
  // In-flight requests. A user action aborts whatever is in flight; a
  // background poll never aborts anything and skips its turn instead.
  const pageAbortRef = useRef<AbortController | null>(null)
  const statsAbortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    pageSizeRef.current = pageSize
  }, [pageSize])

  // Abort anything still in flight when the dashboard unmounts.
  useEffect(
    () => () => {
      pageAbortRef.current?.abort()
      statsAbortRef.current?.abort()
    },
    [],
  )

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  // Active filters as /api/admin/leads query params. The server validates and
  // sanitizes them (lib/api/lead-filters.ts, lib/data/neon-store.ts).
  const buildQuery = useCallback(
    (targetPage: number, size: number) => {
      const params = new URLSearchParams({
        page: String(targetPage),
        pageSize: String(size),
      })
      // The API rejects searches over 120 characters; trim instead of erroring.
      const q = search.trim().slice(0, 120)
      if (q) params.set("search", q)
      if (filterFunnel !== "all") params.set("funnel", filterFunnel)
      if (filterMarketplace !== "all") params.set("marketplaceStatus", filterMarketplace)
      if (filterMinScore !== "0") params.set("minScore", filterMinScore)
      return params
    },
    [search, filterFunnel, filterMarketplace, filterMinScore],
  )

  // silent = background poll: no spinner, and it never interrupts a request
  // the user started (pagination, filters, Refresh).
  const loadPage = useCallback(
    async (targetPage: number, size?: number, silent = false) => {
      if (silent && pageAbortRef.current) return
      const effSize = size ?? pageSizeRef.current
      pageAbortRef.current?.abort()
      const controller = new AbortController()
      pageAbortRef.current = controller
      if (!silent) setLoading(true)
      try {
        const response = await fetch(`/api/admin/leads?${buildQuery(targetPage, effSize)}`, {
          cache: "no-store",
          signal: controller.signal,
        })
        if (!response.ok) throw new Error(`Lead query failed (${response.status})`)
        const result = (await response.json()) as { items: Lead[]; total: number }
        setLeads(result.items)
        // Keep an open drawer in sync with fresh data.
        setSelectedLead((current) =>
          current ? result.items.find((l) => l.id === current.id) ?? current : current,
        )
        setTotalCount(result.total)
        setPage(targetPage)
        setLeadsError(false)
      } catch (error) {
        if ((error as Error).name === "AbortError") return
        setLeadsError(true)
      } finally {
        if (pageAbortRef.current === controller) {
          pageAbortRef.current = null
          setLoading(false)
        }
      }
    },
    [buildQuery],
  )

  // Responsive page size: 25 on phones, 50 on desktop. The server fetched the
  // desktop size, so only small screens need to re-fetch (down to 25).
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)")
    const apply = (matches: boolean) => {
      const desired = matches ? pageSizeDesktop : pageSizeMobile
      if (desired !== pageSizeRef.current) {
        pageSizeRef.current = desired
        setPageSize(desired)
        loadPage(0, desired)
      }
    }
    apply(mq.matches)
    const handler = (e: MediaQueryListEvent) => apply(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSizeMobile, pageSizeDesktop])

  // Re-query page 0 whenever a filter changes (debounced for the search box).
  useEffect(() => {
    const t = setTimeout(() => {
      loadPage(0)
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterFunnel, filterMarketplace, filterMinScore])

  // ── live updates ─────────────────────────────────────────────────────────────
  // The visible page refreshes every 30s while the tab is visible, and right
  // away when the window regains focus.
  useEffect(() => {
    const poll = () => {
      if (document.visibilityState === "visible") void loadPage(page, undefined, true)
    }
    const interval = window.setInterval(poll, LEADS_POLL_MS)
    window.addEventListener("focus", poll)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener("focus", poll)
    }
  }, [loadPage, page])

  // ── refresh ──────────────────────────────────────────────────────────────────
  // Stats, 7-day chart and funnels from /api/admin/stats. silent = background poll.
  const refreshStats = useCallback(async (silent = false) => {
    if (silent && statsAbortRef.current) return
    statsAbortRef.current?.abort()
    const controller = new AbortController()
    statsAbortRef.current = controller
    try {
      const response = await fetch("/api/admin/stats", {
        cache: "no-store",
        signal: controller.signal,
      })
      if (!response.ok) throw new Error(`Stats query failed (${response.status})`)
      const result = (await response.json()) as {
        stats: DashboardStats
        dailyData: DailyCount[]
        funnels: FunnelRow[]
      }
      setStats(result.stats)
      setDailyData(result.dailyData)
      setFunnels(result.funnels)
      setStatsError(false)
    } catch (error) {
      if ((error as Error).name !== "AbortError") setStatsError(true)
    } finally {
      if (statsAbortRef.current === controller) statsAbortRef.current = null
    }
  }, [])

  // Refresh button: stats and the current page together.
  const handleRefresh = useCallback(() => {
    void refreshStats()
    void loadPage(page)
  }, [refreshStats, loadPage, page])

  // Stats poll: every 60s while the tab is visible, and on window focus.
  useEffect(() => {
    const poll = () => {
      if (document.visibilityState === "visible") void refreshStats(true)
    }
    const interval = window.setInterval(poll, STATS_POLL_MS)
    window.addEventListener("focus", poll)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener("focus", poll)
    }
  }, [refreshStats])

  // ── CSV export (full filtered dataset, not just the visible page) ───────────
  // Built server-side by /api/admin/export with the same filters.
  const handleExport = useCallback(() => {
    const params = buildQuery(0, 1)
    params.delete("page")
    params.delete("pageSize")
    window.location.assign(`/api/admin/export?${params}`)
  }, [buildQuery])
```

Then, in the untouched markup, replace `      {loadError && (` with `      {(leadsError || statsError) && (`.

Check the markup still compiles against the new names: `pnpm exec tsc --noEmit`. If tsc reports an identifier the markup uses that the block above no longer defines (for example a handler name), stop and compare against `git show origin/redesign/union-private-healthcare:components/dashboard/AdminDashboardClient.tsx`; do not invent a replacement.

Kept from main on purpose (not ported from redesign): the Dynasty title "Dynasty Insurance Network: Admin", bar fill `#1e3a8a`, funnel bar `bg-[#1e3a8a]`, no `font-display`. Redesign behavior intentionally not copied: its polls (every 8 and 15 s) set the loading spinner and could abort a user's Next click; here polls are silent, yield to user actions, and run every 30 and 60 s (senior review: database wake-ups cost money).

- [ ] **Step 7: Projections page on the store**

In `app/dashboard/projections/page.tsx`, replace lines 1 to 15 (the imports, from `import { createClient } from "@/lib/supabase/server"` through `import { format } from "date-fns"`) with:

```tsx
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, RefreshCw, TrendingUp, DollarSign, BarChart2, Users } from "lucide-react"
import ProjectionsCalculators from "@/components/dashboard/ProjectionsCalculators"
import RealVsProjectedChart from "@/components/dashboard/RealVsProjectedChart"
import { PrintButton } from "@/components/dashboard/PrintButton"
import { SetupRequired } from "@/components/dashboard/SetupRequired"
import { requireAdmin } from "@/lib/auth/requireAdmin"
import { getProjectionsEnabled } from "@/lib/settings"
import { BUSINESS_TZ } from "@/lib/time/ranges"
import { splitShares } from "@/lib/finance/splitShares"
import { FUNNEL_LABELS } from "@/lib/types/lead"
import { toZonedTime } from "date-fns-tz"
import { format } from "date-fns"
import { getPlatformStore } from "@/lib/data/store"
import { isPlatformConfigured } from "@/lib/platform/provider"
```

Then replace the block from `interface PipelineStatsRow {` through the `}` that closes the `for (const r of recentRows) {` loop (main lines 27 to 82) with:

```tsx
export default async function ProjectionsDashboard() {
  if (!isPlatformConfigured()) return <SetupRequired page="projections" />
  await requireAdmin()

  // Projections can be switched off globally by a super admin in Settings.
  // Block direct URL access too, not just the nav link.
  if (!(await getProjectionsEnabled())) redirect("/dashboard/admin")

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const store = await getPlatformStore()
  const [pipeline, funnelRows, recentRows] = await Promise.all([
    store.getPipelineStats(),
    store.getFunnelBreakdown(),
    store.getRecentLeadTimes(thirtyDaysAgo.toISOString()),
  ])

  const totalLeads = pipeline.totalLeads
  const sentCount = pipeline.sentCount
  const allTimeRevenue = pipeline.sentRevenue
  const monthRevenue = pipeline.sentRevenueMonth

  // Real-vs-projected: bucket the last 30 ET days.
  const dailyCounts = new Map<string, number>()
  for (const createdAt of recentRows) {
    const zoned = toZonedTime(new Date(createdAt), BUSINESS_TZ)
    const key = format(zoned, "yyyy-MM-dd")
    dailyCounts.set(key, (dailyCounts.get(key) ?? 0) + 1)
  }
```

Main lines 16 to 26 (between the imports and `interface PipelineStatsRow`) stay as they are. Keep every Dynasty class (`text-[#1e3a8a]`, `border-[#D4AF37]`) and the "Dashed gold" caption.

Named behavior change: on a database error the projections page now shows Next's error page instead of silent $0 figures.

- [ ] **Step 8: Mechanical checks**

```bash
pnpm exec tsc --noEmit && pnpm test && pnpm lint && pnpm check:guards && pnpm build
```

- [ ] **Step 9: Visual check, read-only**

With the dev server (`preview_start` name `dev`), confirm `/dashboard/admin` and `/dashboard/projections` redirect to login with no session, and that no console errors appear. The signed-in dashboard is verified on the preview in Task 11 (local sign-in would use production data).

- [ ] **Step 10: Commit**

```bash
git add lib/api lib/data/dashboard-view.ts lib/settings.ts app/api/admin app/dashboard/admin/page.tsx app/dashboard/projections/page.tsx components/dashboard/AdminDashboardClient.tsx
git commit -m "feat(dashboard): read leads through role-checked admin APIs with polling; 401 guard over every admin route"
```
