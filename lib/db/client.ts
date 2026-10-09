import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "@/lib/db/schema"
import { DORMANT_DATABASE_URL } from "@/lib/platform/provider"

type DynastyDatabase = NodePgDatabase<typeof schema>
const globalForDatabase = globalThis as unknown as {
  dynastyPool?: Pool
  dynastyDb?: DynastyDatabase
}

export function getNeonPool(): Pool | null {
  const connectionString = process.env.DATABASE_URL
  // The public placeholder is never a real database (see lib/platform/provider.ts).
  if (!connectionString || connectionString === DORMANT_DATABASE_URL) return null
  if (!globalForDatabase.dynastyPool) {
    globalForDatabase.dynastyPool = new Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      // Client-side cap on any single query, so a hung connection cannot hold a
      // request until the function time limit. It does not depend on the Neon
      // pooler honoring a statement_timeout.
      query_timeout: 8_000,
    })
    // An idle client whose socket the server closed emits "error" on the pool.
    // Without a listener that is an uncaught exception that can crash the
    // function instance. pg already drops the broken client; just log it.
    globalForDatabase.dynastyPool.on("error", (error) => {
      console.error("[db] idle client error", error.message)
    })
  }
  return globalForDatabase.dynastyPool
}

export function getNeonDb(): DynastyDatabase | null {
  if (globalForDatabase.dynastyDb) return globalForDatabase.dynastyDb
  const pool = getNeonPool()
  if (!pool) return null
  globalForDatabase.dynastyDb = drizzle(pool, { schema })
  return globalForDatabase.dynastyDb
}

export function requireNeonDb(): DynastyDatabase {
  const db = getNeonDb()
  if (!db) throw new Error("DATABASE_URL is not configured")
  return db
}
