/**
 * States where Holy Impact Media routes leads to Dynasty Insurance Group.
 * Visitors from any other state see a friendly note that we do not currently
 * service their area. Single source of truth - every funnel imports from here.
 */
export const SERVICED_STATES = [
  "Alabama",
  "Arkansas",
  "Colorado",
  "Delaware",
  "Florida",
  "Georgia",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Michigan",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "North Carolina",
  "Ohio",
  "Oklahoma",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Virginia",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
] as const

export type ServicedState = (typeof SERVICED_STATES)[number]

export const SERVICED_STATES_NOTICE =
  "We currently service 30 states. If your state isn't listed, we don't have licensed agents in your area yet."
