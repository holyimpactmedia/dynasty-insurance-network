/**
 * Splits a dollar `total` across `weights` into whole-dollar amounts that sum
 * EXACTLY to Math.round(total) — using the largest-remainder method so the
 * displayed partner rows always reconcile against the displayed total.
 *
 * Plain per-share `Math.floor` does not: four 25% shares of $18 floor to
 * 4+4+4+4 = $16, not $18.
 */
export function splitShares(total: number, weights: number[]): number[] {
  const sumW = weights.reduce((a, b) => a + b, 0)
  if (sumW <= 0 || weights.length === 0) return weights.map(() => 0)

  const target = Math.round(total)
  const exact = weights.map((w) => (total * w) / sumW)
  const result = exact.map(Math.floor)

  let remainder = target - result.reduce((a, b) => a + b, 0)
  const byFraction = exact
    .map((value, index) => ({ index, frac: value - Math.floor(value) }))
    .sort((a, b) => b.frac - a.frac)

  for (let k = 0; k < byFraction.length && remainder > 0; k++) {
    result[byFraction[k].index] += 1
    remainder -= 1
  }
  return result
}
