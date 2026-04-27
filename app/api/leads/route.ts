import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { sendLeadConfirmation } from '@/lib/email/sendLeadConfirmation'
import { notifyAgentsOfNewLead } from '@/lib/sms/notifyAgents'
import { scoreAndUpdateLead } from '@/lib/ai/scoreLeadWithAI'
import { postLeadToUsha } from '@/lib/usha/postLead'
import { notifyAdmin } from '@/lib/email/notifyAdmin'

// Generate a unique reference number for leads
function generateReferenceNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `HL-${timestamp}-${random}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Extract lead data from the request
    const {
      firstName,
      lastName,
      email,
      phone,
      age,
      state,
      incomeRange,
      householdSize,
      qualifyingEvent,
      priorities,
      tcpaConsent,
      trustedFormCertUrl,
      utmSource,
      utmMedium,
      utmCampaign,
      funnelType,
    } = body

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, email' },
        { status: 400 }
      )
    }

    // Validate TCPA consent
    if (!tcpaConsent) {
      return NextResponse.json(
        { error: 'TCPA consent is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    const referenceNumber = generateReferenceNumber()

    // Get client IP address
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown'

    const tcpaConsentAt = new Date().toISOString()
    const resolvedFunnelType = funnelType || 'healthcare_aca'

    // Try to insert the lead. If Supabase is unavailable or the insert fails,
    // we still proceed with downstream notifications and return success to the
    // user so the form does not appear broken. The lead is preserved in the
    // admin notification email.
    let data: { id: string | null; created_at: string } = {
      id: null,
      created_at: new Date().toISOString(),
    }

    if (!supabase) {
      console.warn('Supabase admin client not configured. Lead will be sent via email only.', { referenceNumber })
    } else {
      const { data: insertResult, error } = await supabase
        .from('leads')
        .insert({
          reference_number: referenceNumber,
          first_name: firstName,
          last_name: lastName,
          email: email.toLowerCase().trim(),
          phone: phone || null,
          age: age ? parseInt(age, 10) : null,
          state: state || null,
          income_range: incomeRange || null,
          household_size: householdSize || null,
          qualifying_event: qualifyingEvent || null,
          priorities: priorities || null,
          tcpa_consent: tcpaConsent,
          tcpa_consent_at: tcpaConsentAt,
          trusted_form_cert_url: trustedFormCertUrl || null,
          funnel_type: resolvedFunnelType,
          utm_source: utmSource || null,
          utm_medium: utmMedium || null,
          utm_campaign: utmCampaign || null,
          ip_address: ipAddress,
          status: 'new',
        })
        .select()
        .single()

      if (error) {
        console.error('Error inserting lead (continuing with notifications):', error, { referenceNumber })
      } else if (insertResult) {
        data = insertResult
      }
    }

    // ── Fire-and-forget async integrations (do not block the response) ──────

    // 1. Claim TrustedForm certificate (TCPA compliance)
    if (trustedFormCertUrl) {
      fetch(`${request.nextUrl.origin}/api/trustedform/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certificateUrl: trustedFormCertUrl,
          leadId: data.id,
          email,
          phone,
        }),
      }).catch(err => console.error('TrustedForm claim error:', err))
    }

    // 2. Send confirmation email to the consumer
    sendLeadConfirmation({
      id: data.id,
      referenceNumber,
      firstName,
      lastName,
      email,
      phone,
      state,
      trustedFormCertUrl,
    }).catch(err => console.error('Lead confirmation email error:', err))

    // 3. Post lead to USHA Marketplace for agents to purchase
    //    Also sends admin notification email with USHA result + full lead data
    const ushaPayload = {
      firstName,
      lastName,
      email,
      phone: phone || null,
      age: age ? parseInt(age, 10) : null,
      state: state || null,
      incomeRange: incomeRange || null,
      householdSize: householdSize || null,
      qualifyingEvent: qualifyingEvent || null,
      tcpaConsent,
      tcpaConsentAt,
      trustedFormCertUrl: trustedFormCertUrl || null,
      referenceNumber,
      utmSource: utmSource || null,
      utmMedium: utmMedium || null,
      utmCampaign: utmCampaign || null,
      ipAddress,
      leadType: resolvedFunnelType,
    }

    postLeadToUsha(data.id, ushaPayload)
      .then(ushaResult => {
        // Send admin notification email after USHA post so we can include its status
        notifyAdmin({
          referenceNumber,
          firstName,
          lastName,
          email,
          phone: phone || null,
          age: age ? parseInt(age, 10) : null,
          state: state || null,
          funnelType: resolvedFunnelType,
          incomeRange: incomeRange || null,
          householdSize: householdSize || null,
          qualifyingEvent: qualifyingEvent || null,
          priorities: priorities || null,
          utmSource: utmSource || null,
          utmMedium: utmMedium || null,
          utmCampaign: utmCampaign || null,
          ipAddress,
          tcpaConsentAt,
          trustedFormCertUrl: trustedFormCertUrl || null,
          ushaResult,
        }).catch(err => console.error('Admin notification email error:', err))
      })
      .catch(err => console.error('USHA post error:', err))

    // 4. Score lead with AI (async: updates the lead record in Supabase)
    scoreAndUpdateLead({
      id: data.id,
      referenceNumber,
      firstName,
      lastName,
      email,
      phone,
      age,
      state,
      householdSize,
      incomeRange,
      qualifyingEvent,
      priorities,
      created_at: data.created_at,
    }).catch(err => console.error('AI scoring error:', err))

    // notifyAgentsOfNewLead kept for legacy compatibility: not called in new flow.
    // Leads route to USHA Marketplace instead.
    void notifyAgentsOfNewLead

    return NextResponse.json({
      success: true,
      referenceNumber: referenceNumber,
      message: 'Lead submitted successfully',
    })
  } catch (error) {
    console.error('Error processing lead submission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
