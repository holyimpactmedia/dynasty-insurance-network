"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  TrendingUp,
  Users,
  DollarSign,
  AlertTriangle,
  Play,
  Pause,
  Download,
  RefreshCw,
  CheckCircle2,
  Clock,
  Target,
  Activity,
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { createClient } from "@/lib/supabase/client"
import { AIScoreBadge } from "@/components/dashboard/AIScoreBadge"

interface Lead {
  id: string
  reference_number: string
  first_name: string
  last_name: string
  email: string
  state: string | null
  funnel_type: string | null
  status: string
  ai_score: number | null
  ai_score_reasons: string[] | null
  created_at: string
}

interface DailyCount {
  day: string
  leads: number
}

interface PipelineCount {
  new: number
  contacted: number
  appointment_set: number
  sold: number
}

interface DashboardStats {
  leadsToday: number
  leadsThisWeek: number
  totalLeads: number
  activeAgents: number
  salesToday: number
  revenueToday: number
}

interface AdminDashboardClientProps {
  initialStats: DashboardStats
  initialPipeline: PipelineCount
  initialRecentLeads: Lead[]
  initialDailyData: DailyCount[]
}

const mockCampaigns = [
  {
    name: "Final Expense - FB Video 50-65",
    status: "active",
    dailyBudget: 100,
    spendToday: 87,
    leadsToday: 12,
    cpl: 58.08,
    impressions: 47283,
    clicks: 892,
    ctr: 1.89,
  },
  {
    name: "Final Expense - FB Image 66-75",
    status: "active",
    dailyBudget: 100,
    spendToday: 78,
    leadsToday: 8,
    cpl: 75.5,
    impressions: 38156,
    clicks: 651,
    ctr: 1.71,
  },
  {
    name: "ACA Medicare Bridge 60-64",
    status: "paused",
    dailyBudget: 75,
    spendToday: 0,
    leadsToday: 0,
    cpl: 0,
    impressions: 0,
    clicks: 0,
    ctr: 0,
  },
]

const mockAgents = [
  { name: "Sarah Johnson", tier: 1, status: "available", leadsToday: 6, contactRate: 92, closeRate: 23 },
  { name: "Michael Chen", tier: 1, status: "busy", leadsToday: 5, contactRate: 88, closeRate: 21 },
  { name: "Jessica Rodriguez", tier: 2, status: "available", leadsToday: 4, contactRate: 78, closeRate: 15 },
  { name: "David Kim", tier: 2, status: "available", leadsToday: 3, contactRate: 81, closeRate: 16 },
  { name: "Kevin Thompson", tier: 3, status: "offline", leadsToday: 2, contactRate: 65, closeRate: 9 },
]

const mockAlerts = [
  {
    severity: "warning",
    type: "performance",
    message: "Agent Kevin T. has 65% contact rate (below 80% threshold)",
    time: "15 min ago",
  },
  {
    severity: "warning",
    type: "budget",
    message: "Campaign 'Final Expense 66-75' CPL at $75.50 (target: <$70)",
    time: "1 hour ago",
  },
  {
    severity: "info",
    type: "compliance",
    message: "All TCPA consents verified for today's leads",
    time: "2 hours ago",
  },
]

