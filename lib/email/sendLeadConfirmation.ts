import { Resend } from 'resend'
import { formatFromAddress } from './fromAddress'

interface LeadConfirmationParams {
  firstName: string
  email: string
  phone: string | null
  referenceNumber: string
}

export async function sendLeadConfirmation({
  firstName,
  email,
  phone,
  referenceNumber,
}: LeadConfirmationParams): Promise<{ success: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.error('[v0] RESEND_API_KEY is not set, skipping email')
    return { success: false, error: 'RESEND_API_KEY not configured' }
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromEmail = formatFromAddress(
    process.env.RESEND_FROM_EMAIL,
    'Union Private Healthcare',
    'noreply@holyimpactmedia.com',
  )

  // CAN-SPAM compliance: unsubscribe mechanism + physical postal address.
  // Override these via env vars when the registered business address is set.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://unionprivatehealthcare.com'
  const siteHost = siteUrl.replace(/^https?:\/\//, '')
  const unsubscribeUrl = `${siteUrl}/api/unsubscribe?email=${encodeURIComponent(email)}`
  const unsubscribeMailto = process.env.UNSUBSCRIBE_EMAIL || 'unsubscribe@holyimpactmedia.com'
  const physicalAddress = process.env.HOLY_IMPACT_MAILING_ADDRESS
    || 'Holy Impact Media, LLC, [Mailing Address On File] - contact privacy@holyimpactmedia.com for our registered postal address'

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #ffffff; padding: 32px; text-align: center; border-bottom: 3px solid #0A2540;">
              <h1 style="margin: 0; color: #0A2540; font-size: 26px; font-weight: bold; letter-spacing: -0.5px;">Union Private Healthcare</h1>
              <p style="margin: 8px 0 0 0; color: #666666; font-size: 15px;">Your Request Was Received</p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 32px;">
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Hi ${firstName},
              </p>
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                You recently requested health insurance information through Union Private Healthcare. We've matched you with a licensed specialist at Dynasty Insurance Group, who will contact you within 2 hours on business days at the phone number or email you provided.
              </p>
              
              <!-- Reference Number Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                <tr>
                  <td style="background-color: #f8f9fa; border-left: 4px solid #0A2540; padding: 16px 20px; border-radius: 0 4px 4px 0;">
                    <p style="margin: 0; color: #666666; font-size: 14px;">Your Reference Number</p>
                    <p style="margin: 4px 0 0 0; color: #0A2540; font-size: 24px; font-weight: bold;">${referenceNumber}</p>
                  </td>
                </tr>
              </table>

              <!-- Timeline -->
              <h2 style="margin: 32px 0 16px 0; color: #0A2540; font-size: 18px; font-weight: 600;">What Happens Next</h2>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eeeeee;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 40px; vertical-align: top;">
                          <div style="width: 32px; height: 32px; background-color: #0A2540; border-radius: 50%; text-align: center; line-height: 32px; color: #ffffff; font-weight: bold; font-size: 14px;">1</div>
                        </td>
                        <td style="padding-left: 12px;">
                          <p style="margin: 0; color: #333333; font-weight: 600;">Right Now</p>
                          <p style="margin: 4px 0 0 0; color: #666666; font-size: 14px;">Our team is reviewing your information and matching you with the best plans</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eeeeee;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 40px; vertical-align: top;">
                          <div style="width: 32px; height: 32px; background-color: #0A2540; border-radius: 50%; text-align: center; line-height: 32px; color: #ffffff; font-weight: bold; font-size: 14px;">2</div>
                        </td>
                        <td style="padding-left: 12px;">
                          <p style="margin: 0; color: #333333; font-weight: 600;">Within 2 Hours</p>
                          <p style="margin: 4px 0 0 0; color: #666666; font-size: 14px;">A licensed specialist will call you to discuss your personalized options</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 40px; vertical-align: top;">
                          <div style="width: 32px; height: 32px; background-color: #0A2540; border-radius: 50%; text-align: center; line-height: 32px; color: #ffffff; font-weight: bold; font-size: 14px;">3</div>
                        </td>
                        <td style="padding-left: 12px;">
                          <p style="margin: 0; color: #333333; font-weight: 600;">Within 24 Hours</p>
                          <p style="margin: 4px 0 0 0; color: #666666; font-size: 14px;">You'll have a clear understanding of your best coverage options and costs</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- CAN-SPAM Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 24px 32px; border-top: 1px solid #eeeeee;">
              <p style="margin: 0 0 10px 0; color: #666666; font-size: 12px; line-height: 1.5; text-align: center;">
                Union Private Healthcare is a brand of Holy Impact Media, LLC, a marketing and lead-generation service. Not an insurance agency, insurer, or government program.<br />
                ${physicalAddress}
              </p>
              <p style="margin: 0 0 8px 0; color: #999999; font-size: 11px; line-height: 1.5; text-align: center;">
                You received this email because you submitted a request for health insurance information at our website. We are not affiliated with any government entity, Healthcare.gov, or CMS.
              </p>
              <p style="margin: 0; color: #999999; font-size: 11px; line-height: 1.5; text-align: center;">
                <a href="${unsubscribeUrl}" style="color: #666666; text-decoration: underline;">Unsubscribe</a>
                &nbsp;&middot;&nbsp;
                <a href="mailto:${unsubscribeMailto}" style="color: #666666; text-decoration: underline;">Unsubscribe by email</a>
                &nbsp;&middot;&nbsp;
                <a href="https://${siteHost}/privacy" style="color: #666666; text-decoration: underline;">Privacy</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  try {
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `Your Coverage Options Are Being Prepared, ${firstName}`,
      html: htmlContent,
      headers: {
        // RFC 8058 one-click unsubscribe + RFC 2369 mailto fallback
        'List-Unsubscribe': `<${unsubscribeUrl}>, <mailto:${unsubscribeMailto}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    })

    if (error) {
      console.error('[v0] Resend email error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('[v0] Failed to send confirmation email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
