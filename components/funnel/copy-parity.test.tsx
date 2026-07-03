import { describe, it, expect, beforeEach, vi } from "vitest"
import { render } from "@testing-library/react"
import CobraOriginal from "./__fixtures__/CobraOriginal"
import { QuizEngine } from "./QuizEngine"
import { cobraConfig } from "@/lib/funnels/cobra.config"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const normalize = (s: string | null) => (s ?? "").replace(/\s+/g, " ").trim()

// G1 — copy-diff gate. The landing page (step 0) holds the bulk of the funnel
// copy. Rendering the pre-refactor page and the new engine and asserting equal
// normalized text is the real proof that no copy was altered in the extraction.
describe("cobra copy parity: landing page", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it("new engine renders the same landing text as the original page", () => {
    const { container: original } = render(<CobraOriginal />)
    const { container: engine } = render(<QuizEngine config={cobraConfig} />)

    expect(normalize(engine.textContent)).toBe(normalize(original.textContent))
  })
})
