// Neon Postgres + Better Auth is the only platform. The former Supabase
// provider and the PLATFORM_PROVIDER runtime switch were removed (2026-07).
export function isPlatformConfigured(): boolean {
  return Boolean(
    process.env.DATABASE_URL &&
      process.env.BETTER_AUTH_SECRET &&
      (process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_SITE_URL),
  )
}
