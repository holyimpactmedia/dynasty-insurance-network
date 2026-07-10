import { Client } from "pg"

interface Summary {
  leads: Record<string, unknown>
  funnels: unknown[]
  marketplace: unknown[]
  settings: unknown[]
  suppressions: number
}

async function summarize(client: Client): Promise<Summary> {
  const [leads, funnels, marketplace, settings, suppressions] = await Promise.all([
    client.query(`
      select jsonb_build_object(
        'count', count(*),
        'min_created_at', min(created_at),
        'max_created_at', max(created_at),
        'tcpa_verified', count(*) filter (where tcpa_consent = true),
        'trusted_form', count(*) filter (where trusted_form_cert_url is not null),
        'ai_scored', count(*) filter (where ai_score is not null),
        'sent_revenue', coalesce(sum(sell_price) filter (where usha_status = 'sent'), 0),
        'duplicate_references', count(*) - count(distinct reference_number),
        'quiz_answers', count(*) filter (where quiz_answers is not null),
        'ai_reason_arrays', count(*) filter (where ai_score_reasons is not null)
      ) as value from public.leads
    `),
    client.query(`select coalesce(funnel_type, 'private_health') as key, count(*)::int as count from public.leads group by 1 order by 1`),
    client.query(`select coalesce(usha_status, 'none') as key, count(*)::int as count from public.leads group by 1 order by 1`),
    client.query(`select key, value from public.app_settings order by key`),
    client.query(`select count(*)::int as count from public.email_suppressions`),
  ])
  return {
    leads: leads.rows[0]?.value ?? {},
    funnels: funnels.rows,
    marketplace: marketplace.rows,
    settings: settings.rows,
    suppressions: Number(suppressions.rows[0]?.count ?? 0),
  }
}

async function main() {
  const sourceUrl = process.env.SUPABASE_DIRECT_URL
  const destinationUrl = process.env.DATABASE_URL_DIRECT
  if (!sourceUrl || !destinationUrl) {
    throw new Error("SUPABASE_DIRECT_URL and DATABASE_URL_DIRECT are required")
  }

  const source = new Client({ connectionString: sourceUrl })
  const destination = new Client({ connectionString: destinationUrl })
  await Promise.all([source.connect(), destination.connect()])
  try {
    const [sourceSummary, destinationSummary] = await Promise.all([
      summarize(source),
      summarize(destination),
    ])
    const matches = JSON.stringify(sourceSummary) === JSON.stringify(destinationSummary)
    console.log(JSON.stringify({ matches, source: sourceSummary, destination: destinationSummary }, null, 2))
    if (!matches) process.exitCode = 1
  } finally {
    await Promise.all([source.end(), destination.end()])
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
