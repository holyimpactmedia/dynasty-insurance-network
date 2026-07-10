import { Client, type QueryResultRow } from "pg"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const leadColumns = [
  "id", "reference_number", "first_name", "last_name", "email", "phone", "age", "state",
  "income_range", "household_size", "qualifying_event", "priorities", "tcpa_consent",
  "tcpa_consent_at", "trusted_form_cert_url", "funnel_type", "utm_source", "utm_medium",
  "utm_campaign", "ip_address", "quiz_answers", "status", "ai_score", "ai_score_reasons",
  "predicted_close_rate", "ai_scored_at", "sell_price", "usha_status", "usha_sent_at",
  "usha_lead_id", "created_at", "updated_at",
] as const

async function upsertRows(
  destination: SupabaseClient,
  table: string,
  key: string,
  rows: QueryResultRow[],
) {
  const pageSize = 200
  for (let offset = 0; offset < rows.length; offset += pageSize) {
    const batch = rows.slice(offset, offset + pageSize)
    const { error } = await destination.from(table).upsert(batch, { onConflict: key })
    if (error) throw new Error(`${table} reverse-sync failed: ${error.message}`)
  }
}

async function main() {
  const neonUrl = process.env.DATABASE_URL_DIRECT
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const cutoverAt = process.env.CUTOVER_AT
  if (!neonUrl || !supabaseUrl || !supabaseServiceKey || !cutoverAt || Number.isNaN(Date.parse(cutoverAt))) {
    throw new Error("DATABASE_URL_DIRECT, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and ISO CUTOVER_AT are required")
  }

  const source = new Client({ connectionString: neonUrl })
  const destination = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  await source.connect()
  try {
    const leadRows = await source.query(
      `select ${leadColumns.join(", ")} from public.leads where updated_at >= $1 order by updated_at`,
      [cutoverAt],
    )
    const suppressionRows = await source.query(
      "select email, source, suppressed_at from public.email_suppressions where suppressed_at >= $1 order by suppressed_at",
      [cutoverAt],
    )
    const settingRows = await source.query("select key, value, updated_at from public.app_settings order by key")

    await upsertRows(destination, "leads", "id", leadRows.rows)
    await upsertRows(destination, "email_suppressions", "email", suppressionRows.rows)
    await upsertRows(destination, "app_settings", "key", settingRows.rows)

    console.log(JSON.stringify({
      cutoverAt,
      leadsUpserted: leadRows.rowCount,
      suppressionsUpserted: suppressionRows.rowCount,
      settingsUpserted: settingRows.rowCount,
    }, null, 2))
  } finally {
    await source.end()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
