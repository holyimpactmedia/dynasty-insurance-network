import type { Lead } from "@/lib/types/lead"
import type { LeadRow } from "@/lib/db/schema"

export function neonRowToLead(row: LeadRow): Lead {
  return {
    id: row.id,
    reference_number: row.referenceNumber,
    first_name: row.firstName,
    last_name: row.lastName,
    email: row.email,
    phone: row.phone,
    age: row.age,
    state: row.state,
    income_range: row.incomeRange,
    household_size: row.householdSize,
    qualifying_event: row.qualifyingEvent,
    priorities: row.priorities,
    tcpa_consent: row.tcpaConsent,
    tcpa_consent_at: row.tcpaConsentAt,
    trusted_form_cert_url: row.trustedFormCertUrl,
    funnel_type: row.funnelType,
    utm_source: row.utmSource,
    utm_medium: row.utmMedium,
    utm_campaign: row.utmCampaign,
    ip_address: row.ipAddress,
    quiz_answers: row.quizAnswers,
    status: row.status,
    ai_score: row.aiScore,
    ai_score_reasons: row.aiScoreReasons,
    predicted_close_rate: row.predictedCloseRate,
    ai_scored_at: row.aiScoredAt,
    sell_price: row.sellPrice,
    usha_status: row.ushaStatus,
    usha_sent_at: row.ushaSentAt,
    usha_lead_id: row.ushaLeadId,
    created_at: row.createdAt,
  }
}
