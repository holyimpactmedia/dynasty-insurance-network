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
import { getPlatformProvider, isPlatformConfigured } from "@/lib/platform/provider"
import type { FunnelRow } from "@/lib/data/types"

const PARTNERS = [
  { name: "Marvin Antoine", role: "Developer", share: 1 },
  { name: "Samuel Lamy", share: 1 },
  { name: "Kendrick Perkins", share: 1 },
  { name: "Dorian Ziggler", share: 1 },
]

// Baseline projection (leads received per day) — a visual floor for the chart.
const PROJECTED_PER_DAY = 5

export default async function ProjectionsDashboard() {
  const provider = getPlatformProvider()
  if (!isPlatformConfigured(provider)) return <SetupRequired page="projections" provider={provider} />
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
  const zonedNow = toZonedTime(new Date(), BUSINESS_TZ)
  const chartData = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(zonedNow)
    d.setDate(d.getDate() - (29 - i))
    const key = format(d, "yyyy-MM-dd")
    return {
      date: format(d, "M/d"),
      projected: PROJECTED_PER_DAY,
      actual: dailyCounts.get(key) ?? 0,
    }
  })

  // Partner splits — Hamilton method so the rows sum exactly to the total.
  const weights = PARTNERS.map((p) => p.share)
  const allTimeSplit = splitShares(allTimeRevenue, weights)
  const monthSplit = splitShares(monthRevenue, weights)

  // Funnel breakdown rows.
  const funnelTotalLeads = funnelRows.reduce((sum, r) => sum + r.leads, 0)
  const funnelTotalSent = funnelRows.reduce((sum, r) => sum + r.sent, 0)
  const funnelTotalRevenue = funnelRows.reduce(
    (sum, r) => sum + Number(r.revenue ?? 0),
    0,
  )

  async function handleRefresh() {
    "use server"
    revalidatePath("/dashboard/projections")
  }

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-3 mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pass-through Financials</h1>
          <p className="text-sm text-gray-500">
            Revenue = leads sent to marketplace × sell price · live
          </p>
        </div>
        <div className="flex items-center gap-3">
          <form action={handleRefresh}>
            <Button type="submit" variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </form>
          <PrintButton />
        </div>
      </div>

      {/* Real Performance */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-5 h-5 text-[#1e3a8a]" />
          <h2 className="text-xl font-bold text-gray-900">Real Performance</h2>
          <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">
            Live Data
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-sm text-gray-500 font-medium">Leads Received</div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{totalLeads.toLocaleString()}</div>
            <div className="text-xs text-gray-400 mt-1">All time</div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <BarChart2 className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-sm text-gray-500 font-medium">Sent to Marketplace</div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{sentCount.toLocaleString()}</div>
            <div className="text-xs text-gray-400 mt-1">usha_status = sent</div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-sm text-gray-500 font-medium">Revenue (All Time)</div>
            </div>
            <div className="text-3xl font-bold text-gray-900">${allTimeRevenue.toLocaleString()}</div>
            <div className="text-xs text-gray-400 mt-1">SUM(sell_price) of sent leads</div>
          </Card>

          <Card className="p-5 border-[#D4AF37] border-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="text-sm text-gray-500 font-medium">Revenue (This Month)</div>
            </div>
            <div className="text-3xl font-bold text-[#1e3a8a]">${monthRevenue.toLocaleString()}</div>
            <div className="text-xs text-gray-400 mt-1">Month-to-date</div>
          </Card>
        </div>

        <Card className="p-6 mb-8">
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900">Real vs Projected Leads — Last 30 Days</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Dashed gold = projected baseline ({PROJECTED_PER_DAY}/day) · Solid navy = actual received
            </p>
          </div>
          <div className="h-64">
            <RealVsProjectedChart data={chartData} />
          </div>
        </Card>

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
                  <tr key={partner.name} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{partner.name}</div>
                      {partner.role && <div className="text-xs text-gray-400">{partner.role}</div>}
                    </td>
                    <td className="py-3 px-4 text-gray-600">25%</td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">
                      ${monthSplit[i].toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#1e3a8a]">
                      ${allTimeSplit[i].toLocaleString()}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-semibold">
                  <td className="py-3 px-4 text-gray-900">Total</td>
                  <td className="py-3 px-4 text-gray-600">100%</td>
                  <td className="py-3 px-4 text-right text-gray-900">
                    ${Math.round(monthRevenue).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-[#1e3a8a]">
                    ${Math.round(allTimeRevenue).toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Split via the largest-remainder method so the partner rows always sum exactly to the total.
            Acquisition cost is not modeled per-row; the ROI calculator below handles cost/margin scenarios.
          </p>
        </Card>

        <Card className="p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">Funnel Performance Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Funnel</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Leads</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Sent</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Send Rate</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {funnelRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-400">No lead data yet</td>
                  </tr>
                ) : (
                  funnelRows.map((row) => {
                    const sendRate =
                      row.leads > 0 ? ((row.sent / row.leads) * 100).toFixed(1) : "0.0"
                    return (
                      <tr key={row.funnel_type} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">
                          {FUNNEL_LABELS[row.funnel_type] ?? row.funnel_type}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-700">{row.leads.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-gray-700">{row.sent.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`font-semibold ${
                              Number(sendRate) >= 60
                                ? "text-green-600"
                                : Number(sendRate) >= 30
                                  ? "text-amber-600"
                                  : "text-gray-600"
                            }`}
                          >
                            {sendRate}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-[#1e3a8a]">
                          ${Number(row.revenue ?? 0).toLocaleString()}
                        </td>
                      </tr>
                    )
                  })
                )}
                {funnelRows.length > 0 && (
                  <tr className="bg-gray-50 font-semibold">
                    <td className="py-3 px-4 text-gray-900">Total</td>
                    <td className="py-3 px-4 text-right text-gray-900">{funnelTotalLeads.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-gray-900">{funnelTotalSent.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-gray-900">
                      {funnelTotalLeads > 0
                        ? ((funnelTotalSent / funnelTotalLeads) * 100).toFixed(1)
                        : "0.0"}
                      %
                    </td>
                    <td className="py-3 px-4 text-right text-[#1e3a8a]">
                      ${funnelTotalRevenue.toLocaleString()}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* Separator */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex-1 border-t border-gray-200" />
        <span className="text-sm text-gray-400 font-medium whitespace-nowrap flex items-center gap-2">
          <Calendar className="w-4 h-4" /> Projections &amp; Calculators
        </span>
        <div className="flex-1 border-t border-gray-200" />
      </div>

      <ProjectionsCalculators />
    </div>
  )
}
