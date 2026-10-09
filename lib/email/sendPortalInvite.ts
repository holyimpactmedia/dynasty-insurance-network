import { Resend } from "resend"
import { formatFromAddress } from "./fromAddress"

// Invite for a dashboard user created by a super admin. It carries only the
// one-time set-password link from Better Auth's reset flow; no password is
// ever generated for, shown to, or sent by the super admin.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/**
 * Returns false when email is not configured (nothing sent), true once Resend
 * accepts the message, and throws if Resend rejects it.
 */
export async function sendPortalInvite({
  to,
  name,
  setPasswordUrl,
}: {
  to: string
  name: string
  setPasswordUrl: string
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error("[portal-invite] RESEND_API_KEY is not configured")
    return false
  }

  const resend = new Resend(apiKey)
  const from = formatFromAddress(process.env.RESEND_FROM_EMAIL, "Holy Impact Media", "noreply@holyimpactmedia.com")
  const firstName = name.trim().split(/\s+/)[0] || "there"
  const forgotPasswordUrl = new URL("/auth/forgot-password", setPasswordUrl).href
  const subject = "Set your password for the Dynasty admin dashboard"
  const link = escapeHtml(setPasswordUrl)
  const forgot = escapeHtml(forgotPasswordUrl)

  const text = [
    `Hi ${firstName},`,
    "",
    "An administrator added you to the Dynasty admin dashboard. Choose your password to finish setting up your account:",
    setPasswordUrl,
    "",
    "This link works once and expires in 1 hour. If it has expired, request a new one at:",
    forgotPasswordUrl,
    "",
    "If you were not expecting this email, you can ignore it.",
    "",
    "Sent by Holy Impact Media for Dynasty Insurance Group.",
  ].join("\n")

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111827">
      <div style="background:linear-gradient(135deg,#0A1128 0%,#1a2744 100%);padding:24px 32px;border-radius:8px 8px 0 0">
        <div style="color:#D4AF37;font-size:22px;font-weight:800;letter-spacing:-0.5px">Dynasty</div>
        <div style="color:#9ca3af;font-size:12px;margin-top:2px">Admin dashboard</div>
      </div>
      <div style="padding:32px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 8px 8px">
        <p style="line-height:1.6;margin:0 0 16px">Hi ${escapeHtml(firstName)},</p>
        <p style="line-height:1.6;margin:0 0 16px">An administrator added you to the Dynasty admin dashboard. Choose your password to finish setting up your account.</p>
        <p style="margin:0 0 24px"><a href="${link}" style="display:inline-block;background:#0A1128;color:#D4AF37;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:700">Set your password</a></p>
        <p style="line-height:1.6;font-size:13px;color:#4b5563;margin:0 0 8px">This link works once and expires in 1 hour. If it has expired, request a new one at <a href="${forgot}" style="color:#0A1128">${forgot}</a>.</p>
        <p style="line-height:1.6;font-size:12px;color:#6b7280;margin:0">If you were not expecting this email, you can ignore it.</p>
      </div>
      <p style="font-size:11px;color:#9ca3af;text-align:center;margin:16px 0 0">Sent by Holy Impact Media for Dynasty Insurance Group.</p>
    </div>`

  const { error } = await resend.emails.send({ from, to, subject, html, text })
  if (error) throw new Error(error.message)
  return true
}
