import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "@/lib/db/schema"

type DynastyDatabase = NodePgDatabase<typeof schema>
const globalForDatabase = globalThis as unknown as {
  dynastyPool?: Pool
  dynastyDb?: DynastyDatabase
}

export function getNeonPool(): Pool | null {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) return null
  if (!globalForDatabase.dynastyPool) {
    globalForDatabase.dynastyPool = new Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
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
