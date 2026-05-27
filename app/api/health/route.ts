import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/admin"

/**
 * Liveness + schema check. Returns 503 when Supabase is unconfigured or the
 * `leads` table is unreachable (e.g. the app deployed before the migration
 * was applied) so monitoring catches the mismatch instead of users.
 */
export async function GET() {
  const supabase = createClient()
  if (!supabase) {
    return NextResponse.json(
      { status: "error", reason: "supabase_unconfigured" },
      { status: 503 },
    )
  }

  const { error } = await supabase
    .from("leads")
    .select("id", { head: true, count: "exact" })
    .limit(1)

  if (error) {
    return NextResponse.json(
      { status: "error", reason: "leads_table_unreachable", detail: error.message },
      { status: 503 },
    )
  }

  return NextResponse.json({ status: "ok" })
}
