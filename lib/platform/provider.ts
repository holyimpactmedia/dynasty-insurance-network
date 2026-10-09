// Neon Postgres + Better Auth is the only platform for the Dynasty site.

/**
 * Placeholders that let lib/auth/server.ts load with no environment (local dev,
 * tests, `next build`). Both values are public in this repo, so neither is ever
 * accepted as real configuration, and a deployed runtime never falls back to them.
 */
export const DORMANT_SECRET = "dormant-secret-not-for-production"
export const DORMANT_DATABASE_URL = "postgresql://dormant:dormant@127.0.0.1:5432/dormant"

const BUILD_PHASE = "phase-production-build"

export interface PlatformEnv {
  DATABASE_URL?: string
  BETTER_AUTH_SECRET?: string
  BETTER_AUTH_URL?: string
  NEXT_PUBLIC_SITE_URL?: string
  VERCEL_ENV?: string
  NEXT_PHASE?: string
}

/** Vercel production or preview. Local dev, CI and laptop builds are not deployed. */
export function isDeployedEnv(env: PlatformEnv = process.env as PlatformEnv): boolean {
  return env.VERCEL_ENV === "production" || env.VERCEL_ENV === "preview"
}

export function isPlatformConfigured(env: PlatformEnv = process.env as PlatformEnv): boolean {
  const { DATABASE_URL, BETTER_AUTH_SECRET } = env
  if (!DATABASE_URL || !BETTER_AUTH_SECRET) return false
  if (!(env.BETTER_AUTH_URL || env.NEXT_PUBLIC_SITE_URL)) return false
  // A placeholder pasted into the environment is not configuration.
  if (BETTER_AUTH_SECRET === DORMANT_SECRET || DATABASE_URL === DORMANT_DATABASE_URL) return false
  return true
}

function dormantFallback(env: PlatformEnv, name: string, placeholder: string): string {
  if (isDeployedEnv(env) && env.NEXT_PHASE !== BUILD_PHASE) {
    throw new Error(`${name} is not set in this deployed environment; refusing to start auth with a placeholder.`)
  }
  return placeholder
}

export function resolveAuthSecret(env: PlatformEnv = process.env as PlatformEnv): string {
  const value = env.BETTER_AUTH_SECRET
  if (value && value !== DORMANT_SECRET) return value
  return dormantFallback(env, "BETTER_AUTH_SECRET", DORMANT_SECRET)
}

export function resolveDatabaseUrl(env: PlatformEnv = process.env as PlatformEnv): string {
  const value = env.DATABASE_URL
  if (value && value !== DORMANT_DATABASE_URL) return value
  return dormantFallback(env, "DATABASE_URL", DORMANT_DATABASE_URL)
}
