import type { PlatformStore } from "./types"

// Neon is the only platform store.
export async function getPlatformStore(): Promise<PlatformStore> {
  return (await import("./neon-store")).neonStore
}
