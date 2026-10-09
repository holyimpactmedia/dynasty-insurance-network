// Creates verified test accounts on a NON-production Neon branch, for local
// verification only. Refuses to run unless TEST_USERS_BRANCH=preview is set and
// the process is not a deployed runtime. Credentials go to a gitignored file.
import { randomBytes } from "node:crypto"
import { writeFileSync } from "node:fs"
import { eq } from "drizzle-orm"
import { requireNeonDb } from "@/lib/db/client"
import { user as userTable } from "@/lib/db/schema/auth"

async function main() {
  if (process.env.TEST_USERS_BRANCH !== "preview") throw new Error("Set TEST_USERS_BRANCH=preview to confirm the target is the preview branch.")
  if (process.env.VERCEL_ENV) throw new Error("Refusing to run inside a deployed environment.")
  const { auth } = await import("@/lib/auth/server")
  const db = requireNeonDb()
  const accounts = [
    { email: "test-superadmin@dynasty.test", name: "Test Superadmin", role: "superadmin" as const },
    { email: "test-admin@dynasty.test", name: "Test Admin", role: "admin" as const },
  ]
  const out: Array<{ email: string; role: string; password: string }> = []
  for (const account of accounts) {
    const password = randomBytes(18).toString("base64url")
    const [existing] = await db.select({ id: userTable.id }).from(userTable).where(eq(userTable.email, account.email)).limit(1)
    if (!existing) {
      await auth.api.createUser({ body: { ...account, password, data: { emailVerified: true } } })
      await db.update(userTable).set({ emailVerified: true }).where(eq(userTable.email, account.email))
      out.push({ email: account.email, role: account.role, password })
    }
  }
  writeFileSync(".test-users.local.json", JSON.stringify(out, null, 2), { mode: 0o600 })
  console.log(`Created ${out.length} test account(s); credentials written to .test-users.local.json`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
