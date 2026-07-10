import { describe, expect, it } from "vitest"
import { isAuthBootstrapMode, isPublicSignupDisabled } from "./bootstrap"

describe("Better Auth bootstrap guard", () => {
  it("keeps public signup disabled by default", () => {
    expect(isAuthBootstrapMode({ AUTH_BOOTSTRAP_MODE: undefined, NODE_ENV: "development" })).toBe(false)
    expect(isPublicSignupDisabled({ AUTH_BOOTSTRAP_MODE: undefined, NODE_ENV: "development" })).toBe(true)
  })

  it("requires the exact one-time flag outside a production server", () => {
    expect(isAuthBootstrapMode({ AUTH_BOOTSTRAP_MODE: "true", NODE_ENV: "development" })).toBe(true)
    expect(isPublicSignupDisabled({ AUTH_BOOTSTRAP_MODE: "true", NODE_ENV: "development" })).toBe(false)
  })

  it("cannot enable signup in a production server", () => {
    expect(isAuthBootstrapMode({ AUTH_BOOTSTRAP_MODE: "true", NODE_ENV: "production" })).toBe(false)
    expect(isPublicSignupDisabled({ AUTH_BOOTSTRAP_MODE: "true", NODE_ENV: "production" })).toBe(true)
  })
})
