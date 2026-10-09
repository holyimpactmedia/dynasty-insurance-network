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
import { getInviteContext } from "@/lib/auth/inviteContext"
import { sendPortalInvite } from "@/lib/email/sendPortalInvite"
import { resolveAuthSecret, resolveDatabaseUrl } from "@/lib/platform/provider"

// Fail closed. In a deployed runtime (Vercel production or preview) a missing
// BETTER_AUTH_SECRET or DATABASE_URL throws here, before any pool or auth
// instance exists, so nothing is ever signed with a placeholder. Local dev,
// tests and `next build` keep the dormant placeholders so the module loads
// with no environment. Every caller gates on isPlatformConfigured() first, so
// in normal operation this throw is never reached.
const secret = resolveAuthSecret()
const database =
  getNeonDb() ?? drizzle(new Pool({ connectionString: resolveDatabaseUrl() }), { schema: authSchema })
const baseURL = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

export const auth = betterAuth({
  appName: "Dynasty Insurance Group",
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
    // 1 hour (the Better Auth default), stated here because the invite email in
    // lib/email/sendPortalInvite.ts quotes it. Change both together.
    resetPasswordTokenExpiresIn: 60 * 60,
    sendResetPassword: async ({ user, url }) => {
      // A super admin invite (app/api/admin/users) reuses this reset flow. Inside
      // runAsInvite it sends the invite email and records the outcome, because
      // Better Auth catches and only logs errors thrown here.
      const invite = getInviteContext()
      if (invite) {
        invite.emailed = await sendPortalInvite({ to: user.email, name: invite.name, setPasswordUrl: url })
        return
      }
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
