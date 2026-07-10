import AdminDashboardClient from "@/components/dashboard/AdminDashboardClient"
import { SetupRequired } from "@/components/dashboard/SetupRequired"
import { requireAdmin } from "@/lib/auth/requireAdmin"
import { BUSINESS_TZ } from "@/lib/time/ranges"
import { toZonedTime } from "date-fns-tz"
import { format } from "date-fns"
import { getPlatformStore } from "@/lib/data/store"
import { getPlatformProvider, isPlatformConfigured } from "@/lib/platform/provider"
import type { FunnelRow } from "@/lib/data/types"

// Responsive page size: the client narrows to mobile on small screens
// (the server can't see the viewport). The initial fetch uses the desktop
// size so desktop renders without a re-fetch.
export const PAGE_SIZE_MOBILE = 25
export const PAGE_SIZE_DESKTOP = 50

export default async function AdminDashboard() {
  const provider = getPlatformProvider()
  if (!isPlatformConfigured(provider)) return <SetupRequired page="admin" provider={provider} />

  // Authenticated + admin, role read from the profiles table.
  await requireAdmin()

  // Every query is independent and error-tolerant; `errored` drives a visible
  // banner instead of silently rendering fabricated zeros.
  let errored = false

  const store = await getPlatformStore()
  let pipeline = {
    totalLeads: 0, leadsToday: 0, leadsMonth: 0, sentCount: 0,
    sentRevenue: 0, sentRevenueMonth: 0, tcpaVerified: 0,
  }
  let leadsPage = { items: [] as Awaited<ReturnType<typeof store.listAllLeads>>, total: 0 }
  let dailyRows: { day: string; count: number }[] = []
  let funnelRows: FunnelRow[] = []
  try {
    ;[pipeline, leadsPage, dailyRows, funnelRows] = await Promise.all([
      store.getPipelineStats(),
      store.listLeads({}, 0, PAGE_SIZE_DESKTOP),
      store.getDailyLeadCounts(),
      store.getFunnelBreakdown(),
    ])
  } catch (error) {
    errored = true
    console.error("[dashboard] initial data load failed", error)
  }

  const stats = {
    totalLeads: pipeline.totalLeads,
    leadsToday: pipeline.leadsToday,
    sentToMarketplace: pipeline.sentCount,
    tcpaVerified: pipeline.tcpaVerified,
  }

  // 7-day volume chart, zero-filled, bucketed in the business timezone.
  const dailyMap = new Map(dailyRows.map((r) => [r.day, Number(r.count)]))
  const zonedNow = toZonedTime(new Date(), BUSINESS_TZ)
  const dailyData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(zonedNow)
    d.setDate(d.getDate() - (6 - i))
    return {
      day: format(d, "EEE"),
      leads: dailyMap.get(format(d, "yyyy-MM-dd")) ?? 0,
    }
  })

  return (
    <AdminDashboardClient
      initialStats={stats}
      initialLeads={leadsPage.items}
      totalLeadCount={leadsPage.total}
      pageSizeMobile={PAGE_SIZE_MOBILE}
      pageSizeDesktop={PAGE_SIZE_DESKTOP}
      initialDailyData={dailyData}
      funnelBreakdown={funnelRows}
      errored={errored}
    />
  )
}
