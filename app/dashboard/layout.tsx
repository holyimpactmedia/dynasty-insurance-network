import DashboardNav from "@/components/dashboard/DashboardNav"
import { SetupRequired } from "@/components/dashboard/SetupRequired"
import { requireAdmin } from "@/lib/auth/requireAdmin"
import { isPlatformConfigured } from "@/lib/platform/provider"
import { getProjectionsEnabled } from "@/lib/settings"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Fail closed: a missing DATABASE_URL, BETTER_AUTH_SECRET or site URL renders
  // the setup screen instead of a login that cannot work.
  if (!isPlatformConfigured()) return <SetupRequired page="dashboard" />

  // Authoritative gate: authenticated AND an admin/superadmin role on the
  // Better Auth session. Redirects non-admins; never returns otherwise.
  const { user, profile } = await requireAdmin()
  const projectionsEnabled = await getProjectionsEnabled()

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
        projectionsEnabled={projectionsEnabled}
      />
      {children}
    </div>
  )
}
