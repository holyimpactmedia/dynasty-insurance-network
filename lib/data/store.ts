import type { PlatformStore } from "./types"

// Neon is the only platform store. The Supabase store was removed (2026-07).
export async function getPlatformStore(): Promise<PlatformStore> {
  return (await import("./neon-store")).neonStore
}
