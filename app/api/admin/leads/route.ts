import { NextRequest, NextResponse } from "next/server"
import { ZodError } from "zod"
import { requireAdminApi } from "@/lib/auth/requireAdmin"
import { parseLeadQuery } from "@/lib/api/lead-filters"
import { getPlatformStore } from "@/lib/data/store"

export async function GET(request: NextRequest) {
  const access = await requireAdminApi()
  if (!access.ok) return access.response
  try {
    const { page, pageSize, filters } = parseLeadQuery(request.nextUrl.searchParams)
    const result = await (await getPlatformStore()).listLeads(filters, page, pageSize)
    return NextResponse.json({ ...result, page, pageSize, refreshedAt: new Date().toISOString() }, {
      headers: { "Cache-Control": "private, no-store" },
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 })
    }
    console.error("[admin/leads] query failed", error)
    return NextResponse.json({ error: "Unable to load leads" }, { status: 500 })
  }
}
