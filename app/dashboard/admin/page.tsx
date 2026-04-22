import { createClient } from "@/lib/supabase/server"
import AdminDashboardClient from "@/components/dashboard/AdminDashboardClient"
import type { Lead } from "@/lib/types/lead"

export default async function AdminDashboard() {
  const supabase = await createClient()

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(startOfToday)
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())

  // Fetch stats and full lead records in parallel
  const [
    { count: leadsToday },
    { count: leadsThisWeek },
    { count: totalLeads },
    { count: sentToUsha },
    { data: leadsRaw },
    { data: dailyLeadsRaw },
  ] = await Promise.all([
    supabase.from("leads").select("*", { count: "exact", head: true })
      .gte("created_at", startOfToday.toISOString()),
    supabase.from("leads").select("*", { count: "exact", head: true })
      .gte("created_at", startOfWeek.toISOString()),
    supabase.from("leads").select("*", { count: "exact", head: true }),
    // usha_status requires: ALTER TABLE leads ADD COLUMN usha_status text;
    supabase.from("leads").select("*", { count: "exact", head: true })
      .eq("usha_status", "sent"),
    // Full lead fields for the CRM table — most recent 200
    supabase.from("leads")
      .select(`
        id, reference_number,
        first_name, last_name, email, phone, age,
        state, income_range, household_size, qualifying_event, priorities,
        tcpa_consent, tcpa_consent_at, trusted_form_cert_url,
        funnel_type, utm_source, utm_medium, utm_campaign, ip_address,
        status, ai_score, ai_score_reasons, predicted_close_rate, sell_price,
        usha_status, usha_sent_at, usha_lead_id,
        created_at
      `)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.rpc("get_daily_lead_counts"),
  ])

  const stats = {
    leadsToday: leadsToday ?? 0,
    leadsThisWeek: leadsThisWeek ?? 0,
    totalLeads: totalLeads ?? 0,
    sentToUsha: sentToUsha ?? 0,
  }

  const leads: Lead[] = (leadsRaw ?? []) as Lead[]

  // Build 7-day chart — fall back to empty if the Supabase RPC doesn't exist yet
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  let dailyData: { day: string; leads: number }[] = []

  if (dailyLeadsRaw && Array.isArray(dailyLeadsRaw)) {
    dailyData = (dailyLeadsRaw as { day: string; count: number }[]).map(row => ({
      day: dayNames[new Date(row.day).getDay()],
      leads: row.count,
    }))
  } else {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      dailyData.push({ day: dayNames[d.getDay()], leads: 0 })
    }
  }

  return (
    <AdminDashboardClient
      initialStats={stats}
      initialLeads={leads}
      initialDailyData={dailyData}
    />
  )
}
