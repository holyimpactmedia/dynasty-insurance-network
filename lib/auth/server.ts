import { betterAuth } from "better-auth"
import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { admin } from "better-auth/plugins"
import { nextCookies } from "better-auth/next-js"
import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import { getNeonDb } from "@/lib/db/client"
import * as authSchema from "@/lib/db/schema/auth"
import { accessControl, authRoles } from "@/lib/auth/permissions"
import { isPublicSignupDisabled } from "@/lib/auth/bootstrap"
import { sendAuthEmail } from "@/lib/email/sendAuthEmail"

const dormantConnection = "postgresql://dormant:dormant@127.0.0.1:5432/dormant"
const database = getNeonDb() ?? drizzle(new Pool({ connectionString: dormantConnection }), { schema: authSchema })
const baseURL = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
const secret = process.env.BETTER_AUTH_SECRET || "dormant-secret-not-for-production"

export const auth = betterAuth({
  appName: "Union Private Healthcare",
  baseURL,
  secret,
  trustedOrigins: [baseURL],
  database: drizzleAdapter(database, {
    provider: "pg",
    schema: authSchema,
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: isPublicSignupDisabled(),
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendAuthEmail({ to: user.email, url, kind: "password-reset" })
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendAuthEmail({ to: user.email, url, kind: "verification" })
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: false },
  },
  plugins: [
    admin({
      ac: accessControl,
      roles: authRoles,
      defaultRole: "user",
      adminRoles: ["admin", "superadmin"],
    }),
    nextCookies(),
  ],
})

export type BetterAuthSession = typeof auth.$Infer.Session
