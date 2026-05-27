// USHA Marketplace / LeadArena lead submission integration.
//
// API docs are not publicly available - request credentials from:
//   support@leadarena.com  |  https://knowledge.ushamarketplace.com/supportcenter
//
// Required Supabase columns to track submission status:
//   ALTER TABLE leads ADD COLUMN usha_status text;
//   ALTER TABLE leads ADD COLUMN usha_sent_at timestamptz;
//   ALTER TABLE leads ADD COLUMN usha_lead_id text;
//
// Required env vars (set in Vercel dashboard):
//   USHA_API_URL    - e.g. https://app.ushamarketplace.com/api/v1/leads
//   USHA_API_KEY    - API key or Bearer token provided by USHA/LeadArena

import { createClient } from '@/lib/supabase/admin'

// Fields USHA/LeadArena typically expect for health insurance leads.
// Update field names/types once you have the official API spec.
export interface UshaLeadPayload {
  firstName: string
  lastName: string
  email: string
  phone: string | null
  age: number | null
  state: string | null
  zipCode?: string | null
  incomeRange: string | null
  householdSize: string | null
  qualifyingEvent: string | null
  tcpaConsent: boolean
  tcpaConsentAt: string | null
  trustedFormCertUrl: string | null
  referenceNumber: string
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  ipAddress: string | null
  leadType: string  // e.g. 'private_health', 'cobra', 'family', 'ppo', 'self_employed', 'business'
}

export interface UshaPostResult {
  success: boolean
  /** USHA's assigned lead ID, if returned */
  ushaLeadId?: string
  status: 'sent' | 'failed' | 'disabled'
  error?: string
}

const MAX_ATTEMPTS = 3 // 1 initial attempt + 2 retries
const isRetryable = (httpStatus: number): boolean =>
  httpStatus === 429 || httpStatus >= 500

/**
 * Posts a lead to the USHA Marketplace API.
 *
 * Feature-flagged: requires `USHA_ENABLED=true` plus `USHA_API_URL` /
 * `USHA_API_KEY`. When disabled, the lead is marked `usha_status='pending'`
 * so the dashboard shows it awaiting marketplace submission (not a blank).
 *
 * Transient failures (network errors, HTTP 429/5xx) are retried with backoff.
 * The request body field mapping is the ONLY part still deferred until the
 * LeadArena/USHA API spec is available (see the TODOs below).
 */
export async function postLeadToUsha(
  leadId: string | null,
  payload: UshaLeadPayload,
): Promise<UshaPostResult> {
  const apiUrl = process.env.USHA_API_URL
  const apiKey = process.env.USHA_API_KEY
  const enabled =
    process.env.USHA_ENABLED === 'true' && !!apiUrl && !!apiKey

  if (!enabled) {
    console.log('[usha] disabled (USHA_ENABLED!=true or credentials missing) - marking lead pending')
    await updateUshaStatus(leadId, 'pending')
    return { success: false, status: 'disabled' }
  }

  let lastError = 'unknown error'

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      // TODO: Replace the body shape below with the exact field names from the
      // USHA API spec. TODO: Confirm the auth header format (Bearer vs X-API-Key).
      const response = await fetch(apiUrl as string, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          first_name: payload.firstName,
          last_name: payload.lastName,
          email: payload.email,
          phone: payload.phone,
          age: payload.age,
          state: payload.state,
          income_range: payload.incomeRange,
          household_size: payload.householdSize,
          qualifying_event: payload.qualifyingEvent,
          tcpa_consent: payload.tcpaConsent,
          tcpa_timestamp: payload.tcpaConsentAt,
          trusted_form_cert_url: payload.trustedFormCertUrl,
          source_reference: payload.referenceNumber,
          utm_source: payload.utmSource,
          utm_medium: payload.utmMedium,
          utm_campaign: payload.utmCampaign,
          ip_address: payload.ipAddress,
          lead_type: payload.leadType,
        }),
      })

      if (response.ok) {
        // TODO: Confirm USHA's lead-ID field name once the API spec is available.
        const responseData = (await response.json().catch(() => ({}))) as Record<string, unknown>
        const ushaLeadId = (responseData.lead_id ?? responseData.id ?? responseData.leadId) as
          | string
          | undefined
        await updateUshaStatus(leadId, 'sent', ushaLeadId ?? null)
        console.log(`[usha] Lead ${payload.referenceNumber} posted. USHA ID: ${ushaLeadId ?? 'unknown'}`)
        return { success: true, status: 'sent', ushaLeadId }
      }

      const errorText = await response.text().catch(() => response.statusText)
      lastError = `HTTP ${response.status}: ${errorText}`
      if (!isRetryable(response.status) || attempt === MAX_ATTEMPTS) {
        console.error(`[usha] Lead post failed (attempt ${attempt}/${MAX_ATTEMPTS}): ${lastError}`)
        await updateUshaStatus(leadId, 'failed')
        return { success: false, status: 'failed', error: lastError }
      }
      console.warn(`[usha] attempt ${attempt} failed (${lastError}); retrying`)
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error'
      if (attempt === MAX_ATTEMPTS) {
        console.error(`[usha] Lead post errored after ${MAX_ATTEMPTS} attempts: ${lastError}`)
        await updateUshaStatus(leadId, 'failed')
        return { success: false, status: 'failed', error: lastError }
      }
      console.warn(`[usha] attempt ${attempt} threw (${lastError}); retrying`)
    }

    // Exponential-ish backoff before the next attempt.
    await new Promise((resolve) => setTimeout(resolve, 500 * attempt))
  }

  await updateUshaStatus(leadId, 'failed')
  return { success: false, status: 'failed', error: lastError }
}

/** Updates the lead record in Supabase with the USHA submission status. */
async function updateUshaStatus(
  leadId: string | null,
  status: 'pending' | 'sent' | 'failed',
  ushaLeadId: string | null = null,
): Promise<void> {
  if (!leadId) return
  try {
    const supabase = createClient()
    if (!supabase) return
    const update: Record<string, unknown> = { usha_status: status }
    // Only a real submission attempt stamps a time; 'pending' has not been sent.
    if (status !== 'pending') update.usha_sent_at = new Date().toISOString()
    if (ushaLeadId) update.usha_lead_id = ushaLeadId
    await supabase.from('leads').update(update).eq('id', leadId)
  } catch (err) {
    console.warn('[usha] Could not update usha_status on lead record:', err)
  }
}
