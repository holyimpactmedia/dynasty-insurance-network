import { NextRequest, NextResponse, after } from 'next/server'
import { getPlatformStore } from '@/lib/data/store'
import { getLeadIntakePaused } from '@/lib/settings'
import { sendLeadConfirmation } from '@/lib/email/sendLeadConfirmation'
import { scoreAndUpdateLead } from '@/lib/ai/scoreLeadWithAI'
import { postLeadToUsha } from '@/lib/usha/postLead'
import { notifyAdmin } from '@/lib/email/notifyAdmin'
import { checkRateLimit } from '@/lib/rate-limit'
import { sendMetaLeadEvent } from '@/lib/meta/capi'

// Generate a unique reference number for leads
function generateReferenceNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `HL-${timestamp}-${random}`
}

// A repeat submission of the same email inside this window is treated as a
// duplicate: we return success without re-inserting or re-spending money on
// AI scoring / USHA / email.
const DEDUP_WINDOW_MS = 10 * 60 * 1000

export async function POST(request: NextRequest) {
  try {
    if (await getLeadIntakePaused()) {
      return NextResponse.json(
        { error: 'Lead intake is temporarily unavailable. Please try again shortly.' },
        { status: 503, headers: { 'Retry-After': '900' } },
      )
    }

    const body = await request.json()

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
      quizAnswers,
      meta,
    } = body

    // Required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, email' },
        { status: 400 },
      )
    }

    // TCPA consent is mandatory
    if (!tcpaConsent) {
      return NextResponse.json(
        { error: 'TCPA consent is required' },
        { status: 400 },
      )
    }

    // Client IP (best-effort, used for rate limiting + lead attribution)
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown'
    const userAgent = request.headers.get('user-agent')

    // Rate limit: /api/leads is public and spends money per call (Anthropic,
    // Resend, USHA). Best-effort in-memory limiter; the dedup check below is
    // the reliable backstop.
    const rl = checkRateLimit(`leads:${ipAddress}`)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 },
      )
    }

    const normalizedEmail = String(email).toLowerCase().trim()
    const store = await getPlatformStore()
    const referenceNumber = generateReferenceNumber()
    const tcpaConsentAt = new Date().toISOString()
    const resolvedFunnelType = funnelType || 'private_health'

    // Lead record id/created_at, populated by a successful insert.
    let data: { id: string | null; created_at: string } = {
      id: null,
      created_at: new Date().toISOString(),
    }

    if (!store.isConfigured()) {
      console.warn('Platform database not configured. Lead sent via email only.', { referenceNumber })
    } else {
      // Duplicate check: same email submitted recently => idempotent success.
      const since = new Date(Date.now() - DEDUP_WINDOW_MS).toISOString()
      const duplicateReference = await store.findRecentDuplicate(normalizedEmail, since)

      if (duplicateReference) {
        console.log('Duplicate lead submission ignored:', { email: normalizedEmail })
        return NextResponse.json({
          success: true,
          referenceNumber: duplicateReference,
          message: 'Lead already received',
        })
      }

      try {
        const insertResult = await store.createLead({
          referenceNumber,
          firstName,
          lastName,
          email: normalizedEmail,
          phone: phone || null,
          age: age ? parseInt(age, 10) : null,
          state: state || null,
          incomeRange: incomeRange || null,
          householdSize: householdSize || null,
          qualifyingEvent: qualifyingEvent || null,
          priorities: priorities || null,
          tcpaConsent,
          tcpaConsentAt,
          trustedFormCertUrl: trustedFormCertUrl || null,
          funnelType: resolvedFunnelType,
          utmSource: utmSource || null,
          utmMedium: utmMedium || null,
          utmCampaign: utmCampaign || null,
          ipAddress,
          quizAnswers: quizAnswers ?? null,
        })
        if (insertResult) {
          data = { id: insertResult.id, created_at: insertResult.createdAt }
        }
      } catch (error) {
        // Loud, not silent: the lead form must not break, but a failed insert
        // is an operational problem, not a routine fallback.
        console.error('LEAD INSERT FAILED (continuing with notifications):', error, { referenceNumber })
      }
    }

    // ── Post-response pipeline ──────────────────────────────────────────────
    // after() runs once the response is sent but keeps the function alive for
    // the work, so on Vercel these integrations actually complete (a bare
    // fire-and-forget promise can be frozen/killed after the response).
    after(async () => {
      // 1. Claim the TrustedForm certificate (TCPA compliance evidence).
      if (trustedFormCertUrl) {
        try {
          await fetch(`${request.nextUrl.origin}/api/trustedform/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              certUrl: trustedFormCertUrl,
              reference: referenceNumber,
              email: normalizedEmail,
              phone,
            }),
          })
        } catch (err) {
          console.error('TrustedForm claim error:', err)
        }
      }

      // 2. Confirmation email to the consumer.
      try {
        await sendLeadConfirmation({ referenceNumber, firstName, email: normalizedEmail, phone })
      } catch (err) {
        console.error('Lead confirmation email error:', err)
      }

      // 3. Post the lead to the USHA Marketplace, then notify the admin with
      //    the result (the admin email surfaces a 'failed' marketplace post).
      let ushaResult
      try {
        ushaResult = await postLeadToUsha(data.id, {
          firstName,
          lastName,
          email: normalizedEmail,
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
        })
      } catch (err) {
        console.error('USHA post error:', err)
      }

      try {
        await notifyAdmin({
          referenceNumber,
          firstName,
          lastName,
          email: normalizedEmail,
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
        })
      } catch (err) {
        console.error('Admin notification email error:', err)
      }

      // 4. Score the lead with AI (updates the lead in the active database).
      try {
        await scoreAndUpdateLead({
          id: data.id,
          referenceNumber,
          firstName,
          lastName,
          email: normalizedEmail,
          phone,
          age,
          state,
          householdSize,
          incomeRange,
          qualifyingEvent,
          priorities,
          created_at: data.created_at,
        })
      } catch (err) {
        console.error('AI scoring error:', err)
      }

      // 5. Meta Conversions API "Lead" event. Deduplicated against the client
      //    Pixel via the shared event_id. No-ops until CAPI is configured, and
      //    a failure here never affects lead capture.
      try {
        await sendMetaLeadEvent({
          eventId: meta?.eventId || `srv-${referenceNumber}`,
          eventSourceUrl: meta?.eventSourceUrl || request.headers.get('referer'),
          firstName,
          lastName,
          email: normalizedEmail,
          phone,
          zip: quizAnswers?.zip ?? null,
          fbp: meta?.fbp ?? null,
          fbc: meta?.fbc ?? null,
          clientIp: ipAddress,
          userAgent,
        })
      } catch (err) {
        console.error('Meta CAPI error:', err)
      }
    })

    return NextResponse.json({
      success: true,
      referenceNumber,
      message: 'Lead submitted successfully',
    })
  } catch (error) {
    console.error('Error processing lead submission:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
