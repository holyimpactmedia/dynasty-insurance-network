import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { render, screen, fireEvent, waitFor, cleanup, within } from "@testing-library/react"
import { QuizModal } from "./quiz"

describe("QuizModal submit", () => {
  beforeEach(() => {
    document.getElementById("xxTrustedFormCertUrl")?.remove()
  })
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it("posts a correctly-shaped lead to /api/leads (segment routing, ZIP→state, cert, consent)", async () => {
    const cert = document.createElement("input")
    cert.id = "xxTrustedFormCertUrl"
    cert.value = "https://cert.trustedform.com/xyz"
    document.body.appendChild(cert)

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ referenceNumber: "HL-1" }) })
    vi.stubGlobal("fetch", fetchMock)

    // segment="cobra" skips the "who is this for" step, starting at step 1.
    render(<QuizModal open segment="cobra" onClose={() => {}} />)

    // Step 1 — ZIP + age
    fireEvent.change(screen.getByPlaceholderText("e.g. 30301"), { target: { value: "30301" } })
    fireEvent.change(screen.getByPlaceholderText(/under 65/i), { target: { value: "40" } })
    fireEvent.click(screen.getByRole("button", { name: "Continue" }))

    // Step 2 — household + coverage + tobacco
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "2" } })
    fireEvent.click(screen.getAllByRole("button", { name: "Yes" })[0]) // has coverage = Yes
    fireEvent.click(screen.getAllByRole("button", { name: "No" })[1]) // tobacco = No
    fireEvent.click(screen.getByRole("button", { name: "Continue" }))

    // Step 3 — contact + consent (scope to the dialog so the injected cert
    // <input> in document.body isn't counted as a form field).
    const boxes = within(screen.getByRole("dialog")).getAllByRole("textbox")
    fireEvent.change(boxes[0], { target: { value: "Jane" } })
    fireEvent.change(boxes[1], { target: { value: "Smith" } })
    fireEvent.change(boxes[2], { target: { value: "5551234567" } })
    fireEvent.change(boxes[3], { target: { value: "jane@example.com" } })
    fireEvent.click(screen.getByRole("checkbox"))
    fireEvent.click(screen.getByRole("button", { name: "See My Matches" }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe("/api/leads")
    const body = JSON.parse((init as RequestInit).body as string)
    expect(body.funnelType).toBe("cobra")
    expect(body.state).toBe("Georgia") // derived from ZIP 30301
    expect(body.firstName).toBe("Jane")
    expect(body.email).toBe("jane@example.com")
    expect(body.tcpaConsent).toBe(true)
    expect(body.trustedFormCertUrl).toBe("https://cert.trustedform.com/xyz")
    expect(body.quizAnswers).toMatchObject({ zip: "30301", household: "2", hasCoverage: "Yes", tobacco: "No", source: "homepage_quiz" })

    // Success screen shows
    await waitFor(() => expect(screen.getByText("You're all set!")).toBeInTheDocument())
  })

  it("shows an error and stays on the form when the API fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: "Lead intake is temporarily unavailable." }) })
    vi.stubGlobal("fetch", fetchMock)

    render(<QuizModal open segment="individual" onClose={() => {}} />)
    fireEvent.change(screen.getByPlaceholderText("e.g. 30301"), { target: { value: "10001" } })
    fireEvent.change(screen.getByPlaceholderText(/under 65/i), { target: { value: "35" } })
    fireEvent.click(screen.getByRole("button", { name: "Continue" }))
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Just 1" } })
    fireEvent.click(screen.getAllByRole("button", { name: "No" })[0]) // coverage = No
    fireEvent.click(screen.getAllByRole("button", { name: "No" })[1]) // tobacco = No
    fireEvent.click(screen.getByRole("button", { name: "Continue" }))
    const boxes = within(screen.getByRole("dialog")).getAllByRole("textbox")
    fireEvent.change(boxes[0], { target: { value: "Sam" } })
    fireEvent.change(boxes[1], { target: { value: "Jones" } })
    fireEvent.change(boxes[2], { target: { value: "5551234567" } })
    fireEvent.change(boxes[3], { target: { value: "sam@example.com" } })
    fireEvent.click(screen.getByRole("checkbox"))
    fireEvent.click(screen.getByRole("button", { name: "See My Matches" }))

    await waitFor(() => expect(screen.getByText("Lead intake is temporarily unavailable.")).toBeInTheDocument())
    // Still on the form (no success screen)
    expect(screen.queryByText("You're all set!")).not.toBeInTheDocument()
  })
})
