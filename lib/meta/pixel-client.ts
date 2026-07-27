"use client"

// Client-side Meta Pixel helpers. Every function no-ops safely when the pixel
// script is absent (unset id, blocked, or JS-off), so callers never need guards.

type Fbq = ((...args: unknown[]) => void) & { queue?: unknown[] }
declare global {
  interface Window {
    fbq?: Fbq
  }
}

/** Standard-event track with optional event_id for client/server dedup. */
export function metaTrack(event: string, params?: Record<string, unknown>, eventId?: string) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return
  if (eventId) window.fbq("track", event, params ?? {}, { eventID: eventId })
  else window.fbq("track", event, params ?? {})
}

/** Custom-event track (for funnel steps like QuizStart). */
export function metaTrackCustom(event: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return
  window.fbq("trackCustom", event, params ?? {})
}

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined
  const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"))
  return m ? decodeURIComponent(m[2]) : undefined
}

// Meta browser identifiers for CAPI: the _fbp cookie, and _fbc (from the cookie,
// or derived from the fbclid URL param when the cookie has not been set yet).
export function getFbIdentifiers(): { fbp?: string; fbc?: string; fbclid?: string } {
  const fbp = getCookie("_fbp")
  let fbc = getCookie("_fbc")
  let fbclid: string | undefined
  if (typeof window !== "undefined") {
    fbclid = new URLSearchParams(window.location.search).get("fbclid") || undefined
    if (!fbc && fbclid) fbc = `fb.1.${Date.now()}.${fbclid}`
  }
  return { fbp, fbc, fbclid }
}

// UUID shared between the client Pixel event and the server CAPI event.
export function newEventId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID()
  return `e-${Date.now()}-${Math.random().toString(36).slice(2)}`
}
