// Derive a US state from a 5-digit ZIP via its 3-digit SCF prefix.
// Source: USPS L002/L005 sectional-center-facility prefixes (per the Wikipedia
// "List of ZIP Code prefixes"). The ZIP itself is always stored raw on the lead
// as the source of truth, this is a best-effort convenience for routing/display.
//
// Ranges are checked in order; a few embedded/anomalous prefixes are listed
// first so they win over their containing range (e.g. DE 197-199 before PA).

type Range = [lo: number, hi: number, abbr: string]

const RANGES: Range[] = [
  // embedded / anomalous prefixes first
  [8, 8, "VI"], // within PR 006-009
  [55, 55, "MA"], // within VT 050-059
  [197, 199, "DE"], // within PA 150-199
  [569, 569, "DC"],
  [967, 968, "HI"],
  // main ranges, numeric order
  [6, 9, "PR"],
  [10, 27, "MA"],
  [28, 29, "RI"],
  [30, 38, "NH"],
  [39, 49, "ME"],
  [50, 59, "VT"],
  [60, 69, "CT"],
  [70, 89, "NJ"],
  [100, 149, "NY"],
  [150, 199, "PA"],
  [200, 205, "DC"],
  [206, 219, "MD"],
  [220, 246, "VA"],
  [247, 268, "WV"],
  [270, 289, "NC"],
  [290, 299, "SC"],
  [300, 319, "GA"],
  [320, 349, "FL"],
  [350, 369, "AL"],
  [370, 385, "TN"],
  [386, 398, "MS"],
  [399, 399, "GA"],
  [400, 427, "KY"],
  [430, 459, "OH"],
  [460, 479, "IN"],
  [480, 499, "MI"],
  [500, 529, "IA"],
  [530, 549, "WI"],
  [550, 567, "MN"],
  [570, 577, "SD"],
  [580, 588, "ND"],
  [590, 599, "MT"],
  [600, 629, "IL"],
  [630, 658, "MO"],
  [660, 679, "KS"],
  [680, 693, "NE"],
  [700, 714, "LA"],
  [716, 729, "AR"],
  [730, 749, "OK"],
  [750, 799, "TX"],
  [800, 816, "CO"],
  [820, 831, "WY"],
  [832, 838, "ID"],
  [840, 847, "UT"],
  [850, 865, "AZ"],
  [870, 884, "NM"],
  [889, 898, "NV"],
  [900, 961, "CA"],
  [969, 969, "GU"],
  [970, 979, "OR"],
  [980, 994, "WA"],
  [995, 999, "AK"],
]

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota",
  MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
  NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon",
  PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota",
  TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia",
  WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  PR: "Puerto Rico", VI: "U.S. Virgin Islands", GU: "Guam",
}

/** Returns the two-letter state code for a 5-digit ZIP, or null if unknown. */
export function zipToStateCode(zip: string): string | null {
  const digits = (zip || "").replace(/\D/g, "")
  if (digits.length < 3) return null
  const prefix = parseInt(digits.slice(0, 3), 10)
  if (Number.isNaN(prefix)) return null
  for (const [lo, hi, abbr] of RANGES) {
    if (prefix >= lo && prefix <= hi) return abbr
  }
  return null
}

/** Returns the full US state name for a ZIP, or null if unknown. */
export function zipToStateName(zip: string): string | null {
  const code = zipToStateCode(zip)
  return code ? STATE_NAMES[code] ?? null : null
}
