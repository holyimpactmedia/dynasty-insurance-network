import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { sendLeadConfirmation } from '@/lib/email/sendLeadConfirmation'
import { notifyAgentsOfNewLead } from '@/lib/sms/notifyAgents'
import { scoreAndUpdateLead } from '@/lib/ai/scoreLeadWithAI'

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

    // Insert the lead into the database
    const { data, error } = await supabase
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
        tcpa_consent_at: new Date().toISOString(),
        trusted_form_cert_url: trustedFormCertUrl || null,
        funnel_type: 'healthcare_aca',
        utm_source: utmSource || null,
        utm_medium: utmMedium || null,
        utm_campaign: utmCampaign || null,
        ip_address: ipAddress,
        status: 'new',
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting lead:', error)
      return NextResponse.json(
        { error: 'Failed to save lead' },
        { status: 500 }
      )
    }

    // Fire-and-forget async integrations (don't block the response)
    const leadData = {
      id: data.id,
      referenceNumber,
      firstName,
      lastName,
      email,
      phone,
      state,
      trustedFormCertUrl,
    }

    // 1. Claim TrustedForm certificate (if provided)
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

    // 2. Send confirmation email to the lead
    sendLeadConfirmation(leadData).catch(err => 
      console.error('Email confirmation error:', err)
    )

    // 3. Notify agents via SMS
    notifyAgentsOfNewLead(leadData).catch(err => 
      console.error('SMS notification error:', err)
    )

    // 4. Score lead with AI (async, will update the lead record and send hot alerts)
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
    }).catch(err => 
      console.error('AI scoring error:', err)
    )

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
