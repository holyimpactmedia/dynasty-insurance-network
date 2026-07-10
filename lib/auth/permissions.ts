import { createAccessControl } from "better-auth/plugins/access"
import { defaultStatements } from "better-auth/plugins/admin/access"

const statement = {
  ...defaultStatements,
  dashboard: ["read"],
  settings: ["write"],
} as const

export const accessControl = createAccessControl(statement)

export const userRole = accessControl.newRole({
  user: [],
  session: [],
  dashboard: [],
  settings: [],
})

export const adminRole = accessControl.newRole({
  user: [],
  session: [],
  dashboard: ["read"],
  settings: [],
})

export const superadminRole = accessControl.newRole({
  user: [],
  session: [],
  dashboard: ["read"],
  settings: ["write"],
})

export const authRoles = {
  user: userRole,
  admin: adminRole,
  superadmin: superadminRole,
}

export type DynastyRole = keyof typeof authRoles
export const ADMIN_ROLES: DynastyRole[] = ["admin", "superadmin"]
