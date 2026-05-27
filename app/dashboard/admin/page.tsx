import { createClient } from "@/lib/supabase/server"
import AdminDashboardClient from "@/components/dashboard/AdminDashboardClient"
import { SetupRequired } from "@/components/dashboard/SetupRequired"
import { requireAdmin } from "@/lib/auth/requireAdmin"
import { BUSINESS_TZ } from "@/lib/time/ranges"
import { toZonedTime } from "date-fns-tz"
import { format } from "date-fns"
import type { Lead } from "@/lib/types/lead"

export const PAGE_SIZE = 50

const LEAD_COLUMNS = `
  id, reference_number, first_name, last_name, email, phone, age,
  state, income_range, household_size, qualifying_event, priorities,
  tcpa_consent, tcpa_consent_at, trusted_form_cert_url,
  funnel_type, utm_source, utm_medium, utm_campaign, ip_address,
  quiz_answers, status, ai_score, ai_score_reasons, predicted_close_rate,
  sell_price, usha_status, usha_sent_at, usha_lead_id, created_at
`

interface PipelineStatsRow {
  total_leads: number
  leads_today: number
  leads_month: number
  sent_count: number
  sent_revenue: number
  tcpa_verified: number
}

export interface FunnelRow {
  funnel_type: string
  leads: number
  sent: number
  revenue: number
}

export default async function AdminDashboard() {
  const supabase = await createClient()
  if (!supabase) return <SetupRequired page="admin" />

  // Authenticated + admin, role read from the profiles table.
  await requireAdmin()

  // Every query is independent and error-tolerant; `errored` drives a visible
  // banner instead of silently rendering fabricated zeros.
  let errored = false

  const [statsRows, leadsPage, dailyRows, funnelRows] = await Promise.all([
    (async (): Promise<PipelineStatsRow[]> => {
      const { data, error } = await supabase.rpc("get_pipeline_stats")
      if (error) errored = true
      return (data as PipelineStatsRow[] | null) ?? []
    })(),
    (async (): Promise<{ rows: Lead[]; total: number }> => {
      const { data, count, error } = await supabase
        .from("leads")
        .select(LEAD_COLUMNS, { count: "exact" })
        .order("created_at", { ascending: false })
        .range(0, PAGE_SIZE - 1)
      if (error) errored = true
      return { rows: ((data as unknown as Lead[] | null) ?? []), total: count ?? 0 }
    })(),
    (async (): Promise<{ day: string; count: number }[]> => {
      const { data, error } = await supabase.rpc("get_daily_lead_counts")
      if (error) errored = true
      return (data as { day: string; count: number }[] | null) ?? []
    })(),
    (async (): Promise<FunnelRow[]> => {
      const { data, error } = await supabase.rpc("get_funnel_breakdown")
      if (error) errored = true
      return (data as FunnelRow[] | null) ?? []
    })(),
  ])

  const s = statsRows[0]
  const stats = {
    totalLeads: s?.total_leads ?? 0,
    leadsToday: s?.leads_today ?? 0,
    sentToMarketplace: s?.sent_count ?? 0,
    tcpaVerified: s?.tcpa_verified ?? 0,
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
      initialLeads={leadsPage.rows}
      totalLeadCount={leadsPage.total}
      pageSize={PAGE_SIZE}
      initialDailyData={dailyData}
      funnelBreakdown={funnelRows}
      errored={errored}
    />
  )
}
