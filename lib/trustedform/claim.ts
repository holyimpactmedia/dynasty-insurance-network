// Claims a TrustedForm certificate (TCPA proof of consent) with Dynasty's key.
// Server only: called from the lead intake's background work. There is no
// public route for it, so nobody else can spend claims or read certificates.
const TRUSTEDFORM_API_BASE = "https://cert.trustedform.com"
const CLAIM_TIMEOUT_MS = 10_000

// Phrases TrustedForm must find on the page the consumer saw. Each appears
// verbatim in the approved consent text of every live funnel (pinned by
// lib/trustedform/claim.test.ts); keep them in step with counsel's text.
export const TRUSTEDFORM_SCAN_TERMS = [
  "consent to be contacted by Holy Impact Media",
  "Reply STOP to opt out of SMS",
] as const

export type ClaimInput = { certUrl: string; reference: string; email?: string | null; phone?: string | null }

export type ClaimResult =
  | { status: "claimed"; outcome: string | null; warnings: string[]; requiredFound: string[]; requiredNotFound: string[] }
  | { status: "failed"; reason: string }

// TrustedForm writes the warning text and may quote lead data in it; strip
// anything that looks like an email address or a phone number before it is
// returned (and therefore before anything logs it).
function redactWarning(warning: string): string {
  return warning
    .replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, "[redacted email]")
    .replace(/\+?\d[\d\s().-]{5,}\d/g, "[redacted number]")
}

function certIdFrom(certUrl: string): string | null {
  const last = certUrl.split(/[?#]/)[0].split("/").filter(Boolean).pop() ?? ""
  // Letters and digits only, so a crafted URL cannot reach any other TrustedForm path.
  return /^[A-Za-z0-9]+$/.test(last) ? last : null
}

export async function claimTrustedFormCertificate(
  input: ClaimInput,
  env: { TRUSTEDFORM_API_KEY?: string } = { TRUSTEDFORM_API_KEY: process.env.TRUSTEDFORM_API_KEY },
): Promise<ClaimResult> {
  const apiKey = env.TRUSTEDFORM_API_KEY
  if (!apiKey) return { status: "failed", reason: "TRUSTEDFORM_API_KEY is not set" }
  const certId = certIdFrom(input.certUrl)
  if (!certId) return { status: "failed", reason: "certificate URL has no certificate id" }

  const body: Record<string, unknown> = { reference: input.reference, required_scan_terms: TRUSTEDFORM_SCAN_TERMS }
  if (input.email) body.email = input.email
  if (input.phone) body.phone = input.phone

  try {
    const response = await fetch(`${TRUSTEDFORM_API_BASE}/${certId}`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`API:${apiKey}`).toString("base64")}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(CLAIM_TIMEOUT_MS),
    })
    if (!response.ok) return { status: "failed", reason: `HTTP ${response.status}` }
    const data = (await response.json()) as {
      outcome?: string
      warnings?: string[]
      scans?: { required_found?: string[]; required_not_found?: string[] }
    }
    return {
      status: "claimed",
      outcome: data.outcome ?? null,
      warnings: (data.warnings ?? []).map(redactWarning),
      requiredFound: data.scans?.required_found ?? [],
      requiredNotFound: data.scans?.required_not_found ?? [],
    }
  } catch (error) {
    const name = error instanceof Error ? error.name : "Error"
    return { status: "failed", reason: name === "TimeoutError" ? `timed out after ${CLAIM_TIMEOUT_MS} ms` : `${name}: request failed` }
  }
}
