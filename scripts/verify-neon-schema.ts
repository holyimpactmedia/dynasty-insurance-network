import { Client } from "pg"

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error("DATABASE_URL is required")

  const hardTimeout = setTimeout(() => {
    console.error("Neon schema verification timed out after 45 seconds")
    process.exit(2)
  }, 45_000)

  const client = new Client({ connectionString, connectionTimeoutMillis: 15_000 })
  try {
    await client.connect()
    await client.query("set statement_timeout = '15s'")

    const tables = await client.query<{ table_name: string }>(`
        select table_name from information_schema.tables
        where table_schema = 'public'
          and table_name in ('leads', 'app_settings', 'email_suppressions', 'user', 'session', 'account', 'verification')
        order by table_name
      `)
    const columns = await client.query<{ table_name: string; count: number }>(`
        select table_name, count(*)::int as count
        from information_schema.columns
        where table_schema = 'public'
          and table_name in ('leads', 'app_settings', 'email_suppressions')
        group by table_name order by table_name
      `)
    const triggers = await client.query<{ trigger_name: string }>(`
        select trigger_name from information_schema.triggers
        where trigger_schema = 'public'
          and trigger_name in ('leads_set_updated_at', 'app_settings_set_updated_at')
        order by trigger_name
      `)
    const indexes = await client.query<{ indexname: string }>(`
        select indexname from pg_indexes
        where schemaname = 'public'
          and indexname in (
            'leads_reference_number_key', 'idx_leads_email', 'idx_leads_created_at',
            'idx_leads_usha_status', 'idx_leads_funnel_type'
          )
        order by indexname
      `)
    const settings = await client.query<{ key: string; value: unknown }>(`
        select key, value from public.app_settings
        where key in ('projections_enabled', 'lead_intake_paused')
        order by key
      `)
    const migrations = await client.query<{ count: number }>(
      `select count(*)::int as count from drizzle.__drizzle_migrations`,
    )
    const constraints = await client.query<{ constraint_name: string }>(`
        select constraint_name from information_schema.table_constraints
        where table_schema = 'public' and table_name = 'leads'
          and constraint_type = 'CHECK'
      `)

    const expectedTables = ["account", "app_settings", "email_suppressions", "leads", "session", "user", "verification"]
    assert(JSON.stringify(tables.rows.map((row) => row.table_name)) === JSON.stringify(expectedTables), "Expected application and Better Auth tables are not all present")

    const columnCounts = Object.fromEntries(columns.rows.map((row) => [row.table_name, row.count]))
    assert(columnCounts.leads === 32, `Expected 32 leads columns; found ${columnCounts.leads ?? 0}`)
    assert(columnCounts.app_settings === 3, `Expected 3 app_settings columns; found ${columnCounts.app_settings ?? 0}`)
    assert(columnCounts.email_suppressions === 3, `Expected 3 email_suppressions columns; found ${columnCounts.email_suppressions ?? 0}`)
    assert(triggers.rowCount === 2, "Both updated_at triggers must be present")
    assert(indexes.rowCount === 5, "All five required lead indexes must be present")
    assert(constraints.rows.some((row) => row.constraint_name === "leads_usha_status_check"), "Marketplace status parity constraint is missing")
    assert(migrations.rows[0]?.count === 1, `Expected one applied Drizzle migration; found ${migrations.rows[0]?.count ?? 0}`)

    const settingValues = Object.fromEntries(settings.rows.map((row) => [row.key, row.value]))
    assert(settingValues.projections_enabled === true, "projections_enabled must default to true")
    assert(settingValues.lead_intake_paused === false, "lead_intake_paused must default to false")

    console.log(JSON.stringify({
      ok: true,
      tables: expectedTables.length,
      applicationColumns: columnCounts,
      updatedAtTriggers: triggers.rowCount,
      leadIndexes: indexes.rowCount,
      appliedMigrations: migrations.rows[0].count,
      settings: settingValues,
    }, null, 2))
  } finally {
    await client.end()
    clearTimeout(hardTimeout)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
