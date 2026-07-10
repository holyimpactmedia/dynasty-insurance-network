import { Resend } from "resend"
import { formatFromAddress } from "./fromAddress"

type AuthEmailKind = "verification" | "password-reset"

export async function sendAuthEmail({
  to,
  url,
  kind,
}: {
  to: string
  url: string
  kind: AuthEmailKind
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error("[auth-email] RESEND_API_KEY is not configured")
    return
  }

  const resend = new Resend(apiKey)
  const from = formatFromAddress(
    process.env.RESEND_FROM_EMAIL,
    "Holy Impact Media",
    "noreply@holyimpactmedia.com",
  )
  const isReset = kind === "password-reset"
  const subject = isReset ? "Reset your Dynasty portal password" : "Verify your Dynasty portal email"
  const action = isReset ? "Reset password" : "Verify email"

  const { error } = await resend.emails.send({
    from,
    to,
    subject,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#111827">
        <h1 style="color:#0A1128;font-size:24px">${subject}</h1>
        <p style="line-height:1.6">Use the secure link below to ${action.toLowerCase()}.</p>
        <p><a href="${url}" style="display:inline-block;background:#0A1128;color:#D4AF37;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:700">${action}</a></p>
        <p style="font-size:12px;color:#6b7280">If you did not request this, you can ignore this email.</p>
      </div>`,
  })

  if (error) throw new Error(error.message)
}
