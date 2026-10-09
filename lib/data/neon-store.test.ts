// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { getTableColumns, getTableName, type SQL } from "drizzle-orm"
import { PgDialect } from "drizzle-orm/pg-core"

const h = vi.hoisted(() => {
  const calls = {
    table: undefined as unknown,
    values: undefined as Record<string, unknown> | undefined,
    conflict: undefined as { target: unknown; set: Record<string, unknown> } | undefined,
    // How many times an insert was run to completion of `returning`.
    insertRuns: 0,
    // One entry per insert attempt, consumed in order; when empty the insert returns the default row.
    returningScript: [] as Array<() => Promise<unknown>>,
    // What select().from().where().limit() resolves to, and the where clause it was given.
    selectRows: [] as unknown[],
    selectWhere: undefined as unknown,
    selectRuns: 0,
  }
  const db = {
    insert(table: unknown) {
      calls.table = table
      return {
        values(values: Record<string, unknown>) {
          calls.values = values
          return {
            returning: () => {
              calls.insertRuns += 1
              const next = calls.returningScript.shift()
              return next
                ? next()
                : Promise.resolve([{ id: "00000000-0000-4000-8000-000000000001", createdAt: "2026-10-06 15:04:05.9+00" }])
            },
            onConflictDoUpdate: async (conflict: { target: unknown; set: Record<string, unknown> }) => {
              calls.conflict = conflict
            },
          }
        },
      }
    },
    select() {
      return {
        from() {
          return {
            where(where: unknown) {
              calls.selectWhere = where
              return {
                limit: async () => {
                  calls.selectRuns += 1
                  return calls.selectRows
                },
              }
            },
          }
        },
      }
    },
  }
  return { calls, db }
})

vi.mock("@/lib/db/client", () => ({
  getNeonDb: () => h.db,
  requireNeonDb: () => h.db,
}))

import { neonStore } from "@/lib/data/neon-store"
import { emailSuppressions, leads } from "@/lib/db/schema"
import type { LeadCreateInput } from "@/lib/data/types"

const FIXED_NOW = "2026-10-06T15:04:05.678Z"
const CERT_URL = "https://cert.trustedform.com/0123456789abcdef0123456789abcdef01234567"

const input: LeadCreateInput = {
  referenceNumber: "HL-TEST-0001",
  firstName: "Test",
  lastName: "Parity",
  email: "test.parity@example.com",
  phone: "(555) 010-0199",
  age: 42,
  state: "Florida",
  incomeRange: "$65,000 to $90,000",
  householdSize: "Me + spouse",
  qualifyingEvent: "Lost job coverage",
  priorities: '["nationwide"]',
  tcpaConsent: true,
  tcpaConsentAt: FIXED_NOW,
  trustedFormCertUrl: CERT_URL,
  funnelType: "private_health",
  utmSource: "facebook",
  utmMedium: "paid_social",
  utmCampaign: "dynasty_individual_q4",
  ipAddress: "203.0.113.7",
  quizAnswers: { healthScreen: "No", govCoverage: "No" },
}

// Exactly the object main's app/api/leads/route.ts passed to
// supabase.from('leads').insert(...) for the same lead (snake_case columns).
const MAIN_ROW = {
  reference_number: "HL-TEST-0001",
  first_name: "Test",
  last_name: "Parity",
  email: "test.parity@example.com",
  phone: "(555) 010-0199",
  age: 42,
  state: "Florida",
  income_range: "$65,000 to $90,000",
  household_size: "Me + spouse",
  qualifying_event: "Lost job coverage",
  priorities: '["nationwide"]',
  tcpa_consent: true,
  tcpa_consent_at: FIXED_NOW,
  trusted_form_cert_url: CERT_URL,
  funnel_type: "private_health",
  utm_source: "facebook",
  utm_medium: "paid_social",
  utm_campaign: "dynasty_individual_q4",
  ip_address: "203.0.113.7",
  quiz_answers: { healthScreen: "No", govCoverage: "No" },
  status: "new",
}

function toColumnRow(values: Record<string, unknown>) {
  const columns = getTableColumns(leads) as Record<string, { name: string }>
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => {
      const column = columns[key]
      if (!column) throw new Error(`neon-store wrote unknown property ${key}`)
      return [column.name, value]
    }),
  )
}

