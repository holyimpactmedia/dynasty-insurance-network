import { NextResponse } from "next/server"
import { requireAdminApi } from "@/lib/auth/requireAdmin"
import { getPlatformStore } from "@/lib/data/store"
import { buildSevenDayChart } from "@/lib/data/dashboard-view"

export async function GET() {
  const access = await requireAdminApi()
  if (!access.ok) return access.response
  try {
    const store = await getPlatformStore()
    const [pipeline, dailyRows, funnels] = await Promise.all([
      store.getPipelineStats(),
      store.getDailyLeadCounts(),
      store.getFunnelBreakdown(),
    ])
    return NextResponse.json({
      stats: {
        totalLeads: pipeline.totalLeads,
        leadsToday: pipeline.leadsToday,
        sentToMarketplace: pipeline.sentCount,
        tcpaVerified: pipeline.tcpaVerified,
      },
      dailyData: buildSevenDayChart(dailyRows),
      funnels,
      refreshedAt: new Date().toISOString(),
    }, { headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    console.error("[admin/stats] query failed", error)
    return NextResponse.json({ error: "Unable to load dashboard stats" }, { status: 500 })
  }
}
