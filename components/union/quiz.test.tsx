import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { render, screen, fireEvent, waitFor, cleanup, within } from "@testing-library/react"
import { QuizModal } from "./quiz"

describe("QuizModal submit", () => {
  beforeEach(() => {
    document.getElementById("tf-capture")?.remove()
  })
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it("posts a lead with per-segment detail answers + universal fields", async () => {
    // Match the real SDK install: a hidden input with name="xxTrustedFormCertUrl"
    // and id="xxTrustedFormCertUrl_0" (the _0 form-index suffix) inside a form.
    // Production reads it by name, which is what this exercises.
    const form = document.createElement("form")
    form.id = "tf-capture"
    const cert = document.createElement("input")
    cert.type = "hidden"
    cert.name = "xxTrustedFormCertUrl"
    cert.id = "xxTrustedFormCertUrl_0"
    cert.value = "https://cert.trustedform.com/xyz"
    form.appendChild(cert)
    document.body.appendChild(form)

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ referenceNumber: "HL-1" }) })
    vi.stubGlobal("fetch", fetchMock)

    // segment="cobra" skips "who" and asks cobra's two detail questions first.
    render(<QuizModal open segment="cobra" onClose={() => {}} />)

    // Detail 1 + 2 (auto-advance on select)
    fireEvent.click(screen.getByRole("button", { name: "Just got the COBRA notice" }))
    fireEvent.click(screen.getByRole("button", { name: "$400 to $700" }))

    // Location
    fireEvent.change(screen.getByPlaceholderText("e.g. 30301"), { target: { value: "30301" } })
    fireEvent.change(screen.getByPlaceholderText(/under 65/i), { target: { value: "40" } })
    fireEvent.click(screen.getByRole("button", { name: "Continue" }))

    // Details
    const details = screen.getAllByRole("combobox")
    fireEvent.change(details[0], { target: { value: "2" } }) // household
    fireEvent.change(details[1], { target: { value: "$50,000 to $75,000" } }) // income
    fireEvent.click(screen.getAllByRole("button", { name: "Yes" })[0]) // has coverage
    fireEvent.click(screen.getAllByRole("button", { name: "No" })[1]) // tobacco
    fireEvent.click(screen.getByRole("button", { name: "Continue" }))

    // Contact
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
    expect(body.state).toBe("Georgia") // from ZIP 30301
    expect(body.tcpaConsent).toBe(true)
    expect(body.trustedFormCertUrl).toBe("https://cert.trustedform.com/xyz")
    // incomeRange must be promoted to the TOP LEVEL (not only nested in quizAnswers),
    // or the leads route writes income_range=null and the AI scorer runs blind.
    expect(body.incomeRange).toBe("$50,000 to $75,000")
    expect(body.quizAnswers).toMatchObject({
      segment: "cobra",
      cobraSituation: "Just got the COBRA notice",
      cobraCost: "$400 to $700",
      zip: "30301",
      household: "2",
      incomeRange: "$50,000 to $75,000",
      hasCoverage: "Yes",
      tobacco: "No",
      source: "quiz",
    })

    await waitFor(() => expect(screen.getByText("You're all set!")).toBeInTheDocument())
  })

  it("shows an error and stays on the form when the API fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: "Lead intake is temporarily unavailable." }) })
    vi.stubGlobal("fetch", fetchMock)

    render(<QuizModal open segment="individual" onClose={() => {}} />)
    fireEvent.click(screen.getByRole("button", { name: "Lost job coverage" })) // detail: qualifying event
    fireEvent.change(screen.getByPlaceholderText("e.g. 30301"), { target: { value: "10001" } })
    fireEvent.change(screen.getByPlaceholderText(/under 65/i), { target: { value: "35" } })
    fireEvent.click(screen.getByRole("button", { name: "Continue" }))
    const details = screen.getAllByRole("combobox")
    fireEvent.change(details[0], { target: { value: "Just 1" } }) // household
    fireEvent.change(details[1], { target: { value: "Under $30,000" } }) // income
    fireEvent.click(screen.getAllByRole("button", { name: "No" })[0]) // coverage
    fireEvent.click(screen.getAllByRole("button", { name: "No" })[1]) // tobacco
    fireEvent.click(screen.getByRole("button", { name: "Continue" }))
    const boxes = within(screen.getByRole("dialog")).getAllByRole("textbox")
    fireEvent.change(boxes[0], { target: { value: "Sam" } })
    fireEvent.change(boxes[1], { target: { value: "Jones" } })
    fireEvent.change(boxes[2], { target: { value: "5551234567" } })
    fireEvent.change(boxes[3], { target: { value: "sam@example.com" } })
    fireEvent.click(screen.getByRole("checkbox"))
    fireEvent.click(screen.getByRole("button", { name: "See My Matches" }))

    await waitFor(() => expect(screen.getByText("Lead intake is temporarily unavailable.")).toBeInTheDocument())
    expect(screen.queryByText("You're all set!")).not.toBeInTheDocument()
  })
})
