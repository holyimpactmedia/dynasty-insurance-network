import { AsyncLocalStorage } from "node:async_hooks"

/**
 * Marks a Better Auth password-reset request as a super admin invite.
 * app/api/admin/users runs requestPasswordReset inside runAsInvite; the
 * sendResetPassword hook in lib/auth/server.ts reads this context, sends the
 * invite email instead of the reset email, and records whether it went out.
 * Scoped per request, so a public forgot-password request can never trigger
 * the invite email.
 */
export interface InviteContext {
  name: string
  emailed: boolean
}

const inviteStorage = new AsyncLocalStorage<InviteContext>()

export function runAsInvite<T>(context: InviteContext, fn: () => Promise<T>): Promise<T> {
  return inviteStorage.run(context, fn)
}

export function getInviteContext(): InviteContext | undefined {
  return inviteStorage.getStore()
}
