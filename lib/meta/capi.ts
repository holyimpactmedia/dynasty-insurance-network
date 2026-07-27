import { getCapiConfig } from "./config"
import { hashEmail, hashPhone, hashName, hashZip, hashCountry } from "./hash"

export interface LeadEventInput {
  /** Shared with the client Pixel event for deduplication. */
  eventId: string
  eventSourceUrl?: string | null
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  phone?: string | null
  zip?: string | null
  /** Meta browser identifiers captured client-side. */
  fbp?: string | null
  fbc?: string | null
  clientIp?: string | null
  userAgent?: string | null
  /** Unix seconds; defaults to now. */
  eventTime?: number
  customData?: Record<string, unknown>
}

// Fire-and-forget Meta Conversions API "Lead" event. Never throws to callers —
// a Meta outage must not affect lead capture — and no-ops when CAPI is
// unconfigured. Deduplicated against the client Pixel via a shared event_id.
export async function sendMetaLeadEvent(input: LeadEventInput): Promise<void> {
  const cfg = getCapiConfig()
  if (!cfg.enabled) return

  const userData: Record<string, unknown> = {}
  const em = hashEmail(input.email); if (em) userData.em = [em]
  const ph = hashPhone(input.phone); if (ph) userData.ph = [ph]
  const fn = hashName(input.firstName); if (fn) userData.fn = [fn]
  const ln = hashName(input.lastName); if (ln) userData.ln = [ln]
  const zp = hashZip(input.zip); if (zp) userData.zp = [zp]
  const country = hashCountry("US"); if (country) userData.country = [country]
  if (input.fbp) userData.fbp = input.fbp
  if (input.fbc) userData.fbc = input.fbc
  if (input.clientIp && input.clientIp !== "unknown") userData.client_ip_address = input.clientIp
  if (input.userAgent) userData.client_user_agent = input.userAgent

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: "Lead",
        event_time: input.eventTime ?? Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        action_source: "website",
        ...(input.eventSourceUrl ? { event_source_url: input.eventSourceUrl } : {}),
        user_data: userData,
        ...(input.customData ? { custom_data: input.customData } : {}),
      },
    ],
    // Token in the body, not the URL, so it never lands in access logs.
    access_token: cfg.token,
    ...(cfg.testEventCode ? { test_event_code: cfg.testEventCode } : {}),
  }

  try {
    const res = await fetch(`https://graph.facebook.com/${cfg.version}/${cfg.pixelId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => "")
      console.error("[meta-capi] Lead event rejected", res.status, text.slice(0, 300))
    }
  } catch (err) {
    console.error("[meta-capi] Lead event send failed", err)
  }
}
