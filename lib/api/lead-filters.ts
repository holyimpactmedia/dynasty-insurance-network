import { z } from "zod"
import type { LeadFilters } from "@/lib/data/types"

const querySchema = z.object({
  page: z.coerce.number().int().min(0).default(0),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().max(120).optional(),
  funnel: z.string().max(50).optional(),
  marketplaceStatus: z.enum(["all", "none", "pending", "sent", "failed"]).optional(),
  minScore: z.coerce.number().int().min(0).max(100).optional(),
})

export function parseLeadQuery(searchParams: URLSearchParams): {
  page: number
  pageSize: number
  filters: LeadFilters
} {
  const parsed = querySchema.parse(Object.fromEntries(searchParams.entries()))
  return {
    page: parsed.page,
    pageSize: parsed.pageSize,
    filters: {
      search: parsed.search,
      funnel: parsed.funnel,
      marketplaceStatus: parsed.marketplaceStatus,
      minScore: parsed.minScore,
    },
  }
}
