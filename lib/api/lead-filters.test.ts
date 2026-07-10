import { describe, expect, it } from "vitest"
import { parseLeadQuery } from "./lead-filters"

describe("parseLeadQuery", () => {
  it("returns bounded defaults", () => {
    expect(parseLeadQuery(new URLSearchParams())).toEqual({
      page: 0,
      pageSize: 50,
      filters: {
        search: undefined,
        funnel: undefined,
        marketplaceStatus: undefined,
        minScore: undefined,
      },
    })
  })

  it("parses dashboard filters", () => {
    const query = new URLSearchParams({
      page: "2", pageSize: "25", search: "Ada", funnel: "family",
      marketplaceStatus: "failed", minScore: "65",
    })
    expect(parseLeadQuery(query)).toMatchObject({
      page: 2,
      pageSize: 25,
      filters: { search: "Ada", funnel: "family", marketplaceStatus: "failed", minScore: 65 },
    })
  })

  it("rejects oversized pages", () => {
    expect(() => parseLeadQuery(new URLSearchParams({ pageSize: "101" }))).toThrow()
  })
})
