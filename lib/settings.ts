import { getPlatformStore } from "@/lib/data/store"

/**
 * App-wide feature flags stored in the `app_settings` table and controlled by
 * the super admin from the Settings panel. Writes happen only from the
 * super-admin Settings page; reads happen server side.
 *
 * Every getter fails open to a safe default so a missing row or unconfigured
 * database never hard-breaks the dashboard.
 */

export const SETTING_KEYS = {
  projectionsEnabled: "projections_enabled",
} as const

async function readSetting(key: string): Promise<unknown> {
  try {
    return await (await getPlatformStore()).getSetting(key)
  } catch {
    return undefined
  }
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value
  if (value === "true") return true
  if (value === "false") return false
  return fallback
}

/** Whether the Projections dashboard is enabled. Defaults to true. */
export async function getProjectionsEnabled(): Promise<boolean> {
  return asBoolean(await readSetting(SETTING_KEYS.projectionsEnabled), true)
}
