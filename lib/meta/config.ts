// Meta (Facebook) Pixel + Conversions API config. Env-driven so each deployment
// points at its own dataset, and fully inert until configured: every helper
// no-ops when the Pixel ID / CAPI token are absent.
//
//   NEXT_PUBLIC_META_PIXEL_ID  public dataset (pixel) id, read on client + server
//   META_CAPI_ACCESS_TOKEN     SECRET, server only, never exposed to the browser
//   META_CAPI_TEST_EVENT_CODE  optional, routes events to Meta's Test Events tool
//   META_GRAPH_VERSION         optional, defaults to the current Graph API version

export const META_PIXEL_ID = (process.env.NEXT_PUBLIC_META_PIXEL_ID || "").trim()

export function isPixelConfigured(): boolean {
  return META_PIXEL_ID.length > 0
}

// Server-only. Do not import where the returned token could reach the client.
export function getCapiConfig() {
  const pixelId = META_PIXEL_ID
  const token = (process.env.META_CAPI_ACCESS_TOKEN || "").trim()
  const version = (process.env.META_GRAPH_VERSION || "v25.0").trim()
  const testEventCode = (process.env.META_CAPI_TEST_EVENT_CODE || "").trim()
  return {
    enabled: pixelId.length > 0 && token.length > 0,
    pixelId,
    token,
    version,
    testEventCode: testEventCode || undefined,
  }
}
