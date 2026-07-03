import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react"
import { QuizEngine } from "./QuizEngine"
import { cobraConfig } from "@/lib/funnels/cobra.config"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

// In jsdom, AnimatePresence mode="wait" never resolves exit animations, so step
// transitions would never mount. Render motion elements/children immediately.
vi.mock("framer-motion", async () => {
  const React = await import("react")
  const passthrough = (tag: string) =>
    React.forwardRef(function MotionMock(
      { children, initial, animate, exit, transition, whileHover, whileTap, whileInView, viewport, variants, layout, ...rest }: any,
      ref: any,
    ) {
      return React.createElement(tag, { ...rest, ref }, children)
    })
  return {
    __esModule: true,
    motion: new Proxy({}, { get: (_t, tag: string) => passthrough(tag) }),
    AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
  }
})

// Seed localStorage so the engine restores directly to the final name step
// with all prior answers filled — avoids driving all 7 steps in every test.
function seedAtNameStep() {
  localStorage.setItem(
    cobraConfig.localStorageKey,
    JSON.stringify({
      version: cobraConfig.storageVersion,
      step: 7,
      showQuiz: true,
      answers: {
        cobraTimeline: "just-received",
        cobraCost: "$400 - $700/month",
        coverageNeeded: "Just me",
        healthConsiderations: "I take regular medications",
        state: "Texas",
        age: "42",
        govCoverage: "No",
        phone: "5551234567",
        email: "jane@example.com",
        tcpaConsent: true,
      },
    }),
  )
}

function addTrustedFormInput(value: string) {
  const input = document.createElement("input")
  input.id = "xxTrustedFormCertUrl"
  input.value = value
  document.body.appendChild(input)
}

describe("QuizEngine (cobra)", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    document.getElementById("xxTrustedFormCertUrl")?.remove()
  })
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it("advances from the landing hero CTA into step 1", () => {
    render(<QuizEngine config={cobraConfig} />)
    fireEvent.click(screen.getByRole("button", { name: "See My COBRA Alternatives - Free" }))
    expect(screen.getByText("What's your COBRA situation?")).toBeInTheDocument()
  })

  it("submits with the TrustedForm cert + funnelType, then shows thank-you and clears storage", async () => {
    seedAtNameStep()
    addTrustedFormInput("https://cert.trustedform.com/xyz")
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ referenceNumber: "HL-TEST-1" }) })
    vi.stubGlobal("fetch", fetchMock)

    render(<QuizEngine config={cobraConfig} />)
    fireEvent.change(screen.getByPlaceholderText("Jane"), { target: { value: "Jane" } })
    fireEvent.change(screen.getByPlaceholderText("Smith"), { target: { value: "Smith" } })
    fireEvent.click(screen.getByRole("button", { name: "Show My COBRA Alternatives" }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe("/api/leads")
    const body = JSON.parse((init as RequestInit).body as string)
    expect(body.funnelType).toBe("cobra")
    expect(body.trustedFormCertUrl).toBe("https://cert.trustedform.com/xyz")
    expect(body.firstName).toBe("Jane")
    expect(body.quizAnswers.cobraTimeline).toBe("just-received")

    await waitFor(() => expect(screen.getByText(/Great news, Jane/)).toBeInTheDocument())
    expect(localStorage.getItem(cobraConfig.localStorageKey)).toBeNull()
  })

  it("surfaces a submit error and re-enables the button on failure (retryable)", async () => {
    seedAtNameStep()
    addTrustedFormInput("cert")
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: "Server boom" }) })
    vi.stubGlobal("fetch", fetchMock)

    render(<QuizEngine config={cobraConfig} />)
    fireEvent.change(screen.getByPlaceholderText("Jane"), { target: { value: "Jane" } })
    fireEvent.change(screen.getByPlaceholderText("Smith"), { target: { value: "Smith" } })

    const button = screen.getByRole("button", { name: "Show My COBRA Alternatives" })
    fireEvent.click(button)

    await waitFor(() => expect(screen.getByText("Server boom")).toBeInTheDocument())
    // Button is back to its idle label and not disabled — the user can retry.
    expect(screen.getByRole("button", { name: "Show My COBRA Alternatives" })).not.toBeDisabled()
  })

  it("blocks submit with validation errors when the name is missing", () => {
    seedAtNameStep()
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    render(<QuizEngine config={cobraConfig} />)
    fireEvent.click(screen.getByRole("button", { name: "Show My COBRA Alternatives" }))

    expect(fetchMock).not.toHaveBeenCalled()
    expect(screen.getByText("Please enter your first name (at least 2 characters)")).toBeInTheDocument()
  })
})
