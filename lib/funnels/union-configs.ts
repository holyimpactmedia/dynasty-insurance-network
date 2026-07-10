import {
  Stethoscope, Globe, Network, HeartHandshake, Users, Baby, Smile,
  FileText, PiggyBank, Wallet, RefreshCw,
} from "lucide-react"
import type { FunnelConfig } from "@/components/union/FunnelPage"

// Universal FAQs shared across funnel pages (each funnel prepends its own).
const COMMON_FAQS = [
  { q: "How much does this cost me?", a: "Nothing. Our service is 100% free to you. The licensed agents we connect you with are compensated by the carriers, not by you." },
  { q: "Who actually contacts me?", a: "A licensed insurance agent, a real person, reaches out to review your options, answer questions, and help you enroll if you choose to." },
  { q: "Do I have to buy anything?", a: "No. There's no obligation. You can compare your options and walk away at any time." },
  { q: "Is my information private?", a: "Yes. Your details are protected and only shared with the licensed agent who helps you, never sold to a list." },
]

export const individualConfig: FunnelConfig = {
  segment: "individual",
  hero: {
    eyebrow: "Private PPO · Individual coverage",
    headline: [{ text: "Coverage built around " }, { text: "you", em: true }, { text: ", not a network's rules." }],
    subhead: "Private PPO plans for healthy adults under 65. See any doctor, skip the referrals, and keep nationwide coverage. Answer a few quick questions and we'll match you with a licensed agent, free.",
  },
  benefits: {
    eyebrow: "For individuals",
    heading: "Private PPO coverage, built for one.",
    items: [
      { icon: Stethoscope, title: "See any doctor", desc: "Choose any physician or specialist, no gatekeepers, no waiting for approval." },
      { icon: Network, title: "No referrals", desc: "Go straight to the specialist you need instead of routing through a primary." },
      { icon: Globe, title: "Nationwide coverage", desc: "Your plan travels with you across the country, not just one narrow region." },
      { icon: HeartHandshake, title: "A real person to help", desc: "A licensed agent compares your options and answers your questions, free." },
    ],
  },
  faqHeading: "Individual coverage questions",
  faqs: [
    { q: "Who are these plans for?", a: "Private PPO plans work well for healthy adults under 65 who want to see any doctor without referrals and keep nationwide coverage." },
    ...COMMON_FAQS,
  ],
  finalHeading: "See your individual PPO options in about two minutes.",
}

export const familyConfig: FunnelConfig = {
  segment: "family",
  hero: {
    eyebrow: "Private PPO · Family coverage",
    headline: [{ text: "One plan that covers " }, { text: "everyone you love", em: true }, { text: "." }],
    subhead: "Private PPO plans for the whole household, keep your pediatrician, see any specialist, and stay covered nationwide. A few quick questions and a licensed agent handles the rest, free.",
  },
  benefits: {
    eyebrow: "For families",
    heading: "One plan for the whole household.",
    items: [
      { icon: Baby, title: "Keep your pediatrician", desc: "Broad networks make it easy to keep the doctors your kids already know." },
      { icon: Users, title: "Everyone covered", desc: "You, your spouse, and your children under one straightforward plan." },
      { icon: Globe, title: "Covered anywhere", desc: "Nationwide coverage for busy families who travel and move around." },
      { icon: Smile, title: "Dental & vision options", desc: "Add-on coverage available so the whole family's needs are handled." },
    ],
  },
  faqHeading: "Family coverage questions",
  faqs: [
    { q: "Can one plan cover my whole family?", a: "Yes, a family PPO can cover you, your spouse, and your children under one plan, with broad networks so you can keep your pediatrician and specialists." },
    ...COMMON_FAQS,
  ],
  finalHeading: "See family PPO options in about two minutes.",
}

export const selfEmployedConfig: FunnelConfig = {
  segment: "self_employed",
  hero: {
    eyebrow: "Private PPO · Self-employed",
    headline: [{ text: "Real coverage for " }, { text: "the way you work", em: true }, { text: "." }],
    subhead: "Private PPO plans for 1099 earners and business owners under 65, premiums you may be able to deduct, doctors you choose, coverage that travels. A few questions and a licensed agent takes it from there.",
  },
  benefits: {
    eyebrow: "For the self-employed",
    heading: "Coverage as independent as you are.",
    items: [
      { icon: FileText, title: "May be tax-deductible", desc: "Self-employed individuals can often deduct premiums, confirm with your tax advisor." },
      { icon: PiggyBank, title: "HSA-eligible options", desc: "Pair a qualifying plan with an HSA for tax-advantaged savings." },
      { icon: Stethoscope, title: "See any doctor", desc: "No employer, no restrictions, choose the doctors and specialists you want." },
      { icon: Globe, title: "Coverage that travels", desc: "Work anywhere; your nationwide PPO coverage comes with you." },
    ],
  },
  faqHeading: "Self-employed coverage questions",
  faqs: [
    { q: "Are my premiums tax-deductible?", a: "Often, yes. Self-employed individuals may be able to deduct health-insurance premiums. A licensed agent (and your tax advisor) can confirm what applies to you." },
    ...COMMON_FAQS,
  ],
  finalHeading: "See self-employed PPO options in about two minutes.",
}

