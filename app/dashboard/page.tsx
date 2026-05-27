import { redirect } from "next/navigation"

// Bare /dashboard has no content of its own — send it to the lead CRM.
export default function DashboardIndex() {
  redirect("/dashboard/admin")
}
