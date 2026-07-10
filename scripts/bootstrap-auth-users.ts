import { randomBytes } from "node:crypto"
import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { eq } from "drizzle-orm"
import { isAuthBootstrapMode } from "@/lib/auth/bootstrap"

type BootstrapRole = "admin" | "superadmin"
interface BootstrapUser {
  email: string
  name: string
  role: BootstrapRole
}

function validate(value: unknown): BootstrapUser[] {
  if (!Array.isArray(value)) throw new Error("Bootstrap file must contain a JSON array")
  return value.map((item, index) => {
    if (!item || typeof item !== "object") throw new Error(`Invalid user at index ${index}`)
    const row = item as Record<string, unknown>
    const email = String(row.email || "").trim().toLowerCase()
    const name = String(row.name || "").trim()
    const role = row.role
    if (!/^\S+@\S+\.\S+$/.test(email) || !name || (role !== "admin" && role !== "superadmin")) {
      throw new Error(`Invalid user at index ${index}; expected email, name, and admin|superadmin role`)
    }
    return { email, name, role }
  })
}

async function main() {
  if (!isAuthBootstrapMode()) {
    throw new Error("Refusing to run: set AUTH_BOOTSTRAP_MODE=true outside a production server for this one-time command")
  }
  if (!process.env.DATABASE_URL || !process.env.BETTER_AUTH_SECRET) {
    throw new Error("DATABASE_URL and BETTER_AUTH_SECRET are required")
  }
  const file = process.env.AUTH_BOOTSTRAP_USERS_FILE
  if (!file) throw new Error("AUTH_BOOTSTRAP_USERS_FILE must point to a JSON file outside Git")

  const users = validate(JSON.parse(await readFile(resolve(file), "utf8")))
  const [{ auth }, { requireNeonDb }, schema] = await Promise.all([
    import("@/lib/auth/server"),
    import("@/lib/db/client"),
    import("@/lib/db/schema/auth"),
  ])
  const db = requireNeonDb()
  const resetDestination = `${process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`

  for (const entry of users) {
    const [existing] = await db.select({ id: schema.user.id }).from(schema.user)
      .where(eq(schema.user.email, entry.email)).limit(1)
    if (!existing) {
      await auth.api.signUpEmail({
        body: {
          email: entry.email,
          name: entry.name,
          password: randomBytes(32).toString("base64url"),
        },
      })
    }
    await db.update(schema.user).set({
      name: entry.name,
      role: entry.role,
      emailVerified: true,
      updatedAt: new Date(),
    }).where(eq(schema.user.email, entry.email))

    await auth.api.requestPasswordReset({
      body: { email: entry.email, redirectTo: resetDestination },
    })
    process.stdout.write(`Bootstrapped ${entry.email} as ${entry.role}; reset email requested.\n`)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
