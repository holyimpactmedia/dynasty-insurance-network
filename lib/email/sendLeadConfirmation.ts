import { Resend } from 'resend'

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
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@dynasty.app'

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
            <td style="background: linear-gradient(135deg, #0A1128 0%, #1a2744 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #D4AF37; font-size: 28px; font-weight: bold;">Dynasty</h1>
              <p style="margin: 8px 0 0 0; color: #ffffff; font-size: 16px;">Your Request Was Received</p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 32px;">
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Hi ${firstName},
              </p>
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Thank you for taking the time to check your coverage options. A licensed insurance specialist will contact you within <strong>2 hours</strong> at ${phone || email}.
              </p>
              
              <!-- Reference Number Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                <tr>
                  <td style="background-color: #f8f9fa; border-left: 4px solid #D4AF37; padding: 16px 20px; border-radius: 0 4px 4px 0;">
                    <p style="margin: 0; color: #666666; font-size: 14px;">Your Reference Number</p>
                    <p style="margin: 4px 0 0 0; color: #0A1128; font-size: 24px; font-weight: bold;">${referenceNumber}</p>
                  </td>
                </tr>
              </table>

              <!-- Timeline -->
              <h2 style="margin: 32px 0 16px 0; color: #0A1128; font-size: 18px; font-weight: 600;">What Happens Next</h2>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eeeeee;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 40px; vertical-align: top;">
                          <div style="width: 32px; height: 32px; background-color: #D4AF37; border-radius: 50%; text-align: center; line-height: 32px; color: #0A1128; font-weight: bold; font-size: 14px;">1</div>
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
                          <div style="width: 32px; height: 32px; background-color: #D4AF37; border-radius: 50%; text-align: center; line-height: 32px; color: #0A1128; font-weight: bold; font-size: 14px;">2</div>
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
                          <div style="width: 32px; height: 32px; background-color: #D4AF37; border-radius: 50%; text-align: center; line-height: 32px; color: #0A1128; font-weight: bold; font-size: 14px;">3</div>
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
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 24px 32px; border-top: 1px solid #eeeeee;">
              <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.5; text-align: center;">
                You are receiving this email because you submitted a request for healthcare coverage options. 
                If you did not make this request, please disregard this email.
                <br><br>
                Dynasty Health Insurance | Reply STOP to opt out
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
      from: `Dynasty Health Insurance <${fromEmail}>`,
      to: email,
      subject: `Your Coverage Options Are Being Prepared, ${firstName}`,
      html: htmlContent,
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
