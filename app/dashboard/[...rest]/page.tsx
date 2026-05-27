import { redirect } from "next/navigation"

// Any unknown /dashboard/* path (e.g. the removed /dashboard/agent and
// /dashboard/routing pages, or stale bookmarks) recovers to the lead CRM
// instead of a bare 404. Real routes (/dashboard/admin, /dashboard/projections)
// take precedence over this catch-all.
export default function DashboardCatchAll() {
  redirect("/dashboard/admin")
}