describe("neonStore", () => {
  beforeEach(() => {
    h.calls.table = undefined
    h.calls.values = undefined
    h.calls.conflict = undefined
    h.calls.insertRuns = 0
    h.calls.returningScript = []
    h.calls.selectRows = []
    h.calls.selectWhere = undefined
    h.calls.selectRuns = 0
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("createLead writes exactly the columns and values main's Supabase insert wrote", async () => {
    const result = await neonStore.createLead(input)
    expect(h.calls.table).toBe(leads)
    expect(toColumnRow(h.calls.values!)).toStrictEqual(MAIN_ROW)
    expect(result).toEqual({ id: "00000000-0000-4000-8000-000000000001", createdAt: "2026-10-06T15:04:05.900Z" })
  })

  describe("createLead on a dropped connection", () => {
    const STORED = { id: "00000000-0000-4000-8000-000000000001", createdAt: "2026-10-06T15:04:05.900Z" }
    const reject = (error: unknown) => () => Promise.reject(error)
    const resolveRow = (row: unknown) => () => Promise.resolve([row])
    // drizzle 0.45 wraps the driver error: message "Failed query: ...", the pg error as `cause`.
    const wrapped = (cause: unknown) => Object.assign(new Error("Failed query: insert into leads"), { cause })

    it("retries once when the pooled connection was terminated, and returns the stored row", async () => {
      h.calls.returningScript = [
        reject(new Error("Connection terminated unexpectedly")),
        resolveRow({ id: "11111111-1111-4111-8111-111111111111", createdAt: "2026-10-06 15:04:05.9+00" }),
      ]
      const result = await neonStore.createLead(input)
      expect(result).toEqual({ id: "11111111-1111-4111-8111-111111111111", createdAt: "2026-10-06T15:04:05.900Z" })
      expect(h.calls.insertRuns).toBe(2)
    })

    it("retries once when drizzle wraps an ECONNRESET as the cause", async () => {
      h.calls.returningScript = [
        reject(wrapped({ code: "ECONNRESET", message: "read ECONNRESET" })),
        resolveRow({ id: STORED.id, createdAt: "2026-10-06 15:04:05.9+00" }),
      ]
      const result = await neonStore.createLead(input)
      expect(result).toEqual(STORED)
      expect(h.calls.insertRuns).toBe(2)
    })

    it("does not retry because a consumer value in the statement parameters reads like a connection error", async () => {
      // drizzle's outer message quotes the parameters, which hold consumer-typed text.
      const outer = Object.assign(new Error("Failed query: insert into leads\nparams: HL-1,connection error,a@b.com"), {
        cause: { code: "23502", message: "null value in column" },
      })
      h.calls.returningScript = [reject(outer)]
      await expect(neonStore.createLead(input)).rejects.toThrow()
      expect(h.calls.insertRuns).toBe(1)
    })

    it("retries on any SQLSTATE class 08 connection exception", async () => {
      h.calls.returningScript = [
        reject(wrapped({ code: "08006", message: "server closed the session" })),
        resolveRow({ id: STORED.id, createdAt: "2026-10-06 15:04:05.9+00" }),
      ]
      expect(await neonStore.createLead(input)).toEqual(STORED)
      expect(h.calls.insertRuns).toBe(2)
    })

    it("retries when the server is shutting down or starting up (57P02, 57P03)", async () => {
      for (const code of ["57P02", "57P03"]) {
        h.calls.insertRuns = 0
        h.calls.returningScript = [
          reject(wrapped({ code, message: "server state changed" })),
          resolveRow({ id: STORED.id, createdAt: "2026-10-06 15:04:05.9+00" }),
        ]
        expect(await neonStore.createLead(input)).toEqual(STORED)
        expect(h.calls.insertRuns).toBe(2)
      }
    })

    it("does not retry a non-connection error", async () => {
      h.calls.returningScript = [reject(wrapped({ code: "23502", message: "null value in column" }))]
      await expect(neonStore.createLead(input)).rejects.toThrow()
      expect(h.calls.insertRuns).toBe(1)
    })

    it("returns the existing row when the retry hits this lead's own reference number", async () => {
      h.calls.returningScript = [
        reject(new Error("Connection terminated unexpectedly")),
        reject(wrapped({ code: "23505", constraint: "leads_reference_number_key", message: "duplicate key" })),
      ]
      h.calls.selectRows = [{ id: STORED.id, createdAt: "2026-10-06 15:04:05.9+00" }]
      const result = await neonStore.createLead(input)
      expect(result).toEqual(STORED)
      expect(h.calls.insertRuns).toBe(2)
      expect(h.calls.selectRuns).toBe(1)

      // The lookup must match the reference number AND the email, so a collision
      // with a different lead's reference can never be mistaken for this one.
      const query = new PgDialect().sqlToQuery(h.calls.selectWhere as SQL)
      expect(query.sql).toContain('"leads"."reference_number" = $1')
      expect(query.sql).toContain('"leads"."email" = $2')
      expect(query.params).toEqual([input.referenceNumber, input.email])
    })

    it("returns null when the reference belongs to a different lead", async () => {
      h.calls.returningScript = [
        reject(new Error("Connection terminated unexpectedly")),
        reject(wrapped({ code: "23505", constraint: "leads_reference_number_key", message: "duplicate key" })),
      ]
      h.calls.selectRows = []
      expect(await neonStore.createLead(input)).toBeNull()
    })

    it("rejects when the retry hits a unique violation on a different constraint", async () => {
      h.calls.returningScript = [
        reject(new Error("Connection terminated unexpectedly")),
        reject(wrapped({ code: "23505", constraint: "leads_email_key", message: "duplicate key" })),
      ]
      await expect(neonStore.createLead(input)).rejects.toThrow()
      expect(h.calls.selectRuns).toBe(0)
    })

    it("rejects when the retry fails again with another connection error (no third attempt)", async () => {
      h.calls.returningScript = [
        reject(new Error("Connection terminated unexpectedly")),
        reject(new Error("Connection terminated unexpectedly")),
      ]
      await expect(neonStore.createLead(input)).rejects.toThrow()
      expect(h.calls.insertRuns).toBe(2)
    })
  })

  it("recordSuppression upserts into email_suppressions keyed on email, app-clock timestamp", async () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date(FIXED_NOW))
    await neonStore.recordSuppression("foo@example.com", "one-click")
    expect(h.calls.table).toBe(emailSuppressions)
    expect(getTableName(emailSuppressions)).toBe("email_suppressions")
    expect(h.calls.values).toStrictEqual({ email: "foo@example.com", source: "one-click", suppressedAt: FIXED_NOW })
    expect(getTableColumns(emailSuppressions).suppressedAt.name).toBe("suppressed_at")
    expect(h.calls.conflict?.target).toBe(emailSuppressions.email)
    expect(h.calls.conflict?.set).toStrictEqual({ source: "one-click", suppressedAt: FIXED_NOW })
  })
})
