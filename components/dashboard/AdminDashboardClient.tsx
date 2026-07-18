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
  const [loadError, setLoadError] = useState(errored)

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
  const pageAbortRef = useRef<AbortController | null>(null)
  const statsAbortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    pageSizeRef.current = pageSize
  }, [pageSize])

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  const buildQuery = useCallback(
    (targetPage?: number, size?: number) => {
      const params = new URLSearchParams({
        page: String(targetPage ?? page),
        pageSize: String(size ?? pageSizeRef.current),
      })
      if (search.trim()) params.set("search", search.trim())
      if (filterFunnel !== "all") params.set("funnel", filterFunnel)
      if (filterMarketplace !== "all") params.set("marketplaceStatus", filterMarketplace)
      if (filterMinScore !== "0") params.set("minScore", filterMinScore)
      return params
    },
    [page, search, filterFunnel, filterMarketplace, filterMinScore],
  )

  const loadPage = useCallback(
    async (targetPage: number, size?: number) => {
      const effSize = size ?? pageSizeRef.current
      setLoading(true)
      pageAbortRef.current?.abort()
      const controller = new AbortController()
      pageAbortRef.current = controller
      try {
        const response = await fetch(`/api/admin/leads?${buildQuery(targetPage, effSize)}`, {
          cache: "no-store",
          signal: controller.signal,
        })
        if (!response.ok) throw new Error("Lead query failed")
        const result = await response.json() as { items: Lead[]; total: number }
        setLeads(result.items)
        setSelectedLead((current) => {
          if (!current) return current
          return result.items.find((lead) => lead.id === current.id) ?? current
        })
        setTotalCount(result.total)
        setPage(targetPage)
        setLoadError(false)
      } catch (error) {
        if ((error as Error).name === "AbortError") return
        setLoadError(true)
      } finally {
        if (pageAbortRef.current === controller) setLoading(false)
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

  // Poll only while visible. Focus refreshes immediately; stale requests abort.
  useEffect(() => {
    const refreshVisiblePage = () => {
      if (document.visibilityState === "visible") void loadPage(page)
    }
    const interval = window.setInterval(refreshVisiblePage, 8_000)
    window.addEventListener("focus", refreshVisiblePage)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener("focus", refreshVisiblePage)
      pageAbortRef.current?.abort()
    }
  }, [loadPage, page])

  // ── refresh ──────────────────────────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    setLoading(true)
    statsAbortRef.current?.abort()
    const controller = new AbortController()
    statsAbortRef.current = controller
    try {
      const [response] = await Promise.all([
        fetch("/api/admin/stats", { cache: "no-store", signal: controller.signal }),
        loadPage(page),
      ])
      if (!response.ok) throw new Error("Stats query failed")
      const result = await response.json() as {
        stats: DashboardStats
        dailyData: DailyCount[]
        funnels: FunnelRow[]
      }
      setStats(result.stats)
      setDailyData(result.dailyData)
      setFunnels(result.funnels)
      setLoadError(false)
    } catch (error) {
      if ((error as Error).name !== "AbortError") setLoadError(true)
    } finally {
      if (statsAbortRef.current === controller) setLoading(false)
    }
  }, [loadPage, page])

  useEffect(() => {
    const refreshStats = () => {
      if (document.visibilityState === "visible") void handleRefresh()
    }
    const interval = window.setInterval(refreshStats, 15_000)
    return () => {
      window.clearInterval(interval)
      statsAbortRef.current?.abort()
    }
  }, [handleRefresh])

  // ── CSV export (full filtered dataset, not just the visible page) ───────────
  const handleExport = useCallback(async () => {
    const params = buildQuery(0, 100)
    params.delete("page")
    params.delete("pageSize")
    window.location.assign(`/api/admin/export?${params}`)
  }, [buildQuery])

  const weeklyAvg =
    dailyData.length > 0
      ? (dailyData.reduce((s, d) => s + d.leads, 0) / dailyData.length).toFixed(1)
      : "0"
  const funnelTotal = funnels.reduce((s, f) => s + f.leads, 0)

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      {/* Page header */}
      <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Lead Tracker</h1>
          <p className="text-sm text-gray-500">Union Private Healthcare · Admin</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="flex-1 sm:flex-none" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" className="flex-1 sm:flex-none" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {loadError && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Some data failed to load. Numbers below may be incomplete. Try Refresh.
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Leads Today" value={stats.leadsToday} icon={Activity} accent="text-blue-500" />
        <StatCard label="Total Leads" value={stats.totalLeads} icon={Inbox} accent="text-purple-500" />
        <StatCard label="Sent to Marketplace" value={stats.sentToMarketplace} sub="usha_status = sent" icon={Globe} accent="text-green-500" />
        <StatCard label="TCPA Verified" value={stats.tcpaVerified} sub={`Weekly avg: ${weeklyAvg}/day`} icon={ShieldCheck} accent="text-amber-500" />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <Card className="p-5 lg:col-span-1">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Daily Lead Volume (7 days)</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dailyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="leads" fill="#0a2540" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Leads by Funnel</h2>
          <div className="space-y-3">
            {funnels.length === 0 ? (
              <p className="text-sm text-gray-400">No lead data yet.</p>
            ) : (
              funnels.map((f) => {
                const pct = funnelTotal > 0 ? Math.round((f.leads / funnelTotal) * 100) : 0
                return (
                  <div key={f.funnel_type}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">
                        {FUNNEL_LABELS[f.funnel_type] ?? f.funnel_type}
                      </span>
                      <span className="text-gray-500 font-medium">
                        {f.leads} ({pct}%) · {f.sent} sent
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-navy rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </Card>
      </div>

      {/* Leads table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-gray-100 space-y-3">
          {/* Prominent search — the primary way to find a lead */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="search"
              inputMode="search"
              placeholder="Search name, email, phone, or reference…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 text-base"
            />
          </div>
          {/* Secondary filters + live status */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Select value={filterFunnel} onValueChange={setFilterFunnel}>
              <SelectTrigger className="flex-1 min-w-[110px] sm:flex-none sm:w-40"><SelectValue placeholder="All funnels" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All funnels</SelectItem>
                {Object.entries(FUNNEL_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterMarketplace} onValueChange={setFilterMarketplace}>
              <SelectTrigger className="flex-1 min-w-[110px] sm:flex-none sm:w-40"><SelectValue placeholder="Marketplace" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All marketplace</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="none">Not sent</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterMinScore} onValueChange={setFilterMinScore}>
              <SelectTrigger className="flex-1 min-w-[110px] sm:flex-none sm:w-36"><SelectValue placeholder="Min AI score" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Any score</SelectItem>
                <SelectItem value="80">80+ (Hot)</SelectItem>
                <SelectItem value="65">65+ (Warm)</SelectItem>
                <SelectItem value="45">45+ (Qualified)</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex w-full items-center justify-end gap-2 sm:ml-auto sm:w-auto">
              <Badge className="bg-green-100 text-green-700 border-green-200">Live</Badge>
              <span className="text-sm text-gray-400">{totalCount} leads</span>
            </div>
          </div>
        </div>

        {/* Mobile: tappable contact cards (the table scrolls sideways, which is
            awkward on phones). Email/phone are tap-to-contact links. */}
        <div className="md:hidden divide-y divide-gray-100">
          {leads.length === 0 ? (
            <div className="text-center text-gray-400 py-16">
              {loading ? "Loading…" : "No leads match your filters."}
            </div>
          ) : (
            leads.map((lead) => (
              <button
                key={lead.id}
                type="button"
                onClick={() => {
                  setSelectedLead(lead)
                  setDrawerOpen(true)
                }}
                className="block w-full text-left p-4 active:bg-blue-50/60"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 truncate">
                      {lead.first_name} {lead.last_name}
                    </div>
                    <div className="font-mono text-xs text-gray-400">{lead.reference_number}</div>
                  </div>
                  <AIScoreBadge score={lead.ai_score} reasons={lead.ai_score_reasons} />
                </div>
                <div className="mt-2 space-y-1">
                  <a
                    href={`mailto:${lead.email}`}
                    onClick={(e) => e.stopPropagation()}
                    className="block truncate text-sm text-blue-600"
                  >
                    {lead.email}
                  </a>
                  {lead.phone && (
                    <a
                      href={`tel:${lead.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="block text-sm text-gray-600"
                    >
                      {lead.phone}
                    </a>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {FUNNEL_LABELS[lead.funnel_type ?? ""] ?? lead.funnel_type ?? "N/A"}
                  </span>
                  {lead.state && <span className="text-xs text-gray-400">· {lead.state}</span>}
                  <MarketplaceBadge status={lead.usha_status} />
                  {lead.tcpa_consent ? (
                    <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">TCPA</Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">No TCPA</Badge>
                  )}
                  <span className="ml-auto whitespace-nowrap text-xs text-gray-400">
                    {getTimeAgo(new Date(lead.created_at))}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Desktop: table. Align cell padding (px-4) with the filter bar and
            pagination (p-4) and give rows a bit more height. */}
        <div className="hidden md:block overflow-x-auto">
          <Table className="[&_th]:px-4 [&_td]:px-4 [&_td]:py-3">
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-600">Reference</TableHead>
                <TableHead className="font-semibold text-gray-600">Name</TableHead>
                <TableHead className="font-semibold text-gray-600">Contact</TableHead>
                <TableHead className="font-semibold text-gray-600">State</TableHead>
                <TableHead className="font-semibold text-gray-600">Funnel</TableHead>
                <TableHead className="font-semibold text-gray-600">AI Score</TableHead>
                <TableHead className="font-semibold text-gray-600">Marketplace</TableHead>
                <TableHead className="font-semibold text-gray-600">TCPA</TableHead>
                <TableHead className="font-semibold text-gray-600">Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-gray-400 py-16">
                    {loading ? "Loading…" : "No leads match your filters."}
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className="cursor-pointer hover:bg-blue-50/60 transition-colors"
                    onClick={() => {
                      setSelectedLead(lead)
                      setDrawerOpen(true)
                    }}
                  >
                    <TableCell className="font-mono text-xs text-gray-500">{lead.reference_number}</TableCell>
                    <TableCell>
                      <div className="font-semibold text-gray-900">
                        {lead.first_name} {lead.last_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-gray-600">{lead.email}</div>
                      {lead.phone && <div className="text-xs text-gray-400">{lead.phone}</div>}
                    </TableCell>
                    <TableCell className="text-gray-700">{lead.state ?? "N/A"}</TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-600">
                        {FUNNEL_LABELS[lead.funnel_type ?? ""] ?? lead.funnel_type ?? "N/A"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <AIScoreBadge score={lead.ai_score} reasons={lead.ai_score_reasons} />
                    </TableCell>
                    <TableCell><MarketplaceBadge status={lead.usha_status} /></TableCell>
                    <TableCell>
                      {lead.tcpa_consent ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Verified</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Missing</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-gray-400 whitespace-nowrap">
                      {getTimeAgo(new Date(lead.created_at))}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-gray-100">
          <span className="text-sm text-gray-400">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0 || loading}
              onClick={() => loadPage(page - 1)}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page + 1 >= totalPages || loading}
              onClick={() => loadPage(page + 1)}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </Card>

      <LeadDetailDrawer
        lead={selectedLead}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  )
}
