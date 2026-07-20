import { fromZonedTime, toZonedTime } from "date-fns-tz"
import { startOfDay, startOfMonth } from "date-fns"

/**
 * The business timezone. All "today" / "this month" boundaries in the
 * dashboard are computed in this zone, then converted to UTC for the database
 * filters — otherwise counts bucket on the server's UTC day, which is wrong
 * for an operator on the US East Coast.
 *
 * Dashboard aggregate queries in both providers bucket in this
 * same zone. Keep the two in sync.
 */
export const BUSINESS_TZ = "America/New_York"

/** Start of the current day in BUSINESS_TZ, as a UTC ISO string. */
export function startOfTodayUtc(now: Date = new Date()): string {
  const zoned = toZonedTime(now, BUSINESS_TZ)
  return fromZonedTime(startOfDay(zoned), BUSINESS_TZ).toISOString()
}

/** Start of the current month in BUSINESS_TZ, as a UTC ISO string. */
export function startOfMonthUtc(now: Date = new Date()): string {
  const zoned = toZonedTime(now, BUSINESS_TZ)
  return fromZonedTime(startOfMonth(zoned), BUSINESS_TZ).toISOString()
}
