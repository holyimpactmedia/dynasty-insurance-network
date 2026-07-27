import { createHash } from "node:crypto"

// Meta Advanced Matching requires PII to be normalized, then SHA-256 hashed,
// before it ever leaves our server. Raw email/phone/name never go to Meta.
// Normalization rules follow Meta's customer-information parameters spec.

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex")
}

export function hashEmail(email?: string | null): string | undefined {
  if (!email) return undefined
  const n = email.trim().toLowerCase()
  return n ? sha256(n) : undefined
}

export function hashPhone(phone?: string | null): string | undefined {
  if (!phone) return undefined
  // Digits only, with country code. Assume US (+1) for a bare 10-digit number.
  let digits = phone.replace(/\D/g, "")
  if (!digits) return undefined
  if (digits.length === 10) digits = "1" + digits
  return sha256(digits)
}

export function hashName(name?: string | null): string | undefined {
  if (!name) return undefined
  const n = name.trim().toLowerCase()
  return n ? sha256(n) : undefined
}

export function hashZip(zip?: string | null): string | undefined {
  if (!zip) return undefined
  const n = zip.trim().toLowerCase().slice(0, 5)
  return n ? sha256(n) : undefined
}

// 2-letter ISO country, lowercase, hashed. We only serve the US.
export function hashCountry(country = "US"): string | undefined {
  const n = country.trim().toLowerCase().slice(0, 2)
  return n ? sha256(n) : undefined
}
