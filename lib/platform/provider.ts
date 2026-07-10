export type PlatformProvider = "supabase" | "neon"

/** One temporary switch controls both persistence and authentication. */
export function getPlatformProvider(): PlatformProvider {
  return process.env.PLATFORM_PROVIDER === "neon" ? "neon" : "supabase"
}

export function isPlatformConfigured(provider = getPlatformProvider()): boolean {
  if (provider === "neon") {
    return Boolean(
      process.env.DATABASE_URL &&
      process.env.BETTER_AUTH_SECRET &&
      (process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_SITE_URL),
    )
  }
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  )
}
