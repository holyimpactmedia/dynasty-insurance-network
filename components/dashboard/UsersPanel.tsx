"use client"

import { useState } from "react"
import { UserPlus, RefreshCw, Copy, Check, CircleAlert, MailCheck } from "lucide-react"
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
  password: string
  emailed: boolean
}

// Readable temp password: no ambiguous chars (0/O, 1/l/I), always mixes classes.
function generatePassword(): string {
  const upper = "ABCDEFGHJKMNPQRSTUVWXYZ"
  const lower = "abcdefghijkmnpqrstuvwxyz"
  const digit = "23456789"
  const all = upper + lower + digit
  const pick = (set: string) => set[Math.floor(Math.random() * set.length)]
  const base = [pick(upper), pick(lower), pick(digit), pick(digit)]
  for (let i = 0; i < 8; i++) base.push(pick(all))
  // Shuffle so the guaranteed classes are not always in front.
  for (let i = base.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[base[i], base[j]] = [base[j], base[i]]
  }
  return base.join("")
}

export default function UsersPanel({ initialUsers }: { initialUsers: PortalUser[] }) {
  const [users, setUsers] = useState<PortalUser[]>(initialUsers)
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState<"admin" | "superadmin">("admin")
  const [password, setPassword] = useState(generatePassword())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CreateResult | null>(null)
  const [copied, setCopied] = useState(false)

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
        body: JSON.stringify({ email, name, role, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Unable to create the user.")
        return
      }
      setResult({ email: email.trim().toLowerCase(), password, emailed: Boolean(data.emailed) })
      setEmail("")
      setName("")
      setRole("admin")
      setPassword(generatePassword())
      await refresh()
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const copyCreds = async () => {
    if (!result) return
    await navigator.clipboard.writeText(
      `Union Private Healthcare portal\nEmail: ${result.email}\nTemporary password: ${result.password}`,
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const roleBadge = (r: string | null) =>
    r === "superadmin"
      ? "bg-red-100 text-red-800 border-red-200"
      : r === "admin"
        ? "bg-purple-100 text-purple-800 border-purple-200"
        : "bg-blue-100 text-blue-800 border-blue-200"

  return (
    <div className="space-y-6">
      {/* Create user */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Create a user</h2>
        <p className="text-xs text-gray-500 mb-4">
          The new user can sign in immediately with the temporary password. Share it securely; they should change it after first sign-in.
        </p>

        <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="nu-name">Full name</Label>
            <Input id="nu-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sam Lamy" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nu-email">Email</Label>
            <Input id="nu-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sam@example.com" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nu-role">Role</Label>
            <select
              id="nu-role"
              value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "superadmin")}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            >
              <option value="admin">Admin — view leads &amp; dashboard</option>
              <option value="superadmin">Super admin — full control, can manage users</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nu-pass">Temporary password</Label>
            <div className="flex gap-2">
              <Input id="nu-pass" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required className="font-mono" />
              <Button type="button" variant="outline" size="icon" title="Generate a new password" onClick={() => setPassword(generatePassword())}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[11px] text-gray-400">At least 8 characters.</p>
          </div>

          <div className="sm:col-span-2 flex items-center gap-3">
            <Button type="submit" disabled={submitting}>
              <UserPlus className="w-4 h-4 mr-2" />
              {submitting ? "Creating..." : "Create user"}
            </Button>
            {error && (
              <span className="flex items-center gap-1.5 text-sm text-red-600">
                <CircleAlert className="w-4 h-4" /> {error}
              </span>
            )}
          </div>
        </form>

        {result && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-2 text-green-800 font-semibold text-sm">
              <Check className="w-4 h-4" /> User created
            </div>
            <div className="mt-2 text-sm text-gray-700 space-y-1">
              <div><span className="text-gray-500">Email:</span> <span className="font-mono">{result.email}</span></div>
              <div><span className="text-gray-500">Temporary password:</span> <span className="font-mono">{result.password}</span></div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 pt-1">
                <MailCheck className="w-3.5 h-3.5" />
                {result.emailed
                  ? "A welcome email with the login link was sent."
                  : "Welcome email could not be sent — share the login link and password manually."}
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={copyCreds}>
              {copied ? <Check className="w-4 h-4 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
              {copied ? "Copied" : "Copy credentials"}
            </Button>
            <p className="mt-2 text-[11px] text-amber-700">
              This password is shown once. Copy it now; you cannot retrieve it later.
            </p>
          </div>
        )}
      </Card>

      {/* Existing users */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Portal users ({users.length})</h2>
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
