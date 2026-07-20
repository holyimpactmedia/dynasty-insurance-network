import { revalidatePath } from "next/cache"
import { ShieldCheck } from "lucide-react"
import { SetupRequired } from "@/components/dashboard/SetupRequired"
import { requireSuperAdmin } from "@/lib/auth/requireAdmin"
import { getProjectionsEnabled, SETTING_KEYS } from "@/lib/settings"
import SettingsPanel from "@/components/dashboard/SettingsPanel"
import { getPlatformStore } from "@/lib/data/store"
import { isPlatformConfigured } from "@/lib/platform/provider"

// Settings is super-admin only: this is the single panel where platform-wide
// feature flags are toggled. The gate runs before any data is read.
export default async function SettingsPage() {
  if (!isPlatformConfigured()) return <SetupRequired page="settings" />

  const { user, profile } = await requireSuperAdmin()
  const projectionsEnabled = await getProjectionsEnabled()

  // Server action: re-check super admin before the provider-neutral write.
  async function updateProjectionsEnabled(enabled: boolean) {
    "use server"
    await requireSuperAdmin()
    await (await getPlatformStore()).setSetting(SETTING_KEYS.projectionsEnabled, enabled)
    // The flag drives the nav (layout) and the Projections route guard.
    revalidatePath("/dashboard", "layout")
  }

  const adminName =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    user.email?.split("@")[0] ||
    "Super Admin"

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500">
            Super admin controls · signed in as {adminName}
          </p>
        </div>
      </div>

      <SettingsPanel
        projectionsEnabled={projectionsEnabled}
        updateProjectionsEnabled={updateProjectionsEnabled}
      />
    </div>
  )
}