const tierDistribution = [
  { name: "Tier 1", value: 2, color: "#D4AF37" },
  { name: "Tier 2", value: 4, color: "#3b82f6" },
  { name: "Tier 3", value: 2, color: "#6b7280" },
]

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function AdminDashboardClient({
  initialStats,
  initialPipeline,
  initialRecentLeads,
  initialDailyData,
}: AdminDashboardClientProps) {
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState(initialStats)
  const [pipeline, setPipeline] = useState(initialPipeline)
  const [recentLeads, setRecentLeads] = useState(initialRecentLeads)
  const [dailyData, setDailyData] = useState(initialDailyData)

  // Set up real-time subscription
  useEffect(() => {
    const supabase = createClient()
    
    const channel = supabase
      .channel('leads-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'leads' },
        (payload) => {
          const newLead = payload.new as Lead
          
          // Update leads today count
          setStats(prev => ({
            ...prev,
            leadsToday: prev.leadsToday + 1,
            totalLeads: prev.totalLeads + 1,
            leadsThisWeek: prev.leadsThisWeek + 1,
          }))
          
          // Update pipeline
          setPipeline(prev => ({
            ...prev,
            new: prev.new + 1,
          }))
          
          // Add to recent leads (keep only 10)
          setRecentLeads(prev => [newLead, ...prev.slice(0, 9)])
          
          // Update daily data for today
          setDailyData(prev => {
            const today = new Date().toLocaleDateString('en-US', { weekday: 'short' })
            return prev.map(d => 
              d.day === today ? { ...d, leads: d.leads + 1 } : d
            )
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    
    const supabase = createClient()
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(startOfToday)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())

    // Fetch updated stats
    const [
      { count: leadsToday },
      { count: leadsThisWeek },
      { count: totalLeads },
      { count: activeAgents },
      { count: salesToday },
      { data: soldLeads },
      { data: newLeads },
    ] = await Promise.all([
      supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', startOfToday.toISOString()),
      supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', startOfWeek.toISOString()),
      supabase.from('leads').select('*', { count: 'exact', head: true }),
      supabase.from('agents').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'sold').gte('created_at', startOfToday.toISOString()),
      supabase.from('leads').select('sell_price').eq('status', 'sold').gte('created_at', startOfToday.toISOString()),
      supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(10),
    ])

    const revenueToday = soldLeads?.reduce((sum, lead) => sum + (Number(lead.sell_price) || 0), 0) || 0

    setStats({
      leadsToday: leadsToday || 0,
      leadsThisWeek: leadsThisWeek || 0,
      totalLeads: totalLeads || 0,
      activeAgents: activeAgents || 0,
      salesToday: salesToday || 0,
      revenueToday,
    })

    if (newLeads) {
      setRecentLeads(newLeads)
    }

    setRefreshing(false)
  }

  const totalPipeline = pipeline.new + pipeline.contacted + pipeline.appointment_set + pipeline.sold
  const pipelineData = [
    { name: "New", value: totalPipeline > 0 ? Math.round((pipeline.new / totalPipeline) * 100) : 0, count: pipeline.new },
    { name: "Contacted", value: totalPipeline > 0 ? Math.round((pipeline.contacted / totalPipeline) * 100) : 0, count: pipeline.contacted },
    { name: "Appointments", value: totalPipeline > 0 ? Math.round((pipeline.appointment_set / totalPipeline) * 100) : 0, count: pipeline.appointment_set },
    { name: "Sold", value: totalPipeline > 0 ? Math.round((pipeline.sold / totalPipeline) * 100) : 0, count: pipeline.sold },
  ]

  const conversionRate = totalPipeline > 0 ? ((pipeline.sold / totalPipeline) * 100).toFixed(1) : "0"
  const weeklyAverage = dailyData.length > 0 ? (dailyData.reduce((sum, d) => sum + d.leads, 0) / dailyData.length).toFixed(1) : "0"

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">Dynasty Lead Generation System</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Real-Time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium text-gray-600">Leads Today</div>
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats.leadsToday}</div>
          <div className="text-sm text-gray-500">This week: {stats.leadsThisWeek}</div>
          <div className="mt-2 text-xs text-gray-500">Total: {stats.totalLeads}</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium text-gray-600">Active Campaigns</div>
            <Target className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">2</div>
          <div className="text-sm text-gray-500">Spend: $1,487</div>
          <div className="mt-2 text-xs text-gray-500">Budget: 74% utilized</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium text-gray-600">Active Agents</div>
            <Users className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats.activeAgents}</div>
          <div className="text-sm text-gray-500">Avg contact: 81%</div>
          <div className="mt-2 text-xs text-gray-500">Ready to receive leads</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium text-gray-600">Sales Today</div>
            <DollarSign className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats.salesToday}</div>
          <div className="text-sm text-green-600">Revenue: ${stats.revenueToday.toFixed(2)}</div>
          <div className="mt-2 text-xs text-gray-900 font-semibold">
            Profit: ${(stats.revenueToday * 0.38).toFixed(2)}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Campaign Performance */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Campaign Performance</h2>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>

          <div className="space-y-4">
            {mockCampaigns.map((campaign, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="font-semibold text-gray-900">{campaign.name}</div>
                    <Badge
                      className={
                        campaign.status === "active"
                          ? "bg-green-100 text-green-800 border-green-200"
                          : "bg-gray-100 text-gray-800 border-gray-200"
                      }
                    >
                      {campaign.status}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    {campaign.status === "active" ? (
                      <Button size="sm" variant="outline">
                        <Pause className="w-3 h-3" />
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline">
                        <Play className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500 mb-1">Spend</div>
                    <div className="font-semibold text-gray-900">${campaign.spendToday}</div>
                    <div className="text-xs text-gray-400">of ${campaign.dailyBudget}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1">Leads</div>
                    <div className="font-semibold text-gray-900">{campaign.leadsToday}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1">CPL</div>
                    <div
                      className={`font-semibold ${
                        campaign.cpl < 60 ? "text-green-600" : campaign.cpl < 80 ? "text-amber-600" : "text-red-600"
                      }`}
                    >
                      ${campaign.cpl.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1">CTR</div>
                    <div className="font-semibold text-gray-900">{campaign.ctr.toFixed(2)}%</div>
                  </div>
                </div>

                {campaign.status === "active" && (
                  <div className="mt-3">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${(campaign.spendToday / campaign.dailyBudget) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Leads - Real Data */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Leads</h2>
            <Badge className="bg-green-100 text-green-800 border-green-200">Live</Badge>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                    No leads yet
                  </TableCell>
                </TableRow>
              ) : (
                recentLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div className="font-medium text-gray-900">
                        {lead.first_name} {lead.last_name}
                      </div>
                      <div className="text-xs text-gray-500">{lead.email}</div>
                    </TableCell>
                    <TableCell className="text-gray-700">{lead.state || "--"}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          lead.status === "new"
                            ? "bg-blue-100 text-blue-800 border-blue-200"
                            : lead.status === "contacted"
                              ? "bg-green-100 text-green-800 border-green-200"
                              : lead.status === "sold"
                                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                : "bg-gray-100 text-gray-800 border-gray-200"
                        }
                      >
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <AIScoreBadge score={lead.ai_score} reasons={lead.ai_score_reasons} />
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {getTimeAgo(new Date(lead.created_at))}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Lead Pipeline & Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Lead Pipeline</h2>

          <div className="space-y-4">
            {pipelineData.map((stage, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-gray-900">{stage.name}</div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">{stage.value}%</span>
                    <span className="font-bold text-gray-900">{stage.count}</span>
                  </div>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      i === 0
                        ? "bg-blue-500"
                        : i === 1
                          ? "bg-green-500"
                          : i === 2
                            ? "bg-purple-500"
                            : "bg-emerald-500"
                    }`}
                    style={{ width: `${stage.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-600 mb-1">Conversion Rate</div>
              <div className="text-2xl font-bold text-blue-900">{conversionRate}%</div>
              <div className="text-xs text-blue-600">Leads to Sales</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-green-600 mb-1">Total Pipeline</div>
              <div className="text-2xl font-bold text-green-900">{totalPipeline}</div>
              <div className="text-xs text-green-600">Active leads</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Daily Leads Generated</h2>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Bar dataKey="leads" fill="#1e3a8a" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Weekly Average</div>
              <div className="text-2xl font-bold text-gray-900">{weeklyAverage}</div>
              <div className="text-xs text-gray-500">leads/day</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">This Week</div>
              <div className="text-2xl font-bold text-gray-900">{stats.leadsThisWeek}</div>
              <div className="text-xs text-gray-500">total leads</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Governance & Alerts */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Governance & Compliance</h2>
          <div className="flex gap-2">
            <Badge className="bg-red-100 text-red-800 border-red-200">0 Critical</Badge>
            <Badge className="bg-amber-100 text-amber-800 border-amber-200">2 Warning</Badge>
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">1 Info</Badge>
          </div>
        </div>

        <div className="space-y-3">
          {mockAlerts.map((alert, i) => (
            <div
              key={i}
              className={`p-4 rounded-lg border-l-4 ${
                alert.severity === "critical"
                  ? "bg-red-50 border-red-500"
                  : alert.severity === "warning"
                    ? "bg-amber-50 border-amber-500"
                    : "bg-blue-50 border-blue-500"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {alert.severity === "warning" ? (
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Activity className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-medium text-gray-900 mb-1">{alert.message}</div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {alert.time}
                      </span>
                      <Badge className="bg-white border-gray-300 text-gray-700">{alert.type}</Badge>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Resolve
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t">
          <h3 className="font-semibold text-gray-900 mb-4">Compliance Checklist</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-gray-700">All leads have TCPA consent</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-gray-700">No DNC violations today</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-gray-700">Call recording active</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="text-gray-700">2 agents need license renewal</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Financial Overview */}
      <Card className="p-6 mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Financial Overview (MTD)</h2>

        <div className="grid md:grid-cols-4 gap-6">
          <div>
            <div className="text-sm text-gray-600 mb-2">Ad Spend</div>
            <div className="text-3xl font-bold text-gray-900 mb-1">$10,487</div>
            <div className="text-sm text-gray-500">{stats.totalLeads} leads generated</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-2">Revenue</div>
            <div className="text-3xl font-bold text-gray-900 mb-1">$13,800</div>
            <div className="text-sm text-gray-500">{pipeline.sold} sales closed</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-2">Net Profit</div>
            <div className="text-3xl font-bold text-green-600 mb-1">$3,313</div>
            <div className="text-sm text-gray-500">31.6% margin</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-2">ROI</div>
            <div className="text-3xl font-bold text-gray-900 mb-1">132%</div>
            <div className="text-sm text-gray-500">LTV:CAC 2.4x</div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <div>
              <div className="font-semibold text-green-900">System Profitable</div>
              <div className="text-sm text-green-700">
                Current unit economics support scaling to $2,000/day ad spend
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
