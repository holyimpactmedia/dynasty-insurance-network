import { createClient } from "@/lib/supabase/server"
import AdminDashboardClient from "@/components/dashboard/AdminDashboardClient"

export default async function AdminDashboard() {
  const supabase = await createClient()
  
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(startOfToday)
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())

  // Fetch all stats in parallel
  const [
    { count: leadsToday },
    { count: leadsThisWeek },
    { count: totalLeads },
    { count: activeAgents },
    { count: salesToday },
    { data: soldLeadsToday },
    { data: recentLeads },
    { count: newCount },
    { count: contactedCount },
    { count: appointmentCount },
    { count: soldCount },
    { data: dailyLeadsRaw },
  ] = await Promise.all([
    // Leads today
    supabase.from('leads').select('*', { count: 'exact', head: true })
      .gte('created_at', startOfToday.toISOString()),
    // Leads this week
    supabase.from('leads').select('*', { count: 'exact', head: true })
      .gte('created_at', startOfWeek.toISOString()),
    // Total leads
    supabase.from('leads').select('*', { count: 'exact', head: true }),
    // Active agents
    supabase.from('agents').select('*', { count: 'exact', head: true })
      .eq('is_active', true),
    // Sales today
    supabase.from('leads').select('*', { count: 'exact', head: true })
      .eq('status', 'sold')
      .gte('created_at', startOfToday.toISOString()),
    // Sold leads today (for revenue)
    supabase.from('leads').select('sell_price')
      .eq('status', 'sold')
      .gte('created_at', startOfToday.toISOString()),
    // Recent 10 leads
    supabase.from('leads')
      .select('id, reference_number, first_name, last_name, email, state, funnel_type, status, ai_score, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
    // Pipeline counts
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'new'),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'contacted'),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'appointment_set'),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'sold'),
    // Daily leads for last 7 days
    supabase.rpc('get_daily_lead_counts'),
  ])

  const revenueToday = soldLeadsToday?.reduce((sum, lead) => sum + (Number(lead.sell_price) || 0), 0) || 0

  const stats = {
    leadsToday: leadsToday || 0,
    leadsThisWeek: leadsThisWeek || 0,
    totalLeads: totalLeads || 0,
    activeAgents: activeAgents || 0,
    salesToday: salesToday || 0,
    revenueToday,
  }

  const pipeline = {
    new: newCount || 0,
    contacted: contactedCount || 0,
    appointment_set: appointmentCount || 0,
    sold: soldCount || 0,
  }

  // Format daily data for chart - fallback to mock if RPC doesn't exist
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  let dailyData: { day: string; leads: number }[] = []
  
  if (dailyLeadsRaw && Array.isArray(dailyLeadsRaw)) {
    dailyData = dailyLeadsRaw.map((row: { day: string; count: number }) => ({
      day: dayNames[new Date(row.day).getDay()],
      leads: row.count,
    }))
  } else {
    // Fallback: generate last 7 days with real counts
    const last7Days: { day: string; leads: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      last7Days.push({
        day: dayNames[date.getDay()],
        leads: 0, // Will be 0 initially if no RPC
      })
    }
    dailyData = last7Days
  }

  return (
    <AdminDashboardClient
      initialStats={stats}
      initialPipeline={pipeline}
      initialRecentLeads={recentLeads || []}
      initialDailyData={dailyData}
    />
  )
}
