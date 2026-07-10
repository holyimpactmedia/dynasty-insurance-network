export function formatFromAddress(
  configured: string | undefined,
  displayName: string,
  fallbackEmail: string,
): string {
  const value = configured?.trim() || fallbackEmail
  return value.includes("<") && value.endsWith(">") ? value : `${displayName} <${value}>`
}
