import { getPlatformProvider } from "@/lib/platform/provider"
import type { PlatformStore } from "./types"

export async function getPlatformStore(): Promise<PlatformStore> {
  if (getPlatformProvider() === "neon") {
    return (await import("./neon-store")).neonStore
  }
  return (await import("./supabase-store")).supabaseStore
}
