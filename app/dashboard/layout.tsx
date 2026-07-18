import DashboardNav from "@/components/dashboard/DashboardNav"
import { SetupRequired } from "@/components/dashboard/SetupRequired"
import { requireAdmin } from "@/lib/auth/requireAdmin"
import { getProjectionsEnabled } from "@/lib/settings"
import { getPlatformProvider, isPlatformConfigured } from "@/lib/platform/provider"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const platformProvider = getPlatformProvider()
  if (!isPlatformConfigured(platformProvider)) {
    return <SetupRequired page="dashboard" provider={platformProvider} />
  }

  // Authoritative gate: authenticated AND role 'admin' in the profiles table.
  // Redirects non-admins; never returns otherwise.
  const { user, profile } = await requireAdmin()
  const projectionsEnabled = await getProjectionsEnabled()

  const userName =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    user.email?.split("@")[0] ||
    "Admin"

  return (
    <div className="min-h-screen bg-surface">
      <DashboardNav
        userRole={profile.role}
        userName={userName}
        userEmail={user.email ?? ""}
        projectionsEnabled={projectionsEnabled}
        platformProvider={platformProvider}
      />
      {children}
    </div>
  )
}
