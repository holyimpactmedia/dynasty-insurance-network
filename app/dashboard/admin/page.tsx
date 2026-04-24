import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AdminDashboardClient from "@/components/dashboard/AdminDashboardClient"
import { SetupRequired } from "@/components/dashboard/SetupRequired"
import type { Lead } from "@/lib/types/lead"

export default async function AdminDashboard() {
  const supabase = await createClient()
  if (!supabase) return <SetupRequired page="admin" />

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login?redirectTo=/dashboard/admin")

  const role = (user.user_metadata as { role?: string } | null)?.role
  if (role !== "admin") redirect("/dashboard/agent")

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(startOfToday)
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())

  const safeCount = async (q: PromiseLike<{ count: number | null }>) => {
    try { return (await q).count ?? 0 } catch { return 0 }
  }
  const safeData = async <T,>(q: PromiseLike<{ data: T | null }>): Promise<T | null> => {
    try { return (await q).data } catch { return null }
  }

  // Fetch stats and full lead records in parallel — each query is independently
  // error-tolerant so a missing column or RPC does not take down the page.
  const [leadsToday, leadsThisWeek, totalLeads, sentToUsha, leadsRaw, dailyLeadsRaw] = await Promise.all([
    safeCount(supabase.from("leads").select("*", { count: "exact", head: true })
      .gte("created_at", startOfToday.toISOString())),
    safeCount(supabase.from("leads").select("*", { count: "exact", head: true })
      .gte("created_at", startOfWeek.toISOString())),
    safeCount(supabase.from("leads").select("*", { count: "exact", head: true })),
    safeCount(supabase.from("leads").select("*", { count: "exact", head: true })
      .eq("usha_status", "sent")),
    safeData<Lead[]>(supabase.from("leads")
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
      .limit(200)),
    safeData<{ day: string; count: number }[]>(supabase.rpc("get_daily_lead_counts")),
  ])

  const stats = { leadsToday, leadsThisWeek, totalLeads, sentToUsha }
  const leads: Lead[] = (leadsRaw ?? []) as Lead[]

  // Build 7-day chart — fall back to zero-filled bars if the RPC is missing
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  let dailyData: { day: string; leads: number }[] = []

  if (dailyLeadsRaw && Array.isArray(dailyLeadsRaw)) {
    dailyData = dailyLeadsRaw.map(row => ({
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
