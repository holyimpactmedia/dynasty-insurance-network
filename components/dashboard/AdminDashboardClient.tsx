"use client"

import { useState, useEffect, useMemo } from "react"
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
  TrendingUp,
  Inbox,
  Globe,
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
import { createClient } from "@/lib/supabase/client"
import { AIScoreBadge } from "@/components/dashboard/AIScoreBadge"
import { LeadDetailDrawer } from "@/components/dashboard/LeadDetailDrawer"
import type { Lead } from "@/lib/types/lead"
import { FUNNEL_LABELS } from "@/lib/types/lead"

interface DailyCount {
  day: string
  leads: number
}

interface DashboardStats {
  leadsToday: number
  leadsThisWeek: number
  totalLeads: number
  sentToUsha: number
}

interface AdminDashboardClientProps {
  initialStats: DashboardStats
  initialLeads: Lead[]
  initialDailyData: DailyCount[]
}

// ── helpers ───────────────────────────────────────────────────────────────────

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function exportToCsv(leads: Lead[]): void {
  const headers = [
    "Reference", "First Name", "Last Name", "Email", "Phone", "Age",
    "State", "Funnel", "Income Range", "Household Size", "Qualifying Event",
    "Priorities", "AI Score", "UTM Source", "UTM Campaign", "USHA Status",
    "Status", "Submitted At",
  ]
  const rows = leads.map(l => [
    l.reference_number, l.first_name, l.last_name, l.email, l.phone ?? "",
    l.age ?? "", l.state ?? "",
    FUNNEL_LABELS[l.funnel_type ?? ""] ?? l.funnel_type ?? "",
    l.income_range ?? "", l.household_size ?? "", l.qualifying_event ?? "",
    l.priorities ?? "", l.ai_score ?? "", l.utm_source ?? "",
    l.utm_campaign ?? "", l.usha_status ?? "", l.status,
    new Date(l.created_at).toLocaleString(),
  ])
  const csv = [headers, ...rows]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `dynasty-leads-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── small UI pieces ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    new: "bg-blue-100 text-blue-700 border-blue-200",
    contacted: "bg-green-100 text-green-700 border-green-200",
    appointment_set: "bg-purple-100 text-purple-700 border-purple-200",
    sold: "bg-emerald-100 text-emerald-700 border-emerald-200",
    disqualified: "bg-gray-100 text-gray-500 border-gray-200",
  }
  const labels: Record<string, string> = {
    new: "New", contacted: "Contacted",
    appointment_set: "Appt Set", sold: "Sold", disqualified: "DQ",
  }
  return (
    <Badge className={`${styles[status] ?? "bg-gray-100 text-gray-600"} text-xs`}>
      {labels[status] ?? status}
    </Badge>
  )
}

function UshaStatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-xs text-gray-400">—</span>
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
  label, value, sub, icon: Icon, accent,
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

// ── main component ────────────────────────────────────────────────────────────

export default function AdminDashboardClient({
  initialStats,
  initialLeads,
  initialDailyData,
}: AdminDashboardClientProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [stats, setStats] = useState(initialStats)
  const [dailyData] = useState(initialDailyData)
  const [refreshing, setRefreshing] = useState(false)

  // Drawer state
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Filter state
  const [search, setSearch] = useState("")
  const [filterFunnel, setFilterFunnel] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterUsha, setFilterUsha] = useState("all")
  const [filterMinScore, setFilterMinScore] = useState("0")

  // ── real-time subscriptions ─────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel("admin-leads-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "leads" }, payload => {
        const newLead = payload.new as Lead
        setLeads(prev => [newLead, ...prev])
        setStats(prev => ({
          ...prev,
          leadsToday: prev.leadsToday + 1,
          totalLeads: prev.totalLeads + 1,
          leadsThisWeek: prev.leadsThisWeek + 1,
        }))
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "leads" }, payload => {
        const updated = payload.new as Lead
        setLeads(prev => prev.map(l => l.id === updated.id ? { ...l, ...updated } : l))
        // Sync selected lead if it's open in the drawer
        setSelectedLead(prev => prev?.id === updated.id ? { ...prev, ...updated } : prev)
        if (updated.usha_status === "sent") {
          setStats(prev => ({ ...prev, sentToUsha: prev.sentToUsha + 1 }))
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  // ── refresh ──────────────────────────────────────────────────────────────────
  const handleRefresh = async () => {
    setRefreshing(true)
    const supabase = createClient()
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(startOfToday)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())

    const [
      { count: leadsToday },
      { count: leadsThisWeek },
      { count: totalLeads },
      { count: sentToUsha },
      { data: freshLeads },
    ] = await Promise.all([
      supabase.from("leads").select("*", { count: "exact", head: true }).gte("created_at", startOfToday.toISOString()),
      supabase.from("leads").select("*", { count: "exact", head: true }).gte("created_at", startOfWeek.toISOString()),
      supabase.from("leads").select("*", { count: "exact", head: true }),
      supabase.from("leads").select("*", { count: "exact", head: true }).eq("usha_status", "sent"),
      supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(200),
    ])

    setStats({ leadsToday: leadsToday ?? 0, leadsThisWeek: leadsThisWeek ?? 0, totalLeads: totalLeads ?? 0, sentToUsha: sentToUsha ?? 0 })
    if (freshLeads) setLeads(freshLeads as Lead[])
    setRefreshing(false)
  }

  // ── filtered leads ───────────────────────────────────────────────────────────
  const filteredLeads = useMemo(() => {
    const q = search.toLowerCase()
    const minScore = parseInt(filterMinScore, 10) || 0
    return leads.filter(l => {
      if (q) {
        const hay = [l.first_name, l.last_name, l.email, l.phone, l.reference_number, l.state].join(" ").toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (filterFunnel !== "all" && l.funnel_type !== filterFunnel) return false
      if (filterStatus !== "all" && l.status !== filterStatus) return false
      if (filterUsha !== "all") {
        if (filterUsha === "none" && l.usha_status) return false
        if (filterUsha !== "none" && l.usha_status !== filterUsha) return false
      }
      if (minScore > 0 && (l.ai_score === null || l.ai_score < minScore)) return false
      return true
    })
  }, [leads, search, filterFunnel, filterStatus, filterUsha, filterMinScore])

  const weeklyAvg = dailyData.length > 0
    ? (dailyData.reduce((s, d) => s + d.leads, 0) / dailyData.length).toFixed(1)
    : "0"

  return (
    <div className="p-6 max-w-[1600px] mx-auto">

      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lead CRM</h1>
          <p className="text-sm text-gray-500">Dynasty Insurance Network — Admin</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => exportToCsv(filteredLeads)}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Leads Today" value={stats.leadsToday} sub={`This week: ${stats.leadsThisWeek}`} icon={Activity} accent="text-blue-500" />
        <StatCard label="Total Leads" value={stats.totalLeads} icon={Inbox} accent="text-purple-500" />
        <StatCard label="Sent to USHA" value={stats.sentToUsha} sub="Purchased by agents" icon={Globe} accent="text-green-500" />
        <StatCard label="Weekly Avg" value={weeklyAvg} sub="leads / day" icon={TrendingUp} accent="text-amber-500" />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <Card className="p-5 lg:col-span-1">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Daily Lead Volume</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dailyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip />
              <Bar dataKey="leads" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Leads by Funnel</h2>
          <div className="space-y-3">
            {Object.entries(FUNNEL_LABELS).map(([key, label]) => {
              const count = leads.filter(l => l.funnel_type === key).length
              const pct = leads.length > 0 ? Math.round((count / leads.length) * 100) : 0
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{label}</span>
                    <span className="text-gray-500 font-medium">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#1e3a8a] rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Leads table */}
      <Card className="overflow-hidden">
        {/* Filters bar */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search name, email, phone, ref…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterFunnel} onValueChange={setFilterFunnel}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All funnels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All funnels</SelectItem>
              {Object.entries(FUNNEL_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="appointment_set">Appt Set</SelectItem>
              <SelectItem value="sold">Sold</SelectItem>
              <SelectItem value="disqualified">DQ</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterUsha} onValueChange={setFilterUsha}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="USHA status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All USHA</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="none">Not sent</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterMinScore} onValueChange={setFilterMinScore}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Min AI score" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Any score</SelectItem>
              <SelectItem value="80">80+ (Hot)</SelectItem>
              <SelectItem value="65">65+ (Warm)</SelectItem>
              <SelectItem value="45">45+ (Qualified)</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 ml-auto">
            <Badge className="bg-green-100 text-green-700 border-green-200">Live</Badge>
            <span className="text-sm text-gray-400">{filteredLeads.length} leads</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-600">Reference</TableHead>
                <TableHead className="font-semibold text-gray-600">Name</TableHead>
                <TableHead className="font-semibold text-gray-600">Contact</TableHead>
                <TableHead className="font-semibold text-gray-600">State</TableHead>
                <TableHead className="font-semibold text-gray-600">Funnel</TableHead>
                <TableHead className="font-semibold text-gray-600">AI Score</TableHead>
                <TableHead className="font-semibold text-gray-600">USHA</TableHead>
                <TableHead className="font-semibold text-gray-600">Status</TableHead>
                <TableHead className="font-semibold text-gray-600">UTM Source</TableHead>
                <TableHead className="font-semibold text-gray-600">Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-gray-400 py-16">
                    No leads match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map(lead => (
                  <TableRow
                    key={lead.id}
                    className="cursor-pointer hover:bg-blue-50/60 transition-colors"
                    onClick={() => { setSelectedLead(lead); setDrawerOpen(true) }}
                  >
                    <TableCell className="font-mono text-xs text-gray-500">
                      {lead.reference_number}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-gray-900">
                        {lead.first_name} {lead.last_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-gray-600">{lead.email}</div>
                      {lead.phone && <div className="text-xs text-gray-400">{lead.phone}</div>}
                    </TableCell>
                    <TableCell className="text-gray-700">{lead.state ?? "—"}</TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-600">
                        {FUNNEL_LABELS[lead.funnel_type ?? ""] ?? lead.funnel_type ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <AIScoreBadge score={lead.ai_score} reasons={lead.ai_score_reasons} />
                    </TableCell>
                    <TableCell>
                      <UshaStatusBadge status={lead.usha_status ?? null} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={lead.status} />
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {lead.utm_source ?? "—"}
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
      </Card>

      {/* Lead detail drawer */}
      <LeadDetailDrawer
        lead={selectedLead}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  )
}
