/**
 * Best-effort in-memory sliding-window rate limiter.
 *
 * Scope/limits: state lives in a single process. Under Vercel Fluid Compute,
 * instances are reused so a burst from one IP usually lands on a warm instance
 * and is caught; it is NOT a hard distributed guarantee. It is the first line
 * of defense for `/api/leads` (a public endpoint that spends money per call).
 * The DB-level duplicate-email check in the route is the reliable backstop.
 */

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

export interface RateLimitOptions {
  /** Max requests allowed per window. */
  max?: number
  /** Window length in milliseconds. */
  windowMs?: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  /** Unix ms at which the current window resets. */
  resetAt: number
}

const DEFAULT_MAX = 8
const DEFAULT_WINDOW_MS = 10 * 60 * 1000 // 10 minutes

/** Sweeps expired buckets so a long-lived process does not grow unbounded. */
function sweep(now: number): void {
  if (buckets.size < 5000) return
  for (const [key, b] of buckets) {
    if (b.resetAt < now) buckets.delete(key)
  }
}

export function checkRateLimit(
  key: string,
  options: RateLimitOptions = {},
): RateLimitResult {
  const max = options.max ?? DEFAULT_MAX
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS
  const now = Date.now()
  sweep(now)

  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowMs
    buckets.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: max - 1, resetAt }
  }

  bucket.count += 1
  if (bucket.count > max) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt }
  }
  return { allowed: true, remaining: max - bucket.count, resetAt: bucket.resetAt }
}

/** Test helper: clears all rate-limit state. */
export function __resetRateLimit(): void {
  buckets.clear()
}
