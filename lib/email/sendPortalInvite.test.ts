import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { send } = vi.hoisted(() => ({ send: vi.fn() }))
vi.mock("resend", () => ({
  Resend: class {
    emails = { send }
  },
}))

import { sendPortalInvite } from "./sendPortalInvite"

const LINK =
  "https://www.dynastyinsurancenetwork.com/api/auth/reset-password/tok123?callbackURL=%2Fauth%2Freset-password"

describe("sendPortalInvite", () => {
  beforeEach(() => {
    send.mockReset()
    send.mockResolvedValue({ data: { id: "email-1" }, error: null })
    vi.stubEnv("RESEND_API_KEY", "re_test_key")
    vi.stubEnv("RESEND_FROM_EMAIL", "")
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("sends nothing and returns false when email is not configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "")
    await expect(sendPortalInvite({ to: "sam@example.com", name: "Sam Lamy", setPasswordUrl: LINK })).resolves.toBe(false)
    expect(send).not.toHaveBeenCalled()
  })

  it("sends a Dynasty invite that carries only the set-password link", async () => {
    await expect(
      sendPortalInvite({ to: "sam@example.com", name: "<b>Sam</b> Lamy", setPasswordUrl: LINK }),
    ).resolves.toBe(true)
    expect(send).toHaveBeenCalledTimes(1)
    const msg = send.mock.calls[0][0] as { from: string; to: string; subject: string; html: string; text: string }
    expect(msg.to).toBe("sam@example.com")
    expect(msg.from).toBe("Holy Impact Media <noreply@holyimpactmedia.com>")
    expect(msg.subject).toMatch(/Dynasty/)
    expect(msg.html).toContain(LINK)
    expect(msg.text).toContain(LINK)
    expect(msg.text).toContain("https://www.dynastyinsurancenetwork.com/auth/forgot-password")
    expect(msg.html).toContain("&lt;b&gt;Sam&lt;/b&gt;")
    expect(msg.html).not.toContain("<b>Sam</b>")
    const all = `${msg.subject}\n${msg.html}\n${msg.text}`
    expect(all).not.toMatch(/\bunion\b/i)
    expect(all).not.toMatch(/temporary password|password:/i)
  })

  it("throws when Resend rejects the message", async () => {
    send.mockResolvedValue({ data: null, error: { message: "domain not verified" } })
    await expect(sendPortalInvite({ to: "sam@example.com", name: "Sam", setPasswordUrl: LINK })).rejects.toThrow("domain not verified")
  })
})
