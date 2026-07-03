// Shared funnel-engine contract. Pure data — NO React imports, NO styling.
// One QuizEngine renders any funnel from a FunnelConfig. Copy lives here as
// plain strings so a later visual redesign touches components + tokens, never
// this file. Icons are referenced by string key into lib/funnels/icons.ts.
//
// Emphasis: headlines/subheads are RichText (segment array). A segment with
// `em: true` is rendered emphasized by the section component (currently gold).
// That is *semantic* emphasis, not a color — the color decision stays in the
// component so Phase 3 can restyle without editing configs.

export type IconKey =
  | "shield"
  | "chevronLeft"
  | "clock"
  | "check"
  | "phone"
  | "mail"
  | "alert"
  | "dollar"
  | "users"
  | "heart"
  | "calendar"
  | "pill"
  | "activity"
  | "arrowRight"
  | "lock"
  | "star"
  | "trendingDown"
  | "award"
  | "xCircle"
  | "stethoscope"
  | "eye"
  | "smile"
  | "zap"
  | "globe"
  | "fileText"
  | "briefcase"
  | "baby"
  | "home"
  | "mapPin"

// A segment may be emphasized (`em`, rendered gold) or a link (`href`).
export type RichText = Array<{ text: string; em?: boolean; href?: string }>

export interface IconText {
  icon: IconKey
  text: string
}

// ── Landing (step 0) ────────────────────────────────────────────────────────

export interface HeroConfig {
  bgImage: string
  badge: IconText
  headline: RichText
  subhead: RichText
  painPoints: string[]
  ctaLabel: string
  ctaSubtext: string
}

export interface ProblemSolutionConfig {
  heading: string
  subhead: string
  problemLabel: string
  problemTitle: string
  problems: string[]
  solutionLabel: string
  solutionTitle: string
  advantages: string[]
}

export interface CoverageItem {
  icon: IconKey
  label: string
  desc: string
}

export interface CoverageConfig {
  heading: string
  subhead: string
  items: CoverageItem[]
}

export interface HowItWorksStep {
  step: string
  title: string
  desc: string
}

export interface HowItWorksConfig {
  heading: string
  subhead: string
  steps: HowItWorksStep[]
}

export interface WhyFeature {
  icon: IconKey
  title: string
  desc: string
}

export interface WhyDynastyConfig {
  badge: string
  heading: string
  paragraphs: string[]
  features: WhyFeature[]
}

export interface SavingsStory {
  name: string
  situation: string
  location: string
  before: string
  after: string
  quote: string
}

export interface SavingsStoriesConfig {
  heading: string
  subhead: string
  stories: SavingsStory[]
  disclaimer: string
}

export interface FinalCtaConfig {
  heading: string
  subhead: string
  ctaLabel: string
  trustBadges: IconText[]
}

export interface LandingConfig {
  hero: HeroConfig
  statsBar: IconText[]
  problemSolution: ProblemSolutionConfig
  coverage: CoverageConfig
  howItWorks: HowItWorksConfig
  whyDynasty: WhyDynastyConfig
  savingsStories: SavingsStoriesConfig
  finalCta: FinalCtaConfig
}

// ── Quiz steps ──────────────────────────────────────────────────────────────

// Card layout variants seen across the funnels. Each maps to a fixed markup in
// the StepRenderer; kept verbatim from the original pages for pixel parity.
export type CardLayout = "plain" | "trailingDollar" | "iconGold" | "iconMuted"

export interface ChoiceOption {
  value: string // stored in answers[fieldKey]
  label?: string // display text; defaults to value
  desc?: string
  icon?: IconKey
  iconColor?: string // presentational hint (health-status colors); Phase 3 tokenizes
}

export interface CardChoiceStep {
  type: "cardChoice"
  id: string
  fieldKey: string
  heading: string
  subhead: string
  layout: CardLayout
  options: ChoiceOption[]
}

export interface StateSearchStep {
  type: "stateSearch"
  id: string
  fieldKey: string
  heading: string
  subhead: string
}

export interface ContactStep {
  type: "contact"
  id: string
  heading: string
  subhead: string
  askAge: boolean
  askGovCoverage: boolean
  govCoverageLabel?: string
  govCoverageWarning?: string
  consentText: RichText // legal TCPA copy; links rendered by the component
  submitLabel: string
}

export interface NameStep {
  type: "name"
  id: string
  heading: string
  subhead: string
  submitLabel: string
  submittingLabel: string
  secureNote: string
}

export type StepConfig = CardChoiceStep | StateSearchStep | ContactStep | NameStep

// ── Thank-you ───────────────────────────────────────────────────────────────

export interface SavingsRange {
  cobra: string
  low: number
  high: number
}

export interface SavingsEstimatorConfig {
  fromKey: string // answers key that selects the range (e.g. "cobraCost")
  badge: string
  currentLabel: string
  currentSubLabel: string
  altLabel: string
  altSubLabel: string
  ranges: Record<string, SavingsRange>
  fallback: SavingsRange
  disclaimer: string
}

export interface TimelineItem {
  title: string
  badgeText: string
  desc: string
  showReference?: boolean // renders the confirmation/reference block
}

export interface ThankYouConfig {
  headlineBefore: string // "Great news, " (firstName inserted between)
  headlineAfter: string // ". Alternatives exist."
  subhead: string
  savingsEstimator?: SavingsEstimatorConfig
  referencePrefix: string // "CB-PENDING"
  timelineHeading: string
  timeline: TimelineItem[]
  disclaimer: string
}

// ── Variants (used by Phase 1b funnels; optional for cobra) ─────────────────

export type LandingGate = { kind: "step0" } | { kind: "boolean" }

export interface RedirectConfig {
  whenFieldEquals: { key: string; value: string }
  to: string
  delayMs: number
  message: string
}

// ── Exit-intent (props for the existing ExitIntentDialog) ───────────────────

export interface ExitIntentConfig {
  savingsAmount: string
  headline: string
  beforeLabel: string
  beforeValue: string
  afterLabel: string
  afterValue: string
  comparisonName: string
}

// ── Top-level ───────────────────────────────────────────────────────────────

export interface PayloadMeta {
  trustedFormCertUrl: string | null
  utm: { source: string | null; medium: string | null; campaign: string | null }
}

export interface FunnelConfig {
  slug: string // route segment, e.g. "cobra"
  funnelType: string // DB/USHA value sent to /api/leads
  localStorageKey: string
  storageVersion: number // bump to invalidate stale mid-quiz resumes across deploys
  trustedFormId: string
  exitIntentSessionKey: string
  landingGate: LandingGate
  landing: LandingConfig
  steps: StepConfig[]
  exitIntent: ExitIntentConfig
  thankYou: ThankYouConfig
  redirect?: RedirectConfig
  // Builds the exact /api/leads POST body. Per-funnel closure so quirks
  // (hardcoded fields, answer→API remapping) reproduce verbatim.
  buildPayload: (answers: Record<string, any>, meta: PayloadMeta) => Record<string, unknown>
}
