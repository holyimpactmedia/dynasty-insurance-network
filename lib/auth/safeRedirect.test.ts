import { describe, it, expect } from "vitest"
import { safeRedirect } from "@/lib/auth/safeRedirect"

describe("safeRedirect", () => {
  it("accepts a same-origin relative path", () => {
    expect(safeRedirect("/dashboard/projections")).toBe("/dashboard/projections")
    expect(safeRedirect("/")).toBe("/")
  })

  it("rejects absolute URLs", () => {
    expect(safeRedirect("https://evil.com")).toBe("/dashboard/admin")
    expect(safeRedirect("http://evil.com/path")).toBe("/dashboard/admin")
  })

  it("rejects protocol-relative and backslash tricks", () => {
    expect(safeRedirect("//evil.com")).toBe("/dashboard/admin")
    expect(safeRedirect("/\\evil.com")).toBe("/dashboard/admin")
  })

  it("rejects control-character tricks", () => {
    expect(safeRedirect("/\tevil")).toBe("/dashboard/admin")
    expect(safeRedirect("/\nevil")).toBe("/dashboard/admin")
  })

  it("rejects non-path values and falls back", () => {
    expect(safeRedirect(null)).toBe("/dashboard/admin")
    expect(safeRedirect(undefined)).toBe("/dashboard/admin")
    expect(safeRedirect("")).toBe("/dashboard/admin")
    expect(safeRedirect("dashboard/admin")).toBe("/dashboard/admin")
  })

  it("honors a custom fallback", () => {
    expect(safeRedirect("https://evil.com", "/auth/login")).toBe("/auth/login")
  })
})
