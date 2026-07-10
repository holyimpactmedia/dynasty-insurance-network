import { createClient } from "@/lib/supabase/admin"
import type { Lead } from "@/lib/types/lead"
import type {
  DailyRow,
  FunnelRow,
  LeadCreateInput,
  LeadFilters,
  LeadListResult,
  PipelineStats,
  PlatformStore,
} from "./types"

const LEAD_COLUMNS = `
  id, reference_number, first_name, last_name, email, phone, age,
  state, income_range, household_size, qualifying_event, priorities,
  tcpa_consent, tcpa_consent_at, trusted_form_cert_url,
  funnel_type, utm_source, utm_medium, utm_campaign, ip_address,
  quiz_answers, status, ai_score, ai_score_reasons, predicted_close_rate,
  ai_scored_at, sell_price, usha_status, usha_sent_at, usha_lead_id, created_at
`

function sanitizeSearch(value: string): string {
  return value.replace(/[(),"%]/g, " ").trim().slice(0, 120)
}

function applyFilters(query: any, filters: LeadFilters) {
  const search = sanitizeSearch(filters.search || "")
  if (search) {
    query = query.or(
      ["first_name", "last_name", "email", "phone", "reference_number"]
        .map((field) => `${field}.ilike.%${search}%`)
        .join(","),
    )
  }
  if (filters.funnel && filters.funnel !== "all") query = query.eq("funnel_type", filters.funnel)
  if (filters.marketplaceStatus === "none") query = query.is("usha_status", null)
  else if (filters.marketplaceStatus && filters.marketplaceStatus !== "all") {
    query = query.eq("usha_status", filters.marketplaceStatus)
  }
  if ((filters.minScore || 0) > 0) query = query.gte("ai_score", filters.minScore)
  return query
}

function client() {
  const value = createClient()
  if (!value) throw new Error("Supabase service client is not configured")
  return value
}

export const supabaseStore: PlatformStore = {
  isConfigured: () => Boolean(createClient()),

  async healthCheck() {
    const { error } = await client().from("leads").select("id").limit(1)
    if (error) throw error
  },

  async findRecentDuplicate(email, since) {
    const { data, error } = await client()
      .from("leads")
      .select("reference_number")
      .eq("email", email)
      .gte("created_at", since)
      .limit(1)
      .maybeSingle()
    if (error) throw error
    return data?.reference_number ?? null
  },

  async createLead(input) {
    const { data, error } = await client()
      .from("leads")
      .insert({
        reference_number: input.referenceNumber,
        first_name: input.firstName,
        last_name: input.lastName,
        email: input.email,
        phone: input.phone,
        age: input.age,
        state: input.state,
        income_range: input.incomeRange,
        household_size: input.householdSize,
        qualifying_event: input.qualifyingEvent,
        priorities: input.priorities,
        tcpa_consent: input.tcpaConsent,
        tcpa_consent_at: input.tcpaConsentAt,
        trusted_form_cert_url: input.trustedFormCertUrl,
        funnel_type: input.funnelType,
        utm_source: input.utmSource,
        utm_medium: input.utmMedium,
        utm_campaign: input.utmCampaign,
        ip_address: input.ipAddress,
        quiz_answers: input.quizAnswers,
        status: "new",
      })
      .select("id, created_at")
      .single()
    if (error) throw error
    return data ? { id: data.id, createdAt: data.created_at } : null
  },

  async updateAiScore(id, update) {
    const { error } = await client().from("leads").update({
      ai_score: update.score,
      ai_score_reasons: update.reasons,
      predicted_close_rate: update.predictedCloseRate,
      ai_scored_at: update.scoredAt,
    }).eq("id", id)
    if (error) throw error
  },

  async updateMarketplaceStatus(id, status, sentAt, marketplaceLeadId) {
    const values: Record<string, unknown> = { usha_status: status }
    if (sentAt) values.usha_sent_at = sentAt
    if (marketplaceLeadId) values.usha_lead_id = marketplaceLeadId
    const { error } = await client().from("leads").update(values).eq("id", id)
    if (error) throw error
  },

  async listLeads(filters, page, pageSize): Promise<LeadListResult> {
    const base = client().from("leads").select(LEAD_COLUMNS, { count: "exact" })
    const { data, count, error } = await applyFilters(base, filters)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(page * pageSize, page * pageSize + pageSize - 1)
    if (error) throw error
    return { items: (data as unknown as Lead[] | null) ?? [], total: count ?? 0 }
  },

  async listAllLeads(filters) {
    const pageSize = 1_000
    const rows: Lead[] = []
    for (let from = 0; ; from += pageSize) {
      const base = client().from("leads").select(LEAD_COLUMNS)
      const { data, error } = await applyFilters(base, filters)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(from, from + pageSize - 1)
      if (error) throw error
      const page = (data as unknown as Lead[] | null) ?? []
      rows.push(...page)
      if (page.length < pageSize) return rows
    }
  },

  async getPipelineStats(): Promise<PipelineStats> {
    const { data, error } = await client().rpc("get_pipeline_stats")
    if (error) throw error
    const row = data?.[0]
    return {
      totalLeads: Number(row?.total_leads ?? 0),
      leadsToday: Number(row?.leads_today ?? 0),
      leadsMonth: Number(row?.leads_month ?? 0),
      sentCount: Number(row?.sent_count ?? 0),
      sentRevenue: Number(row?.sent_revenue ?? 0),
      sentRevenueMonth: Number(row?.sent_revenue_month ?? 0),
      tcpaVerified: Number(row?.tcpa_verified ?? 0),
    }
  },

  async getDailyLeadCounts() {
    const { data, error } = await client().rpc("get_daily_lead_counts")
    if (error) throw error
    return ((data as DailyRow[] | null) ?? []).map((row) => ({ ...row, count: Number(row.count) }))
  },

  async getFunnelBreakdown() {
    const { data, error } = await client().rpc("get_funnel_breakdown")
    if (error) throw error
    return ((data as FunnelRow[] | null) ?? []).map((row) => ({
      ...row,
      leads: Number(row.leads),
      sent: Number(row.sent),
      revenue: Number(row.revenue),
    }))
  },

  async getRecentLeadTimes(since) {
    const { data, error } = await client().from("leads").select("created_at")
      .gte("created_at", since).order("created_at", { ascending: true })
    if (error) throw error
    return (data ?? []).map((row) => row.created_at)
  },

  async getSetting(key) {
    const { data, error } = await client().from("app_settings").select("value").eq("key", key).maybeSingle()
    if (error) throw error
    return data?.value
  },

  async setSetting(key, value) {
    const { error } = await client().from("app_settings").upsert({ key, value }, { onConflict: "key" })
    if (error) throw error
  },

  async recordSuppression(email, source) {
    const { error } = await client().from("email_suppressions").upsert(
      { email, source, suppressed_at: new Date().toISOString() },
      { onConflict: "email" },
    )
    if (error) throw error
  },
}
