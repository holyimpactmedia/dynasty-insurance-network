// Admin notification email sent on every new lead submission.
// Includes all lead data, AI score (if available), and USHA submission status.
// Requires ADMIN_EMAIL and RESEND_API_KEY to be set in environment.

import { Resend } from 'resend'
import type { UshaPostResult } from '@/lib/usha/postLead'

export interface AdminNotificationParams {
  referenceNumber: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  age: number | null
  state: string | null
  funnelType: string | null
  incomeRange: string | null
  householdSize: string | null
  qualifyingEvent: string | null
  priorities: string | null
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  ipAddress: string | null
  tcpaConsentAt: string | null
  trustedFormCertUrl: string | null
  aiScore?: number | null
  aiUrgency?: string | null
  aiReasons?: string[] | null
  predictedCloseRate?: number | null
  recommendedApproach?: string | null
  ushaResult?: UshaPostResult | null
}

/** Urgency colour map for the email badge */
const urgencyColor: Record<string, string> = {
  hot: '#dc2626',
  warm: '#d97706',
  qualified: '#2563eb',
  nurture: '#7c3aed',
  cold: '#6b7280',
}

/** Returns a colour hex for a 0-100 AI score */
function scoreColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return '#6b7280'
  if (score >= 80) return '#16a34a'
  if (score >= 60) return '#d97706'
  return '#dc2626'
}

function row(label: string, value: string | null | undefined): string {
  if (!value) return ''
  return `
    <tr>
      <td style="padding: 6px 0; color: #6b7280; font-size: 13px; white-space: nowrap; width: 160px; vertical-align: top;">${label}</td>
      <td style="padding: 6px 0; color: #111827; font-size: 13px; font-weight: 500;">${value}</td>
    </tr>`
}

function section(title: string, content: string): string {
  return `
    <div style="margin-bottom: 20px;">
      <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #9ca3af; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 10px;">${title}</div>
      <table cellpadding="0" cellspacing="0" width="100%">${content}</table>
    </div>`
}

