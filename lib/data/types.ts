import type { Lead } from "@/lib/types/lead"

export interface LeadCreateInput {
  referenceNumber: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  age: number | null
  state: string | null
  incomeRange: string | null
  householdSize: string | null
  qualifyingEvent: string | null
  priorities: string | null
  tcpaConsent: boolean
  tcpaConsentAt: string
  trustedFormCertUrl: string | null
  funnelType: string
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  ipAddress: string
  quizAnswers: Record<string, unknown> | null
}

export interface LeadFilters {
  search?: string
  funnel?: string
  marketplaceStatus?: string
  minScore?: number
}

export interface LeadListResult {
  items: Lead[]
  total: number
}

export interface PipelineStats {
  totalLeads: number
  leadsToday: number
  leadsMonth: number
  sentCount: number
  sentRevenue: number
  sentRevenueMonth: number
  tcpaVerified: number
}

export interface FunnelRow {
  funnel_type: string
  leads: number
  sent: number
  revenue: number
}

export interface DailyRow {
  day: string
  count: number
}

export interface PlatformStore {
  isConfigured(): boolean
  healthCheck(): Promise<void>
  findRecentDuplicate(email: string, since: string): Promise<string | null>
  createLead(input: LeadCreateInput): Promise<{ id: string; createdAt: string } | null>
  updateAiScore(
    id: string,
    update: { score: number; reasons: string[]; predictedCloseRate: number; scoredAt: string },
  ): Promise<void>
  updateMarketplaceStatus(
    id: string,
    status: "pending" | "sent" | "failed",
    sentAt?: string,
    marketplaceLeadId?: string | null,
  ): Promise<void>
  listLeads(filters: LeadFilters, page: number, pageSize: number): Promise<LeadListResult>
  listAllLeads(filters: LeadFilters): Promise<Lead[]>
  getPipelineStats(): Promise<PipelineStats>
  getDailyLeadCounts(): Promise<DailyRow[]>
  getFunnelBreakdown(): Promise<FunnelRow[]>
  getRecentLeadTimes(since: string): Promise<string[]>
  getSetting(key: string): Promise<unknown>
  setSetting(key: string, value: unknown): Promise<void>
  recordSuppression(email: string, source: string): Promise<void>
}
