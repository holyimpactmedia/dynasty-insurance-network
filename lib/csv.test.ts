import { describe, it, expect } from "vitest"
import { csvCell, toCsv } from "@/lib/csv"

describe("csvCell", () => {
  it("quotes a plain value", () => {
    expect(csvCell("hello")).toBe('"hello"')
  })

  it("doubles embedded quotes", () => {
    expect(csvCell('say "hi"')).toBe('"say ""hi"""')
  })

  it("neutralizes formula-injection prefixes", () => {
    expect(csvCell("=1+1")).toBe(`"'=1+1"`)
    expect(csvCell("+1")).toBe(`"'+1"`)
    expect(csvCell("-2")).toBe(`"'-2"`)
    expect(csvCell("@SUM(A1)")).toBe(`"'@SUM(A1)"`)
    expect(csvCell('=HYPERLINK("http://evil")')).toBe(`"'=HYPERLINK(""http://evil"")"`)
  })

  it("renders null/undefined as an empty cell", () => {
    expect(csvCell(null)).toBe('""')
    expect(csvCell(undefined)).toBe('""')
  })

  it("does not touch a value with a digit prefix", () => {
    expect(csvCell("123 Main St")).toBe('"123 Main St"')
  })
})

describe("toCsv", () => {
  it("joins headers and rows with CRLF", () => {
    expect(toCsv(["A", "B"], [[1, 2], ["x", "y"]])).toBe(
      '"A","B"\r\n"1","2"\r\n"x","y"',
    )
  })
})
