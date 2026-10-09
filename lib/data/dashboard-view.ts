import { format } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import { BUSINESS_TZ } from "@/lib/time/ranges"
import type { DailyRow } from "./types"

export function buildSevenDayChart(rows: DailyRow[], now = new Date()) {
  const dailyMap = new Map(rows.map((row) => [row.day, Number(row.count)]))
  const zonedNow = toZonedTime(now, BUSINESS_TZ)
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(zonedNow)
    day.setDate(day.getDate() - (6 - index))
    return {
      day: format(day, "EEE"),
      leads: dailyMap.get(format(day, "yyyy-MM-dd")) ?? 0,
    }
  })
}
