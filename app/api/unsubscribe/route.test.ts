// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from "vitest"

const h = vi.hoisted(() => ({
  configured: true,
  recordSuppression: vi.fn(),
}))

vi.mock("@/lib/data/store", () => ({
  getPlatformStore: async () => ({
    isConfigured: () => h.configured,
    recordSuppression: h.recordSuppression,
  }),
}))

import { GET, POST } from "@/app/api/unsubscribe/route"
import { NextRequest } from "next/server"

const BASE = "https://www.dynastyinsurancenetwork.com/api/unsubscribe"

describe("/api/unsubscribe", () => {
  beforeEach(() => {
    h.configured = true
    h.recordSuppression.mockReset().mockResolvedValue(undefined)
  })

  it("GET records a link-click suppression with the normalized email", async () => {
    const res = await GET(new NextRequest(`${BASE}?email=${encodeURIComponent(" Foo.Bar@Example.COM ")}`))
    expect(res.status).toBe(200)
    expect(res.headers.get("content-type")).toContain("text/html")
    expect(h.recordSuppression).toHaveBeenCalledTimes(1)
    expect(h.recordSuppression).toHaveBeenCalledWith("foo.bar@example.com", "link-click")
  })

  it("GET shows a normal address unchanged on the confirmation page", async () => {
    const res = await GET(new NextRequest(`${BASE}?email=${encodeURIComponent("jane@example.com")}`))
    expect(await res.text()).toContain("the address jane@example.com has been removed")
  })

  it("GET escapes markup in the email parameter", async () => {
    const res = await GET(new NextRequest(`${BASE}?email=${encodeURIComponent("<script>alert(1)</script>")}`))
    const html = await res.text()
    expect(html).not.toContain("<script>alert(1)</script>")
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;")
  })

  it("POST (RFC 8058 one-click) records a one-click suppression from the query string", async () => {
    const res = await POST(
      new NextRequest(`${BASE}?email=${encodeURIComponent("Inbox@Example.com")}`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: "List-Unsubscribe=One-Click",
      }),
    )
    expect(res.status).toBe(200)
    expect(await res.text()).toBe("")
    expect(h.recordSuppression).toHaveBeenCalledWith("inbox@example.com", "one-click")
  })

  it("POST falls back to an email in the form body", async () => {
    const res = await POST(new NextRequest(BASE, { method: "POST", body: new URLSearchParams({ email: "Form@Example.com" }) }))
    expect(res.status).toBe(200)
    expect(h.recordSuppression).toHaveBeenCalledWith("form@example.com", "one-click")
  })

  it("writes nothing and still answers 200 when no email is given", async () => {
    const res = await GET(new NextRequest(BASE))
    expect(res.status).toBe(200)
    expect(h.recordSuppression).not.toHaveBeenCalled()
  })

  it("writes nothing and still answers 200 when the database is not configured", async () => {
    h.configured = false
    const res = await GET(new NextRequest(`${BASE}?email=a@b.com`))
    expect(res.status).toBe(200)
    expect(h.recordSuppression).not.toHaveBeenCalled()
  })

  it("still answers 200 when the suppression write fails", async () => {
    h.recordSuppression.mockRejectedValue(new Error("neon down"))
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const res = await GET(new NextRequest(`${BASE}?email=a@b.com`))
    expect(res.status).toBe(200)
    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })
})
