import { Resend } from "resend"
import { formatFromAddress } from "./fromAddress"

// Welcome email for a portal user created by a super admin. Carries the login
// link only — never the temporary password, which the admin shares out of band.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export async function sendPortalInvite({
  to,
  name,
  loginUrl,
}: {
  to: string
  name: string
  loginUrl: string
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error("[portal-invite] RESEND_API_KEY is not configured")
    return
  }

  const resend = new Resend(apiKey)
  const from = formatFromAddress(
    process.env.RESEND_FROM_EMAIL,
    "Union Private Healthcare",
    "noreply@holyimpactmedia.com",
  )
  const firstName = escapeHtml(name.trim().split(/\s+/)[0] || "there")

  const { error } = await resend.emails.send({
    from,
    to,
    subject: "You've been added to the Union Private Healthcare portal",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#111827">
        <h1 style="color:#0A2540;font-size:24px">Welcome to the Union Private Healthcare portal</h1>
        <p style="line-height:1.6">Hi ${firstName}, an administrator created a portal account for you. Sign in with the email address this message was sent to and the temporary password your administrator shared with you.</p>
        <p><a href="${loginUrl}" style="display:inline-block;background:#0A2540;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:700">Sign in to the portal</a></p>
        <p style="line-height:1.6">For your security, please change your password after your first sign-in.</p>
        <p style="font-size:12px;color:#6b7280">If you were not expecting this, you can ignore this email.</p>
      </div>`,
  })

  if (error) throw new Error(error.message)
}
