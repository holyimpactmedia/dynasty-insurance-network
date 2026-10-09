import { NextRequest, NextResponse, after } from 'next/server'
import { getPlatformStore } from '@/lib/data/store'
import { sendLeadConfirmation } from '@/lib/email/sendLeadConfirmation'
import { scoreAndUpdateLead } from '@/lib/ai/scoreLeadWithAI'
import { postLeadToUsha } from '@/lib/usha/postLead'
import { notifyAdmin } from '@/lib/email/notifyAdmin'
import { checkRateLimit } from '@/lib/rate-limit'
import { claimTrustedFormCertificate } from '@/lib/trustedform/claim'

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

// The longest the intake waits on the database before answering. After it the
// consumer still sees success and the emails still go out (Review Focus 1).
// Tradeoff: a database slower than this loses the stored row (the admin email
// still carries the lead; see docs/RUNBOOK.md for the restore). A late insert
// may still land, without its id for the background steps.
const LEAD_DB_BUDGET_MS = 10_000
// The duplicate lookup is only an optimization, so it may not starve the insert.
const DEDUP_LOOKUP_BUDGET_MS = 3_000

function withinBudget<T>(work: Promise<T>, deadline: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} ran past its database time budget`)),
      Math.max(0, deadline - Date.now()),
    )
  })
  return Promise.race([work, timeout]).finally(() => clearTimeout(timer))
}

// drizzle wraps a driver error in a message that quotes the whole statement and
// its parameters, which here are the consumer's email and phone. Log what
// identifies the failure and never the parameters.
function describeDbError(error: unknown): { code?: string; message: string } {
  if (!(error instanceof Error)) return { message: 'unknown error' }
  const wrapped = 'query' in error || 'params' in error
  const driver = wrapped && error.cause instanceof Error ? error.cause : undefined
  const source = (wrapped ? driver : error) as (Error & { code?: string }) | undefined
  return { code: source?.code, message: source?.message ?? 'database query failed' }
}

export async function POST(request: NextRequest) {
  try {
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
      console.error('LEAD NOT STORED: platform database not configured; lead sent via email only.', { referenceNumber })
    } else {
      // Duplicate check: same email submitted recently => idempotent success.
      // A failed lookup must not block intake: carry on to the insert, as the
      // Supabase version did when its lookup returned an error.
      const startedAt = Date.now()
      const since = new Date(startedAt - DEDUP_WINDOW_MS).toISOString()
      let duplicateReference: string | null = null
      try {
        duplicateReference = await withinBudget(
          store.findRecentDuplicate(normalizedEmail, since),
          startedAt + DEDUP_LOOKUP_BUDGET_MS,
          'duplicate lookup',
        )
      } catch (error) {
        console.error('LEAD DEDUP LOOKUP FAILED (continuing):', describeDbError(error), { referenceNumber })
      }

      if (duplicateReference) {
        console.log('Duplicate lead submission ignored:', { referenceNumber: duplicateReference })
        return NextResponse.json({
          success: true,
          referenceNumber: duplicateReference,
          message: 'Lead already received',
        })
      }

      // The Supabase insert went through JSON, which stored a non-numeric age
      // as null and an array (the PPO funnel's `priorities`) as JSON text. The
      // Postgres driver does neither: NaN fails the integer column and an array
      // becomes a Postgres array literal. Normalize so stored values match.
      const parsedAge = age ? parseInt(age, 10) : null
      const storedAge = Number.isNaN(parsedAge) ? null : parsedAge
      const storedPriorities = Array.isArray(priorities)
        ? JSON.stringify(priorities)
        : priorities || null

      try {
        const insertResult = await withinBudget(store.createLead({
          referenceNumber,
          firstName,
          lastName,
          email: normalizedEmail,
          phone: phone || null,
          age: storedAge,
          state: state || null,
          incomeRange: incomeRange || null,
          householdSize: householdSize || null,
          qualifyingEvent: qualifyingEvent || null,
          priorities: storedPriorities,
          tcpaConsent,
          tcpaConsentAt,
          trustedFormCertUrl: trustedFormCertUrl || null,
          funnelType: resolvedFunnelType,
          utmSource: utmSource || null,
          utmMedium: utmMedium || null,
          utmCampaign: utmCampaign || null,
          ipAddress,
          quizAnswers: quizAnswers ?? null,
        }), startedAt + LEAD_DB_BUDGET_MS, 'lead insert')
        if (insertResult) {
          data = { id: insertResult.id, created_at: insertResult.createdAt }
        } else {
          // The store found the reference already taken by a different lead, so
          // nothing was stored for this one. Never leave that unlogged.
          console.error('LEAD INSERT FAILED:', 'insert returned no row', { referenceNumber })
        }
      } catch (error) {
        // Loud, not silent: the lead form must not break, but a failed insert
        // is an operational problem, not a routine fallback.
        console.error('LEAD INSERT FAILED (continuing with notifications):', describeDbError(error), { referenceNumber })
      }
    }

    // ── Post-response pipeline ──────────────────────────────────────────────
    // after() runs once the response is sent but keeps the function alive for
    // the work, so on Vercel these integrations actually complete.
    after(async () => {
      // 1. Claim the TrustedForm certificate (TCPA compliance evidence). An
      //    unclaimed certificate expires, so failures are logged loudly, and a
      //    claimed certificate whose consent phrases were not found is reported
      //    too (TrustedForm keeps it, but the evidence is weaker).
      if (trustedFormCertUrl) {
        try {
          const claim = await claimTrustedFormCertificate({
            certUrl: trustedFormCertUrl,
            reference: referenceNumber,
            email: normalizedEmail,
            phone,
          })
          if (claim.status === 'failed') {
            console.error('TRUSTEDFORM CLAIM FAILED:', claim.reason, { referenceNumber })
          } else if (claim.outcome !== 'success' || claim.requiredNotFound.length > 0) {
            console.error('TRUSTEDFORM SCAN MISMATCH:', {
              referenceNumber,
              outcome: claim.outcome,
              requiredNotFound: claim.requiredNotFound,
              warnings: claim.warnings,
            })
          } else {
            console.log('TRUSTEDFORM CLAIM OK:', { referenceNumber, requiredFound: claim.requiredFound })
          }
        } catch (err) {
          console.error('TRUSTEDFORM CLAIM FAILED:', err instanceof Error ? err.message : 'unknown error', { referenceNumber })
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

      // 4. Score the lead with AI (updates the lead in the database).
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
    })

    return NextResponse.json({
      success: true,
      referenceNumber,
      message: 'Lead submitted successfully',
    })
  } catch (error) {
    // Never log the error itself: a SyntaxError message quotes the start of the
    // consumer's body.
    console.error('Error processing lead submission:', error instanceof Error ? error.name : 'unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
