import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Calendar, RefreshCw, TrendingUp, DollarSign, BarChart2, Users } from "lucide-react"
import ProjectionsCalculators from "@/components/dashboard/ProjectionsCalculators"
import RealVsProjectedChart from "@/components/dashboard/RealVsProjectedChart"
import { SetupRequired } from "@/components/dashboard/SetupRequired"

const SELL_PRICE = 28
const ACQUISITION_COST = 10
const GROSS_MARGIN_PER_LEAD = SELL_PRICE - ACQUISITION_COST // $18

const PARTNERS = [
  { name: "Marvin Antoine", role: "Developer", share: 0.25 },
  { name: "Samuel Lamy", share: 0.25 },
  { name: "Kendrick Perkins", share: 0.25 },
  { name: "Dorian Ziggler", share: 0.25 },
]

const FUNNEL_LABELS: Record<string, string> = {
  aca: "Healthcare ACA",
  healthcare: "Healthcare ACA",
  cobra: "COBRA",
  family: "Family",
  self_employed: "Self-Employed",
  small_business: "Small Business",
}

export default async function ProjectionsDashboard() {
  const supabase = await createClient()
  if (!supabase) return <SetupRequired page="projections" />

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login?redirectTo=/dashboard/projections")

  const role = (user.user_metadata as { role?: string } | null)?.role
  if (role !== "admin") redirect("/dashboard/agent")

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const safeCount = async (q: PromiseLike<{ count: number | null }>) => {
    try { return (await q).count ?? 0 } catch { return 0 }
  }
  const safeData = async <T,>(q: PromiseLike<{ data: T | null }>): Promise<T> => {
    try { return ((await q).data ?? []) as T } catch { return [] as T }
  }

  // Fetch all data in parallel: error-tolerant per query
  const [totalLeads, soldLeads, soldLeadsThisMonth, recentLeads, funnelBreakdown] = await Promise.all([
    safeCount(supabase.from("leads").select("*", { count: "exact", head: true })),
    safeData<{ gross_margin: number | null; sell_price: number | null; acquisition_cost: number | null }[]>(
      supabase.from("leads").select("gross_margin, sell_price, acquisition_cost").eq("status", "sold")
    ),
    safeData<{ gross_margin: number | null; sell_price: number | null; acquisition_cost: number | null }[]>(
      supabase.from("leads")
        .select("gross_margin, sell_price, acquisition_cost")
        .eq("status", "sold")
        .gte("created_at", startOfMonth.toISOString())
    ),
    safeData<{ created_at: string; status: string; funnel_type: string | null }[]>(
      supabase.from("leads")
        .select("created_at, status, funnel_type")
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: true })
    ),
    safeData<{ funnel_type: string | null; status: string }[]>(
      supabase.from("leads").select("funnel_type, status")
    ),
  ])

  // All-time financials
  const allTimeSoldCount = soldLeads.length
  const allTimeRevenue = allTimeSoldCount * SELL_PRICE
  const allTimeGrossMargin = allTimeSoldCount * GROSS_MARGIN_PER_LEAD

  // This month financials
  const thisMonthSoldCount = soldLeadsThisMonth.length
  const thisMonthGrossMargin = thisMonthSoldCount * GROSS_MARGIN_PER_LEAD

  // Build last-30-days actual vs projected chart data
  const dailyActual: Record<string, number> = {}
  recentLeads.forEach((lead) => {
    const day = lead.created_at.split("T")[0]
    dailyActual[day] = (dailyActual[day] || 0) + 1
  })

  // Projected: assume ~5 leads/day as baseline projection
  const PROJECTED_PER_DAY = 5
  const chartData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(thirtyDaysAgo)
    date.setDate(date.getDate() + i)
    const key = date.toISOString().split("T")[0]
    const label = `${date.getMonth() + 1}/${date.getDate()}`
    return {
      date: label,
      projected: PROJECTED_PER_DAY,
      actual: dailyActual[key] || 0,
    }
  })

  // Funnel breakdown
  const funnelMap: Record<string, { leads: number; sold: number }> = {}
  funnelBreakdown.forEach((lead) => {
    const key = lead.funnel_type || "aca"
    if (!funnelMap[key]) funnelMap[key] = { leads: 0, sold: 0 }
    funnelMap[key].leads++
    if (lead.status === "sold") funnelMap[key].sold++
  })

  const funnelRows = Object.entries(funnelMap).map(([key, val]) => ({
    key,
    label: FUNNEL_LABELS[key] || key,
    leads: val.leads,
    sold: val.sold,
    convRate: val.leads > 0 ? ((val.sold / val.leads) * 100).toFixed(1) : "0.0",
    revenue: val.sold * SELL_PRICE,
  }))

  async function handleRefresh() {
    "use server"
    revalidatePath("/dashboard/projections")
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Projections</h1>
          <p className="text-sm text-gray-500">Real Performance + ROI Modeling</p>
        </div>
        <div className="flex items-center gap-3">
          <form action={handleRefresh}>
            <Button type="submit" variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </form>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90">
            <Calendar className="w-4 h-4 mr-2" />
            Present Mode
          </Button>
        </div>
      </div>

      {/* ─── REAL PERFORMANCE SECTION ─── */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-5 h-5 text-[#1e3a8a]" />
          <h2 className="text-xl font-bold text-gray-900">Real Performance</h2>
          <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">Live Data</span>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-sm text-gray-500 font-medium">Total Leads</div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{totalLeads.toLocaleString()}</div>
            <div className="text-xs text-gray-400 mt-1">All time</div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-sm text-gray-500 font-medium">Total Revenue</div>
            </div>
            <div className="text-3xl font-bold text-gray-900">${allTimeRevenue.toLocaleString()}</div>
            <div className="text-xs text-gray-400 mt-1">{allTimeSoldCount} leads sold × ${SELL_PRICE}</div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <BarChart2 className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-sm text-gray-500 font-medium">Gross Margin</div>
            </div>
            <div className="text-3xl font-bold text-gray-900">${allTimeGrossMargin.toLocaleString()}</div>
            <div className="text-xs text-gray-400 mt-1">Revenue − acquisition costs</div>
          </Card>

          <Card className="p-5 border-[#D4AF37] border-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="text-sm text-gray-500 font-medium">Your Net (75%)</div>
            </div>
            <div className="text-3xl font-bold text-[#1e3a8a]">${(allTimeGrossMargin * 0.75).toLocaleString()}</div>
            <div className="text-xs text-gray-400 mt-1">After 25% dev share</div>
          </Card>
        </div>

        {/* Real vs Projected Chart */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Real vs Projected Leads - Last 30 Days</h3>
              <p className="text-sm text-gray-500 mt-0.5">Dashed gold = projected ({PROJECTED_PER_DAY}/day baseline) · Solid navy = actual</p>
            </div>
          </div>
          <div className="h-64">
            <RealVsProjectedChart data={chartData} />
          </div>
        </Card>

        {/* Partner Revenue Split */}
        <Card className="p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">Partner Revenue Split</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Partner</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Share</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">This Month</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">All Time</th>
                </tr>
              </thead>
              <tbody>
                {PARTNERS.map((partner, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{partner.name}</div>
                      {partner.role && <div className="text-xs text-gray-400">{partner.role}</div>}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{(partner.share * 100).toFixed(0)}%</td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">
                      ${Math.floor(thisMonthGrossMargin * partner.share).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#1e3a8a]">
                      ${Math.floor(allTimeGrossMargin * partner.share).toLocaleString()}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-semibold">
                  <td className="py-3 px-4 text-gray-900">Total</td>
                  <td className="py-3 px-4 text-gray-600">100%</td>
                  <td className="py-3 px-4 text-right text-gray-900">${thisMonthGrossMargin.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-[#1e3a8a]">${allTimeGrossMargin.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Gross margin = ${SELL_PRICE} sell price − ${ACQUISITION_COST} acquisition cost = ${GROSS_MARGIN_PER_LEAD}/lead
          </p>
        </Card>

        {/* Funnel Performance Breakdown */}
        <Card className="p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">Funnel Performance Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Funnel</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Leads</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Sold</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Conv Rate</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {funnelRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-400">No lead data yet</td>
                  </tr>
                ) : (
                  funnelRows.map((row) => (
                    <tr key={row.key} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{row.label}</td>
                      <td className="py-3 px-4 text-right text-gray-700">{row.leads.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-gray-700">{row.sold.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-semibold ${Number(row.convRate) >= 15 ? "text-green-600" : Number(row.convRate) >= 8 ? "text-amber-600" : "text-gray-600"}`}>
                          {row.convRate}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-[#1e3a8a]">
                        ${row.revenue.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
                {funnelRows.length > 0 && (
                  <tr className="bg-gray-50 font-semibold">
                    <td className="py-3 px-4 text-gray-900">Total</td>
                    <td className="py-3 px-4 text-right text-gray-900">{funnelRows.reduce((s, r) => s + r.leads, 0).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-gray-900">{funnelRows.reduce((s, r) => s + r.sold, 0).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-gray-900">
                      {funnelRows.reduce((s, r) => s + r.leads, 0) > 0
                        ? ((funnelRows.reduce((s, r) => s + r.sold, 0) / funnelRows.reduce((s, r) => s + r.leads, 0)) * 100).toFixed(1)
                        : "0.0"}%
                    </td>
                    <td className="py-3 px-4 text-right text-[#1e3a8a]">${funnelRows.reduce((s, r) => s + r.revenue, 0).toLocaleString()}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* ─── SEPARATOR ─── */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex-1 border-t border-gray-200" />
        <span className="text-sm text-gray-400 font-medium whitespace-nowrap">Projections & Calculators</span>
        <div className="flex-1 border-t border-gray-200" />
      </div>

      {/* ─── EXISTING CALCULATORS (unchanged) ─── */}
      <ProjectionsCalculators />
    </div>
  )
}
