import {
  and,
  count,
  desc,
  eq,
  gte,
  ilike,
  isNull,
  or,
  sql,
  type SQL,
} from "drizzle-orm"
import { requireNeonDb, getNeonDb } from "@/lib/db/client"
import { appSettings, emailSuppressions, leads } from "@/lib/db/schema"
import { neonRowToLead } from "./lead-mapper"
import type { LeadFilters, PlatformStore } from "./types"

function whereFor(filters: LeadFilters): SQL | undefined {
  const conditions: SQL[] = []
  const search = (filters.search || "").replace(/[(),"%]/g, " ").trim().slice(0, 120)
  if (search) {
    const value = `%${search}%`
    conditions.push(or(
      ilike(leads.firstName, value),
      ilike(leads.lastName, value),
      ilike(leads.email, value),
      ilike(leads.phone, value),
      ilike(leads.referenceNumber, value),
    )!)
  }
  if (filters.funnel && filters.funnel !== "all") conditions.push(eq(leads.funnelType, filters.funnel))
  if (filters.marketplaceStatus === "none") conditions.push(isNull(leads.ushaStatus))
  else if (filters.marketplaceStatus && filters.marketplaceStatus !== "all") {
    conditions.push(eq(leads.ushaStatus, filters.marketplaceStatus as "pending" | "sent" | "failed"))
  }
  if ((filters.minScore || 0) > 0) conditions.push(gte(leads.aiScore, filters.minScore!))
  return conditions.length ? and(...conditions) : undefined
}

export const neonStore: PlatformStore = {
  isConfigured: () => Boolean(getNeonDb()),

  async healthCheck() {
    await requireNeonDb().execute(sql`select 1 from ${leads} limit 1`)
  },

  async findRecentDuplicate(email, since) {
    const [row] = await requireNeonDb()
      .select({ referenceNumber: leads.referenceNumber })
      .from(leads)
      .where(and(eq(leads.email, email), gte(leads.createdAt, since)))
      .limit(1)
    return row?.referenceNumber ?? null
  },

  async createLead(input) {
    const [row] = await requireNeonDb().insert(leads).values({
      referenceNumber: input.referenceNumber,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      age: input.age,
      state: input.state,
      incomeRange: input.incomeRange,
      householdSize: input.householdSize,
      qualifyingEvent: input.qualifyingEvent,
      priorities: input.priorities,
      tcpaConsent: input.tcpaConsent,
      tcpaConsentAt: input.tcpaConsentAt,
      trustedFormCertUrl: input.trustedFormCertUrl,
      funnelType: input.funnelType,
      utmSource: input.utmSource,
      utmMedium: input.utmMedium,
      utmCampaign: input.utmCampaign,
      ipAddress: input.ipAddress,
      quizAnswers: input.quizAnswers,
      status: "new",
    }).returning({ id: leads.id, createdAt: leads.createdAt })
    return row ?? null
  },

  async updateAiScore(id, update) {
    await requireNeonDb().update(leads).set({
      aiScore: update.score,
      aiScoreReasons: update.reasons,
      predictedCloseRate: update.predictedCloseRate,
      aiScoredAt: update.scoredAt,
    }).where(eq(leads.id, id))
  },

  async updateMarketplaceStatus(id, status, sentAt, marketplaceLeadId) {
    await requireNeonDb().update(leads).set({
      ushaStatus: status,
      ...(sentAt ? { ushaSentAt: sentAt } : {}),
      ...(marketplaceLeadId ? { ushaLeadId: marketplaceLeadId } : {}),
    }).where(eq(leads.id, id))
  },

  async listLeads(filters, page, pageSize) {
    const where = whereFor(filters)
    const db = requireNeonDb()
    const [rows, totals] = await Promise.all([
      db.select().from(leads).where(where)
        .orderBy(desc(leads.createdAt), desc(leads.id))
        .limit(pageSize).offset(page * pageSize),
      db.select({ value: count() }).from(leads).where(where),
    ])
    return { items: rows.map(neonRowToLead), total: Number(totals[0]?.value ?? 0) }
  },

  async listAllLeads(filters) {
    const rows = await requireNeonDb().select().from(leads).where(whereFor(filters))
      .orderBy(desc(leads.createdAt), desc(leads.id))
    return rows.map(neonRowToLead)
  },

  async getPipelineStats() {
    const result = await requireNeonDb().execute(sql`
      select
        count(*)::bigint as total_leads,
        count(*) filter (where created_at >= (date_trunc('day', now() at time zone 'America/New_York') at time zone 'America/New_York'))::bigint as leads_today,
        count(*) filter (where created_at >= (date_trunc('month', now() at time zone 'America/New_York') at time zone 'America/New_York'))::bigint as leads_month,
        count(*) filter (where usha_status = 'sent')::bigint as sent_count,
        coalesce(sum(sell_price) filter (where usha_status = 'sent'), 0) as sent_revenue,
        coalesce(sum(sell_price) filter (
          where usha_status = 'sent'
            and created_at >= (date_trunc('month', now() at time zone 'America/New_York') at time zone 'America/New_York')
        ), 0) as sent_revenue_month,
        count(*) filter (where tcpa_consent = true)::bigint as tcpa_verified
      from leads
    `)
    const row = result.rows[0] as Record<string, unknown> | undefined
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
    const result = await requireNeonDb().execute(sql`
      select (created_at at time zone 'America/New_York')::date::text as day, count(*)::bigint as count
      from leads
      where (created_at at time zone 'America/New_York')::date >= (now() at time zone 'America/New_York')::date - 6
      group by 1 order by 1
    `)
    return result.rows.map((row) => ({ day: String(row.day), count: Number(row.count) }))
  },

  async getFunnelBreakdown() {
    const result = await requireNeonDb().execute(sql`
      select coalesce(funnel_type, 'private_health') as funnel_type,
        count(*)::bigint as leads,
        count(*) filter (where usha_status = 'sent')::bigint as sent,
        coalesce(sum(sell_price) filter (where usha_status = 'sent'), 0) as revenue
      from leads group by 1 order by 2 desc
    `)
    return result.rows.map((row) => ({
      funnel_type: String(row.funnel_type),
      leads: Number(row.leads),
      sent: Number(row.sent),
      revenue: Number(row.revenue),
    }))
  },

  async getRecentLeadTimes(since) {
    const rows = await requireNeonDb().select({ createdAt: leads.createdAt }).from(leads)
      .where(gte(leads.createdAt, since)).orderBy(leads.createdAt)
    return rows.map((row) => row.createdAt)
  },

  async getSetting(key) {
    const [row] = await requireNeonDb().select({ value: appSettings.value }).from(appSettings)
      .where(eq(appSettings.key, key)).limit(1)
    return row?.value
  },

  async setSetting(key, value) {
    await requireNeonDb().insert(appSettings).values({ key, value })
      .onConflictDoUpdate({ target: appSettings.key, set: { value } })
  },

  async recordSuppression(email, source) {
    await requireNeonDb().insert(emailSuppressions).values({ email, source })
      .onConflictDoUpdate({
        target: emailSuppressions.email,
        set: { source, suppressedAt: new Date().toISOString() },
      })
  },
}
