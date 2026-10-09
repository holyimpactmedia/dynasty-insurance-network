"use client"

import { useState } from "react"
import { UserPlus, RefreshCw, CircleAlert, MailCheck, MailWarning } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

export interface PortalUser {
  id: string
  email: string
  name: string
  role: string | null
  emailVerified: boolean
  createdAt: string
}

type CreateResult = {
  email: string
  emailed: boolean
}

export default function UsersPanel({ initialUsers }: { initialUsers: PortalUser[] }) {
  const [users, setUsers] = useState<PortalUser[]>(initialUsers)
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState<"admin" | "superadmin">("admin")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CreateResult | null>(null)

  const refresh = async () => {
    const res = await fetch("/api/admin/users", { cache: "no-store" })
    if (res.ok) {
      const data = await res.json()
      setUsers(data.users ?? [])
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, role }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Unable to create the user.")
        return
      }
      setResult({ email: email.trim().toLowerCase(), emailed: Boolean(data.emailed) })
      setEmail("")
      setName("")
      setRole("admin")
      await refresh()
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const roleBadge = (r: string | null) =>
    r === "superadmin"
      ? "bg-red-100 text-red-800 border-red-200"
      : r === "admin"
        ? "bg-purple-100 text-purple-800 border-purple-200"
        : "bg-blue-100 text-blue-800 border-blue-200"

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Invite a user</h2>
        <p className="text-xs text-gray-500 mb-4">
          They get an email with a one-time link to choose their own password. No password is shown here or shared by you.
        </p>

        <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="nu-name">Full name</Label>
            <Input id="nu-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sam Lamy" maxLength={100} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nu-email">Email</Label>
            <Input id="nu-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sam@example.com" maxLength={254} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nu-role">Role</Label>
            <select
              id="nu-role"
              value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "superadmin")}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            >
              <option value="admin">Admin: view leads and dashboard</option>
              <option value="superadmin">Super admin: full control, can manage users</option>
            </select>
          </div>

          <div className="sm:col-span-2 flex items-center gap-3">
            <Button type="submit" disabled={submitting}>
              <UserPlus className="w-4 h-4 mr-2" />
              {submitting ? "Sending invite..." : "Create and send invite"}
            </Button>
            {error && (
              <span className="flex items-center gap-1.5 text-sm text-red-600">
                <CircleAlert className="w-4 h-4" /> {error}
              </span>
            )}
          </div>
        </form>

        {result &&
          (result.emailed ? (
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-2 text-green-800 font-semibold text-sm">
                <MailCheck className="w-4 h-4" /> Invite sent to <span className="font-mono">{result.email}</span>
              </div>
              <p className="mt-1 text-sm text-gray-700">
                The link works once and expires in 1 hour. If it expires, they can use Forgot password on the sign-in page.
              </p>
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
                <MailWarning className="w-4 h-4" /> Account created, but the invite email was not sent
              </div>
              <p className="mt-1 text-sm text-gray-700">
                Ask <span className="font-mono">{result.email}</span> to open the sign-in page and choose Forgot password to set their password.
              </p>
            </div>
          ))}
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Dashboard users ({users.length})</h2>
          <Button type="button" variant="ghost" size="sm" onClick={refresh}>
            <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-400 border-b border-gray-100">
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Email</th>
                <th className="py-2 pr-4 font-medium">Role</th>
                <th className="py-2 pr-4 font-medium">Verified</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-2.5 pr-4 text-gray-900">{u.name}</td>
                  <td className="py-2.5 pr-4 text-gray-600">{u.email}</td>
                  <td className="py-2.5 pr-4">
                    <Badge className={roleBadge(u.role)}>{u.role ?? "user"}</Badge>
                  </td>
                  <td className="py-2.5 pr-4 text-gray-500">{u.emailVerified ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
