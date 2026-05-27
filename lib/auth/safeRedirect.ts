/**
 * Validates a post-auth `redirectTo` value so it cannot send the user
 * off-site (open-redirect / phishing handoff).
 *
 * Only a same-origin *relative* path is allowed: it must start with a single
 * "/" and must not start with "//" or "/\" (which browsers treat as
 * protocol-relative or absolute). Anything else falls back to a safe default.
 */
export function safeRedirect(
  target: string | null | undefined,
  fallback = "/dashboard/admin",
): string {
  if (!target || typeof target !== "string") return fallback
  if (!target.startsWith("/")) return fallback
  if (target.startsWith("//") || target.startsWith("/\\")) return fallback
  // Reject control characters and whitespace tricks (e.g. "/\tevil").
  if (/[\x00-\x1f]/.test(target)) return fallback
  return target
}