export const cobraConfig: FunnelConfig = {
  segment: "cobra",
  hero: {
    eyebrow: "Private PPO · COBRA alternative",
    headline: [{ text: "Leaving a job? You may pay " }, { text: "less than COBRA", em: true }, { text: "." }],
    subhead: "Healthy adults under 65 can often replace COBRA with a private PPO, keep your doctors and stop overpaying. A few quick questions and a licensed agent compares your options, free.",
  },
  benefits: {
    eyebrow: "COBRA alternative",
    heading: "A better value than COBRA, for many.",
    items: [
      { icon: Wallet, title: "Often costs less", desc: "Many healthy adults find a private PPO for less than they'd pay for COBRA." },
      { icon: Stethoscope, title: "Keep your doctors", desc: "Broad PPO networks help you hold on to the physicians you already see." },
      { icon: RefreshCw, title: "No coverage lapse", desc: "Move off COBRA to a plan that continues as long as you need it." },
      { icon: HeartHandshake, title: "A person to compare", desc: "A licensed agent lines up your options against COBRA, side by side." },
    ],
  },
  faqHeading: "COBRA alternative questions",
  faqs: [
    { q: "How does this compare to COBRA?", a: "For many healthy adults under 65, a private PPO costs less than COBRA while keeping similar networks. A licensed agent will compare your specific options side by side." },
    ...COMMON_FAQS,
  ],
  finalHeading: "Compare COBRA alternatives in about two minutes.",
}

export const ppoConfig: FunnelConfig = {
  segment: "", // universal quiz; submits as the PPO bucket
  hero: {
    eyebrow: "Private PPO · Doctor freedom",
    headline: [{ text: "See " }, { text: "any doctor", em: true }, { text: ". Anywhere. No referrals." }],
    subhead: "A private PPO gives you the freedom marketplace and HMO plans don't, any doctor or specialist, nationwide, without asking permission. A few quick questions and we'll match you, free.",
  },
  benefits: {
    eyebrow: "Doctor freedom",
    heading: "The freedom a PPO is built for.",
    items: [
      { icon: Stethoscope, title: "Any doctor, no referrals", desc: "See any physician or specialist directly, no permission slips required." },
      { icon: Globe, title: "Nationwide network", desc: "Coverage that follows you across the country, not one narrow region." },
      { icon: Network, title: "Out-of-network covered", desc: "PPO plans still help with care outside the network when you need it." },
      { icon: HeartHandshake, title: "Keep your specialists", desc: "Broad networks make it easier to keep the doctors you already trust." },
    ],
  },
  faqHeading: "PPO coverage questions",
  faqs: [
    { q: "What is a private PPO?", a: "A PPO (Preferred Provider Organization) plan lets you see any doctor or specialist, usually without referrals, with nationwide coverage, including out-of-network care." },
    ...COMMON_FAQS,
  ],
  finalHeading: "Find your PPO plan in about two minutes.",
}

export const smallBusinessConfig: FunnelConfig = {
  segment: "small_business",
  hero: {
    eyebrow: "Private PPO · Group benefits",
    headline: [{ text: "Benefits that help you " }, { text: "keep great people", em: true }, { text: "." }],
    subhead: "Small-group PPO plans for businesses with 2-50 employees, competitive benefits, possible tax advantages, and a licensed agent to set it all up. Answer a few questions to get started, free.",
  },
  benefits: {
    eyebrow: "For small business",
    heading: "Group benefits that punch above their weight.",
    items: [
      { icon: Users, title: "Attract & keep talent", desc: "Real benefits help you compete for and retain the people you count on." },
      { icon: FileText, title: "Possible tax advantages", desc: "Group premiums are often deductible; some employers may qualify for credits." },
      { icon: Globe, title: "Nationwide PPO", desc: "Give your team broad, flexible coverage that works wherever they are." },
      { icon: HeartHandshake, title: "An agent to set it up", desc: "A licensed specialist handles the setup so you can stay focused on the business." },
    ],
  },
  faqHeading: "Small business coverage questions",
  faqs: [
    { q: "How many employees do I need?", a: "Small-group PPO plans typically fit businesses with 2-50 employees. A licensed agent will walk you through eligibility and setup." },
    ...COMMON_FAQS,
  ],
  finalHeading: "Get group plan options in about two minutes.",
}
