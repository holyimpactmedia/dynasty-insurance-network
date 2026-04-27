"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import {
  LayoutDashboard,
  LogOut,
  ChevronDown,
  BarChart3,
} from "lucide-react"

// Unused agent/routing imports kept in original file: removed here since
// the new flow routes leads to USHA Marketplace, not internal agents.

interface DashboardNavProps {
  userRole: string
  userName: string
  userEmail: string
}

export default function DashboardNav({ userRole, userName, userEmail }: DashboardNavProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    setIsLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  // Admin-only nav: agent and routing items removed (USHA Marketplace handles lead distribution)
  const navItems = [
    {
      href: "/dashboard/admin",
      label: "Lead CRM",
      icon: LayoutDashboard,
      roles: ["admin", "superadmin"],
    },
    {
      href: "/dashboard/projections",
      label: "Projections",
      icon: BarChart3,
      roles: ["admin", "superadmin"],
    },
  ]

  const filteredNavItems = navItems.filter(item => item.roles.includes(userRole))

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "superadmin":
        return "bg-red-100 text-red-800 border-red-200"
      case "admin":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-blue-100 text-blue-800 border-blue-200"
    }
  }

  const getInitials = (name: string) =>
    name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/">
              <Image
                src="/images/logo.avif"
                alt="Dynasty"
                width={160}
                height={40}
                className="h-10 w-auto"
              />
            </Link>
            <nav className="hidden md:flex items-center gap-2">
              {filteredNavItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={isActive ? "bg-[#1e3a8a] hover:bg-[#1e3a8a]/90" : ""}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Button>
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3">
                  <div className="hidden md:block text-right">
                    <div className="font-semibold text-gray-900">{userName}</div>
                    <div className="text-xs text-gray-500">{userEmail}</div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#E8C976] flex items-center justify-center text-white font-bold">
                    {getInitials(userName)}
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex items-center gap-2">
                    <span>My Account</span>
                    <Badge className={getRoleBadgeColor(userRole)}>
                      {userRole}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/admin" className="flex items-center">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Lead CRM
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/projections" className="flex items-center">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Projections
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="text-red-600 focus:text-red-600"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {isLoggingOut ? "Logging out..." : "Log out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
