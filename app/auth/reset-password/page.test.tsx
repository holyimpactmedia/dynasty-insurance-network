import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"

// Review Focus 5: an expired or reused reset link must show a clear message and
// a path to request a new one, never a dead disabled button.
const h = vi.hoisted(() => ({
  params: new URLSearchParams(),
  push: vi.fn(),
  resetPassword: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useSearchParams: () => h.params,
  useRouter: () => ({ push: h.push }),
}))
vi.mock("@/lib/auth/client", () => ({ authClient: { resetPassword: h.resetPassword } }))

import ResetPasswordPage from "@/app/auth/reset-password/page"

const INVALID = "This reset link is invalid or expired."
const OFFLINE = "Could not reach the server. Check your connection and try again."

function openWith(query: string) {
  h.params = new URLSearchParams(query)
  render(<ResetPasswordPage />)
}

function submitNewPassword(password = "a-long-enough-password") {
  fireEvent.change(screen.getByLabelText("New password"), { target: { value: password } })
  fireEvent.click(screen.getByRole("button", { name: "Update password" }))
}

function expectInvalidLinkPanel() {
  expect(screen.getByText(INVALID)).toBeInTheDocument()
  const link = screen.getByRole("link", { name: "Request a new link" })
  expect(link).toHaveAttribute("href", "/auth/forgot-password")
  expect(screen.queryByLabelText("New password")).not.toBeInTheDocument()
  expect(screen.queryByRole("button", { name: /update password/i })).not.toBeInTheDocument()
}

describe("reset-password page", () => {
  beforeEach(() => {
    h.push.mockReset()
    h.resetPassword.mockReset()
  })
  afterEach(() => {
    cleanup()
  })

  it("shows the invalid-link panel, not a form, when the link has no token", () => {
    openWith("")
    expectInvalidLinkPanel()
  })

  it("shows the invalid-link panel when Better Auth redirects with error=INVALID_TOKEN", () => {
    openWith("token=x&error=INVALID_TOKEN")
    expectInvalidLinkPanel()
    expect(h.resetPassword).not.toHaveBeenCalled()
  })

  it("replaces the form with the invalid-link panel when the server rejects the token on submit", async () => {
    h.resetPassword.mockResolvedValue({ error: { code: "INVALID_TOKEN", message: "Invalid token" } })
    openWith("token=x")
    submitNewPassword()
    await waitFor(() => expect(screen.getByText(INVALID)).toBeInTheDocument())
    expectInvalidLinkPanel()
    expect(h.resetPassword).toHaveBeenCalledWith({ newPassword: "a-long-enough-password", token: "x" })
    expect(h.push).not.toHaveBeenCalled()
  })

  it("shows a connection message and re-enables the button when the request cannot reach the server", async () => {
    h.resetPassword.mockRejectedValue(new Error("network down"))
    openWith("token=x")
    submitNewPassword()
    expect(await screen.findByText(OFFLINE)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole("button", { name: "Update password" })).toBeEnabled())
    expect(screen.queryByText(INVALID)).not.toBeInTheDocument()
  })

  it("sends the user to sign in after a successful reset", async () => {
    h.resetPassword.mockResolvedValue({ data: {}, error: null })
    openWith("token=x")
    submitNewPassword()
    await waitFor(() => expect(h.push).toHaveBeenCalledWith("/auth/login"))
  })
})
