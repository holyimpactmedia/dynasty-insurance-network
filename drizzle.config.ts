import { defineConfig } from "drizzle-kit"

if (!process.env.DATABASE_URL_DIRECT) {
  throw new Error("DATABASE_URL_DIRECT is required for Drizzle migrations")
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema/index.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL_DIRECT },
  strict: true,
  verbose: true,
})
