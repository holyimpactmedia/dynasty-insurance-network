import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DashboardNav from "@/components/dashboard/DashboardNav"
import { SetupRequired } from "@/components/dashboard/SetupRequired"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  if (!supabase) return <SetupRequired page="dashboard" />

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user profile with role: tolerate missing `profiles` table
  let profile: { role?: string; first_name?: string; last_name?: string } | null = null
  try {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
    profile = data
  } catch {
    profile = null
  }

  // Fall back to Supabase auth metadata when no profiles row exists
  const metadata = (user.user_metadata ?? {}) as {
    role?: string
    full_name?: string
    first_name?: string
    last_name?: string
  }

  const userRole = profile?.role || metadata.role || "agent"
  const userName = profile?.first_name && profile?.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : metadata.full_name
      || (metadata.first_name && metadata.last_name ? `${metadata.first_name} ${metadata.last_name}` : null)
      || user.email?.split("@")[0]
      || "User"

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav
        userRole={userRole}
        userName={userName}
        userEmail={user.email || ""}
      />
      {children}
    </div>
  )
}
