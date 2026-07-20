import { Users } from "lucide-react"
import { SetupRequired } from "@/components/dashboard/SetupRequired"
import { requireSuperAdmin } from "@/lib/auth/requireAdmin"
import { isPlatformConfigured } from "@/lib/platform/provider"
import { requireNeonDb } from "@/lib/db/client"
import { user as userTable } from "@/lib/db/schema/auth"
import UsersPanel, { type PortalUser } from "@/components/dashboard/UsersPanel"

// User management is super-admin only, backed by the Better Auth admin plugin.
// The gate runs before any data is read.
export default async function UsersPage() {
  if (!isPlatformConfigured()) return <SetupRequired page="users" />

  const { profile } = await requireSuperAdmin()

  const db = requireNeonDb()
  const rows = await db
    .select({
      id: userTable.id,
      email: userTable.email,
      name: userTable.name,
      role: userTable.role,
      emailVerified: userTable.emailVerified,
      createdAt: userTable.createdAt,
    })
    .from(userTable)
    .orderBy(userTable.createdAt)
  const initialUsers: PortalUser[] = rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))

  const adminName =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    profile.email?.split("@")[0] ||
    "Super Admin"

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-navy/10 flex items-center justify-center">
          <Users className="w-5 h-5 text-navy" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500">
            Create and manage portal access · signed in as {adminName}
          </p>
        </div>
      </div>

      <UsersPanel initialUsers={initialUsers} />
    </div>
  )
}
