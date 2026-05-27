import { createClient } from "@/lib/supabase/server"
import DashboardNav from "@/components/dashboard/DashboardNav"
import { SetupRequired } from "@/components/dashboard/SetupRequired"
import { requireAdmin } from "@/lib/auth/requireAdmin"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Graceful empty state when Supabase env vars are missing.
  const supabase = await createClient()
  if (!supabase) return <SetupRequired page="dashboard" />

  // Authoritative gate: authenticated AND role 'admin' in the profiles table.
  // Redirects non-admins; never returns otherwise.
  const { user, profile } = await requireAdmin()

  const userName =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    user.email?.split("@")[0] ||
    "Admin"

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav
        userRole={profile.role}
        userName={userName}
        userEmail={user.email ?? ""}
      />
      {children}
    </div>
  )
}