export async function notifyAdmin(
  params: AdminNotificationParams,
): Promise<{ success: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[notifyAdmin] RESEND_API_KEY not set — skipping admin notification')
    return { success: false, error: 'RESEND_API_KEY not configured' }
  }

  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) {
    console.warn('[notifyAdmin] ADMIN_EMAIL not set — skipping admin notification')
    return { success: false, error: 'ADMIN_EMAIL not configured' }
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@dynasty.app'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dynasty.app'

  const funnelLabel: Record<string, string> = {
    healthcare_aca: 'ACA / Individual',
    family: 'Family',
    cobra: 'COBRA',
    self_employed: 'Self-Employed',
    ppo: 'PPO',
    business: 'Small Business',
  }

  const urgency = params.aiUrgency ?? null
  const score = params.aiScore ?? null
  const ushaStatus = params.ushaResult?.status ?? 'disabled'

  const ushaStatusLabel: Record<string, string> = {
    sent: 'Sent to USHA',
    failed: 'USHA Post Failed',
    disabled: 'USHA Not Configured',
  }
  const ushaStatusColor: Record<string, string> = {
    sent: '#16a34a',
    failed: '#dc2626',
    disabled: '#9ca3af',
  }

  const subject =
    score !== null
      ? `New Lead: ${params.firstName} ${params.lastName} | Score ${score}/100 | ${funnelLabel[params.funnelType ?? ''] ?? params.funnelType ?? 'Unknown'} | ${params.state ?? 'No State'}`
      : `New Lead: ${params.firstName} ${params.lastName} | ${funnelLabel[params.funnelType ?? ''] ?? params.funnelType ?? 'Unknown'} | ${params.state ?? 'No State'}`

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
  <tr><td align="center">
    <table width="640" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

      <!-- Header -->
      <tr>
        <td style="background:linear-gradient(135deg,#0A1128 0%,#1a2744 100%);padding:24px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <div style="color:#D4AF37;font-size:22px;font-weight:800;letter-spacing:-0.5px;">Dynasty</div>
                <div style="color:#94a3b8;font-size:13px;margin-top:2px;">New Lead Alert</div>
              </td>
              <td align="right">
                <div style="display:inline-block;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:6px;padding:8px 14px;">
                  <div style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;">Reference</div>
                  <div style="color:#ffffff;font-size:16px;font-weight:700;letter-spacing:0.04em;margin-top:2px;">${params.referenceNumber}</div>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Score + Status Bar -->
      <tr>
        <td style="background:#f8fafc;border-bottom:1px solid #e5e7eb;padding:16px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              ${score !== null ? `
              <td style="text-align:center;border-right:1px solid #e5e7eb;padding-right:20px;margin-right:20px;">
                <div style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">AI Score</div>
                <div style="font-size:32px;font-weight:800;color:${scoreColor(score)};">${score}</div>
                <div style="font-size:11px;color:#9ca3af;">/ 100</div>
              </td>` : ''}
              ${urgency ? `
              <td style="text-align:center;border-right:1px solid #e5e7eb;padding:0 20px;">
                <div style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Urgency</div>
                <div style="display:inline-block;background:${urgencyColor[urgency] ?? '#6b7280'}20;color:${urgencyColor[urgency] ?? '#6b7280'};padding:4px 12px;border-radius:20px;font-size:14px;font-weight:700;text-transform:capitalize;">${urgency}</div>
              </td>` : ''}
              <td style="text-align:center;border-right:1px solid #e5e7eb;padding:0 20px;">
                <div style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Funnel</div>
                <div style="font-size:14px;font-weight:600;color:#111827;">${funnelLabel[params.funnelType ?? ''] ?? params.funnelType ?? 'Unknown'}</div>
              </td>
              <td style="text-align:center;padding:0 0 0 20px;">
                <div style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">USHA</div>
                <div style="font-size:14px;font-weight:600;color:${ushaStatusColor[ushaStatus]};">${ushaStatusLabel[ushaStatus]}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:28px 32px;">

          ${section('Contact Information',
            row('Full Name', `${params.firstName} ${params.lastName}`) +
            row('Email', params.email) +
            row('Phone', params.phone) +
            row('Age', params.age?.toString()) +
            row('State', params.state)
          )}

          ${section('Insurance Profile',
            row('Funnel', funnelLabel[params.funnelType ?? ''] ?? params.funnelType) +
            row('Qualifying Event', params.qualifyingEvent) +
            row('Household Size', params.householdSize) +
            row('Income Range', params.incomeRange) +
            row('Coverage Priority', params.priorities)
          )}

          ${score !== null ? section('AI Analysis',
            row('Score', `${score}/100`) +
            row('Urgency', urgency ?? undefined) +
            row('Predicted Close Rate', params.predictedCloseRate !== null && params.predictedCloseRate !== undefined
              ? `${Math.round((params.predictedCloseRate) * 100)}%`
              : undefined) +
            row('Recommended Approach', params.recommendedApproach) +
            (params.aiReasons?.length
              ? `<tr><td style="padding:6px 0;color:#6b7280;font-size:13px;vertical-align:top;width:160px;">Score Reasons</td><td style="padding:6px 0;"><ul style="margin:0;padding-left:16px;">${params.aiReasons.map(r => `<li style="color:#111827;font-size:13px;margin-bottom:2px;">${r}</li>`).join('')}</ul></td></tr>`
              : '')
          ) : ''}

          ${section('Attribution & Compliance',
            row('UTM Source', params.utmSource) +
            row('UTM Medium', params.utmMedium) +
            row('UTM Campaign', params.utmCampaign) +
            row('IP Address', params.ipAddress) +
            row('TCPA Consent At', params.tcpaConsentAt
              ? new Date(params.tcpaConsentAt).toLocaleString('en-US', { timeZoneName: 'short' })
              : undefined) +
            (params.trustedFormCertUrl
              ? `<tr><td style="padding:6px 0;color:#6b7280;font-size:13px;width:160px;">TrustedForm Cert</td><td style="padding:6px 0;"><a href="${params.trustedFormCertUrl}" style="color:#2563eb;font-size:13px;">View Certificate</a></td></tr>`
              : '')
          )}

        </td>
      </tr>

      <!-- CTA -->
      <tr>
        <td style="padding:0 32px 28px 32px;">
          <a href="${siteUrl}/dashboard/admin" style="display:inline-block;background:#0A1128;color:#D4AF37;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:14px;font-weight:700;letter-spacing:0.02em;">
            View in Admin Dashboard
          </a>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#f8fafc;border-top:1px solid #e5e7eb;padding:16px 32px;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">
            Dynasty Insurance Network &mdash; Internal Admin Alert &mdash; ${new Date().toLocaleString('en-US', { timeZoneName: 'short' })}
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`

  try {
    const { error } = await resend.emails.send({
      from: `Dynasty CRM <${fromEmail}>`,
      to: adminEmail,
      subject,
      html,
    })

    if (error) {
      console.error('[notifyAdmin] Resend error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[notifyAdmin] Failed to send admin notification:', message)
    return { success: false, error: message }
  }
}
