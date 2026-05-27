/**
 * Escapes one CSV cell.
 *
 * Beyond standard quote-escaping, this neutralizes spreadsheet *formula
 * injection*: a cell whose text starts with `= + - @` (or a tab/CR) is
 * executed as a formula when the file is opened in Excel / Google Sheets.
 * Lead fields (names, UTM values, etc.) come from untrusted public form
 * submissions, so any such cell is prefixed with a single quote.
 */
export function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? "" : String(value)
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s
  return `"${s.replace(/"/g, '""')}"`
}

/** Builds a CSV document (CRLF line endings) from headers + rows. */
export function toCsv(headers: string[], rows: unknown[][]): string {
  return [headers, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n")
}
