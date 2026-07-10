import { NextResponse } from "next/server"
import { getPlatformStore } from "@/lib/data/store"
import { getPlatformProvider } from "@/lib/platform/provider"

/**
 * Liveness + schema check. Returns 503 when the active provider is unconfigured or the
 * `leads` table is unreachable (e.g. the app deployed before the migration
 * was applied) so monitoring catches the mismatch instead of users.
 */
export async function GET() {
  const provider = getPlatformProvider()
  const store = await getPlatformStore()
  if (!store.isConfigured()) {
    return NextResponse.json(
      { status: "error", reason: "database_unconfigured", provider },
      { status: 503 },
    )
  }

  try {
    await store.healthCheck()
  } catch (error) {
    console.error("[health] active database check failed", { provider, error })
    return NextResponse.json(
      { status: "error", reason: "leads_table_unreachable", provider },
      { status: 503 },
    )
  }

  return NextResponse.json({ status: "ok", provider })
}
