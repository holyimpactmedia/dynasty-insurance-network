import { NextRequest, NextResponse } from "next/server"
import { ZodError } from "zod"
import { requireAdminApi } from "@/lib/auth/requireAdmin"
import { parseLeadQuery } from "@/lib/api/lead-filters"
import { getPlatformStore } from "@/lib/data/store"
import { toCsv } from "@/lib/csv"
import { FUNNEL_LABELS } from "@/lib/types/lead"

export async function GET(request: NextRequest) {
  const access = await requireAdminApi()
  if (!access.ok) return access.response
  try {
    const { filters } = parseLeadQuery(request.nextUrl.searchParams)
    const leads = await (await getPlatformStore()).listAllLeads(filters)
    const rows = leads.map((lead) => [
      lead.reference_number, lead.first_name, lead.last_name, lead.email,
      lead.phone ?? "", lead.age ?? "", lead.state ?? "",
      FUNNEL_LABELS[lead.funnel_type ?? ""] ?? lead.funnel_type ?? "",
      lead.income_range ?? "", lead.household_size ?? "", lead.qualifying_event ?? "",
      lead.ai_score ?? "", lead.usha_status ?? "", lead.tcpa_consent ? "yes" : "no",
      lead.utm_source ?? "", lead.utm_campaign ?? "", new Date(lead.created_at).toISOString(),
    ])
    const csv = toCsv([
      "Reference", "First Name", "Last Name", "Email", "Phone", "Age", "State",
      "Funnel", "Income Range", "Household Size", "Qualifying Event", "AI Score",
      "Marketplace Status", "TCPA Consent", "UTM Source", "UTM Campaign", "Submitted At",
    ], rows)
    const filename = `dynasty-leads-${new Date().toISOString().slice(0, 10)}.csv`
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    })
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 })
    console.error("[admin/export] export failed", error)
    return NextResponse.json({ error: "Unable to export leads" }, { status: 500 })
  }
}
