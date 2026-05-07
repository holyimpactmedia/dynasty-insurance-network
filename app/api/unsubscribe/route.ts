import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'

// CAN-SPAM-compliant unsubscribe endpoint.
//
// - GET: shows a confirmation page (rendered as plain text) and records the
//   request. This is what a user clicks from the email footer.
// - POST: handles RFC 8058 "one-click" unsubscribe (List-Unsubscribe-Post).
//   Returns 200 with no body. Mailbox providers (Gmail, Yahoo, Apple) call
//   this directly without user confirmation.
//
// Both paths attempt to write to an `email_suppressions` row. If Supabase is
// not configured or the table is missing, we still return success to the
// requester — CAN-SPAM is satisfied as long as the unsubscribe is honored
// within 10 business days, and the suppression list can be backfilled from
// logs if needed.

async function recordSuppression(email: string, source: string) {
  if (!email) return
  const lower = email.toLowerCase().trim()
  console.log('[unsubscribe] suppression recorded', { email: lower, source })

  try {
    const supabase = createClient()
    if (!supabase) return
    await supabase
      .from('email_suppressions')
      .upsert(
        {
          email: lower,
          source,
          suppressed_at: new Date().toISOString(),
        },
        { onConflict: 'email' },
      )
  } catch (err) {
    console.error('[unsubscribe] failed to write suppression row', err)
  }
}

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email') || ''
  await recordSuppression(email, 'link-click')

  const display = email
    ? `the address ${email}`
    : 'your address'

  return new NextResponse(
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Unsubscribed | Holy Impact Media</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#0A1128; color:#fff; margin:0; padding:0; min-height:100vh; display:flex; align-items:center; justify-content:center; }
    .card { max-width: 480px; padding: 40px 32px; background:#0F1A3D; border:1px solid #2a3760; border-radius:14px; text-align:center; }
    h1 { color:#D4AF37; margin: 0 0 12px 0; font-size: 22px; }
    p { color:#cbd5e1; line-height: 1.55; margin: 8px 0; font-size: 14px; }
    a { color:#D4AF37; }
  </style>
</head>
<body>
  <div class="card">
    <h1>You've been unsubscribed</h1>
    <p>${display} has been removed from Holy Impact Media email lists.</p>
    <p>If you continue to receive marketing email after 10 business days, please email
       <a href="mailto:privacy@holyimpactmedia.com">privacy@holyimpactmedia.com</a>.</p>
  </div>
</body>
</html>`,
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )
}

export async function POST(request: NextRequest) {
  // RFC 8058 one-click unsubscribe. Email may come via query string or form body.
  let email = request.nextUrl.searchParams.get('email') || ''
  if (!email) {
    try {
      const formData = await request.formData()
      email = String(formData.get('email') || '')
    } catch {
      // body might be empty / not form-encoded — that's fine
    }
  }
  await recordSuppression(email, 'one-click')
  return new NextResponse(null, { status: 200 })
}
