interface AuthEnvironment {
  AUTH_BOOTSTRAP_MODE?: string
  NODE_ENV?: string
}

/**
 * Bootstrap mode is intentionally unavailable inside a deployed production
 * server. Operators run the one-time command locally with production database
 * credentials and AUTH_BOOTSTRAP_MODE=true.
 */
export function isAuthBootstrapMode(env: AuthEnvironment = process.env): boolean {
  return env.AUTH_BOOTSTRAP_MODE === "true" && env.NODE_ENV !== "production"
}

export function isPublicSignupDisabled(env: AuthEnvironment = process.env): boolean {
  return !isAuthBootstrapMode(env)
}
