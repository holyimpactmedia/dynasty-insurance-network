// 2026 income thresholds used to qualify private PPO leads.
// Numbers are the 400% Federal Poverty Level cutoffs for 2026, supplied by
// the carrier as the "ideal" above-subsidy buyer profile. Households well
// below these levels typically qualify for heavily subsidized plans
// elsewhere and are not the core private-PPO clientele these funnels target.
//
// Per Sam (2026-05-07): "We sell individuals at $40k a lot." So for the
// individual / self-employed funnels (household of 1) we keep a single
// secondary tier starting at $40K — these are still qualified buyers,
// they're just below the FPL ideal. Above that, brackets walk up through
// the higher-income segments Sam called "ideal."
//
// Family / multi-person households stay strict above the household-aware
// FPL line — a $40K family of 4 absolutely qualifies for heavy subsidies
// and is not the right fit for an off-exchange private PPO.

export const INCOME_THRESHOLDS_2026 = {
  individual: 63840,
  household2: 86160,
  household3: 108480,
  household4: 130800,
  household5plus: 153120,
} as const

export type HouseholdSize = 1 | 2 | 3 | 4 | 5

export function thresholdForHouseholdSize(size: HouseholdSize): number {
  switch (size) {
    case 1: return INCOME_THRESHOLDS_2026.individual
    case 2: return INCOME_THRESHOLDS_2026.household2
    case 3: return INCOME_THRESHOLDS_2026.household3
    case 4: return INCOME_THRESHOLDS_2026.household4
    case 5: return INCOME_THRESHOLDS_2026.household5plus
  }
}

// Income brackets for individual / self-employed (single earner, household of 1).
// Floor at $40K captures the "we sell $40k individuals a lot" segment Sam
// flagged; the $65K+ tiers are the FPL-ideal target.
export const INDIVIDUAL_INCOME_BRACKETS = [
  "$40,000 – $65,000",
  "$65,000 – $90,000",
  "$90,000 – $125,000",
  "$125,000 – $200,000",
  "$200,000+",
] as const

// Family income brackets keyed to household size. Each bracket list starts
// above the matching 2026 threshold so a low-income / subsidy-eligible
// household self-selects out before submission.
export const FAMILY_INCOME_BRACKETS_BY_SIZE: Record<HouseholdSize, readonly string[]> = {
  1: INDIVIDUAL_INCOME_BRACKETS,
  2: [
    "$90,000 – $125,000",
    "$125,000 – $175,000",
    "$175,000 – $250,000",
    "$250,000+",
  ],
  3: [
    "$110,000 – $150,000",
    "$150,000 – $200,000",
    "$200,000 – $275,000",
    "$275,000+",
  ],
  4: [
    "$135,000 – $175,000",
    "$175,000 – $225,000",
    "$225,000 – $300,000",
    "$300,000+",
  ],
  5: [
    "$155,000 – $200,000",
    "$200,000 – $275,000",
    "$275,000 – $350,000",
    "$350,000+",
  ],
}

// Best-effort parse of free-form household composition strings (used by the
// family quiz) into a numeric household size for threshold lookup.
export function parseHouseholdSize(composition: string | undefined | null): HouseholdSize {
  if (!composition) return 2
  const lower = composition.toLowerCase()
  if (lower.includes("single") && lower.includes("1") || lower.includes("just me")) return 1
  if (lower.includes("3 or more") || lower.includes("3+")) return 5
  if (lower.includes("3 child") || lower.includes("4 child") || lower.includes("5 child")) return 5
  if (lower.includes("1-2 child") || lower.includes("1–2 child") || lower.includes("2 child")) return 4
  if (lower.includes("2 adults, no children")) return 2
  if (lower.includes("single parent") && lower.includes("child")) return 3
  return 2
}

// Monthly budget brackets for the PPO funnel. Floor sits above the level a
// real private PPO premium can land at; sub-$300 shoppers self-select out.
export const PPO_BUDGET_BRACKETS = [
  { label: "$400 – $700/month", value: "400_700" },
  { label: "$700 – $1,000/month", value: "700_1000" },
  { label: "$1,000 – $1,500/month", value: "1000_1500" },
  { label: "$1,500+/month", value: "1500_plus" },
] as const
