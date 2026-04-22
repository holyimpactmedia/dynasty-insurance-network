// USHA Marketplace / LeadArena lead submission integration.
//
// API docs are not publicly available — request credentials from:
//   support@leadarena.com  |  https://knowledge.ushamarketplace.com/supportcenter
//
// Required Supabase columns to track submission status:
//   ALTER TABLE leads ADD COLUMN usha_status text;
//   ALTER TABLE leads ADD COLUMN usha_sent_at timestamptz;
//   ALTER TABLE leads ADD COLUMN usha_lead_id text;
//
// Required env vars (set in Vercel dashboard):
//   USHA_API_URL    — e.g. https://app.ushamarketplace.com/api/v1/leads
//   USHA_API_KEY    — API key or Bearer token provided by USHA/LeadArena

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
  leadType: string  // e.g. 'aca', 'cobra', 'family'
}

export interface UshaPostResult {
  success: boolean
  /** USHA's assigned lead ID, if returned */
  ushaLeadId?: string
  status: 'sent' | 'failed' | 'disabled'
  error?: string
}

/**
 * Posts a lead to the USHA Marketplace API.
 * Returns 'disabled' if env vars are not yet configured — safe to call unconditionally.
 * When API credentials are available, fill in the fetch call below with the correct
 * endpoint, auth header format, and request body shape from the USHA API spec.
 */
export async function postLeadToUsha(
  leadId: string,
  payload: UshaLeadPayload,
): Promise<UshaPostResult> {
  const apiUrl = process.env.USHA_API_URL
  const apiKey = process.env.USHA_API_KEY

  // Gracefully skip if not yet configured
  if (!apiUrl || !apiKey) {
    console.log('[usha] USHA_API_URL or USHA_API_KEY not configured — skipping lead post')
    return { success: false, status: 'disabled' }
  }

  try {
    // TODO: Replace the body shape below with the exact field names from the USHA API spec.
    // Common patterns for lead marketplace APIs:
    //   - REST POST with JSON body + Authorization: Bearer <key> header
    //   - REST POST with JSON body + X-API-Key: <key> header
    //   - Form-encoded POST with api_key field
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // TODO: Confirm header name with USHA (Bearer token vs API key header)
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        // TODO: Map to USHA's exact field names once API spec is available
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

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText)
      console.error(`[usha] Lead post failed: HTTP ${response.status} — ${errorText}`)

      // Update Supabase with failed status
      await updateUshaStatus(leadId, 'failed', null)

      return { success: false, status: 'failed', error: `HTTP ${response.status}: ${errorText}` }
    }

    // TODO: Parse the response to extract USHA's lead ID field name
    const responseData = await response.json().catch(() => ({})) as Record<string, unknown>
    const ushaLeadId = (responseData.lead_id ?? responseData.id ?? responseData.leadId) as string | undefined

    // Update Supabase with success status
    await updateUshaStatus(leadId, 'sent', ushaLeadId ?? null)

    console.log(`[usha] Lead ${payload.referenceNumber} posted successfully. USHA ID: ${ushaLeadId ?? 'unknown'}`)
    return { success: true, status: 'sent', ushaLeadId }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[usha] Unexpected error posting lead:', message)

    await updateUshaStatus(leadId, 'failed', null)

    return { success: false, status: 'failed', error: message }
  }
}

/** Updates the lead record in Supabase with the USHA submission result. */
async function updateUshaStatus(
  leadId: string,
  status: 'sent' | 'failed',
  ushaLeadId: string | null,
): Promise<void> {
  try {
    const supabase = createClient()
    await supabase
      .from('leads')
      .update({
        usha_status: status,
        usha_sent_at: new Date().toISOString(),
        ...(ushaLeadId && { usha_lead_id: ushaLeadId }),
      })
      .eq('id', leadId)
  } catch (err) {
    // Non-fatal: columns may not exist yet
    console.warn('[usha] Could not update usha_status on lead record:', err)
  }
}
