import type { FunnelConfig } from "./types"

// COBRA funnel — data extracted verbatim from the original app/cobra/page.tsx.
// The QuizEngine renders this; no copy was changed in the extraction.
export const cobraConfig: FunnelConfig = {
  slug: "cobra",
  funnelType: "cobra",
  localStorageKey: "cobraQuizData",
  storageVersion: 1,
  trustedFormId: "cobra-alternative-finder",
  exitIntentSessionKey: "exitIntentShown_cobra",
  landingGate: { kind: "step0" },

  landing: {
    hero: {
      bgImage: "/images/heroes/cobra.jpg",
      badge: { icon: "alert", text: "COBRA Alternatives - Free Consultation" },
      headline: [
        { text: "COBRA Is " },
        { text: "Expensive", em: true },
        { text: ". A Private PPO Can " },
        { text: "Cost Half", em: true },
        { text: "." },
      ],
      subhead: [
        {
          text: "Healthy adults under 65 can replace COBRA with a private PPO and keep their doctors. Many clients save ",
        },
        { text: "30 to 60%", em: true },
        { text: " per month." },
      ],
      painPoints: [
        "You are paying 102% of the full premium. Your employer pays nothing.",
        "COBRA expires in 18 months and you need a long-term plan that fits your life.",
        "You are locked into a plan that may not match the doctors or coverage you actually need now.",
      ],
      ctaLabel: "See My COBRA Alternatives - Free",
      ctaSubtext: "Takes 90 seconds. No obligation. Licensed agents only.",
    },

    statsBar: [
      { icon: "dollar", text: "COBRA: hundreds to thousands/mo" },
      { icon: "trendingDown", text: "Most clients save 30-50%" },
      { icon: "globe", text: "Nationwide PPO Networks" },
      { icon: "stethoscope", text: "No Referrals Required" },
    ],

    problemSolution: {
      heading: "COBRA Was Never Meant to Be a Long-Term Plan",
      subhead:
        "COBRA is a bridge. It was never built to be affordable. The moment you lose your job, your employer stops paying. You pay everything plus a 2% admin fee. Most people can get the same or better coverage for far less.",
      problemLabel: "The Problem",
      problemTitle: "Staying on COBRA",
      problems: [
        "Costs up to 102% of your full premium - your former employer's share plus yours",
        "Locked into your old employer's plan and network with no flexibility",
        "Must pay in full each billing cycle or lose coverage with limited grace",
        "Standard COBRA expires after 18 months (some qualifying events extend to 29 or 36 months)",
        "Same plan even if it no longer fits your life or budget",
        "Premiums can increase as the underlying group plan rates change at renewal",
      ],
      solutionLabel: "The Solution",
      solutionTitle: "Private PPO Alternatives",
      advantages: [
        "Private PPO plans with nationwide coverage and doctor freedom",
        "Keep your preferred doctors or switch to better specialists",
        "Flexible plan tiers to match your healthcare needs and lifestyle",
        "Coverage that continues as long as you need it",
        "No referrals required to see any specialist, anywhere",
        "Enroll in days, not weeks. Same-day applications available.",
      ],
    },

    coverage: {
      heading: "Private PPO Plans Cover Everything COBRA Did",
      subhead: "Same benefits. Real networks. A fraction of the cost.",
      items: [
        { icon: "stethoscope", label: "Doctor Visits", desc: "Primary care and specialist visits covered" },
        { icon: "globe", label: "Nationwide Access", desc: "Use doctors anywhere in the country" },
        { icon: "activity", label: "Emergency Care", desc: "ER visits covered at any hospital" },
        { icon: "pill", label: "Prescriptions", desc: "Broad drug formulary, often at lower cost" },
        { icon: "smile", label: "Dental & Vision", desc: "Add-on options available with most plans" },
        { icon: "heart", label: "Mental Health", desc: "Therapy and counseling covered" },
        { icon: "eye", label: "Preventive Care", desc: "Annual exams, screenings, and vaccines" },
        {
          icon: "zap",
          label: "Telemedicine",
          desc: "Concierge virtual visits 24/7 with board-certified physicians",
        },
      ],
    },

    howItWorks: {
      heading: "Switching Takes 3 Steps. COBRA Takes Your Money.",
      subhead: "Stop overpaying. Start today.",
      steps: [
        {
          step: "1",
          title: "Tell Us Your Situation",
          desc: "Answer a few quick questions about your timeline and current COBRA cost. Takes 90 seconds.",
        },
        {
          step: "2",
          title: "See Your Options",
          desc: "A licensed specialist compares private PPO plans to your COBRA cost side by side.",
        },
        {
          step: "3",
          title: "Switch and Save",
          desc: "Enroll in minutes. Coverage starts the 1st of next month. No lapse in coverage.",
        },
      ],
    },

    whyDynasty: {
      badge: "Why Dynasty",
      heading: "Losing Your Job Is Hard. Losing Your Coverage Does Not Have to Follow.",
      paragraphs: [
        "Dynasty Insurance Group connects executives and entrepreneurs leaving COBRA with private PPO plans built for high earners, often with broader networks and richer benefits. We are not a public exchange. We are licensed specialists who curate carrier-direct options for you.",
        "No pressure. Concierge service. Just answers.",
      ],
      features: [
        {
          icon: "shield",
          title: "Licensed in Your State",
          desc: "Every agent we work with is state-licensed and compliant.",
        },
        {
          icon: "dollar",
          title: "Carrier-Compensated",
          desc: "Premiums are identical whether you work with us or buy direct. Carriers compensate us.",
        },
        {
          icon: "clock",
          title: "5-Minute Response",
          desc: "A real specialist contacts you within 5 minutes on business days.",
        },
        {
          icon: "lock",
          title: "Your Data Is Secure",
          // Verbatim from the original page: `&rsquo;` sits inside a JS string
          // literal there, so it renders as literal text (a pre-existing quirk),
          // not a curly apostrophe. Preserved exactly — do not "fix".
          desc: "We don&rsquo;t sell your information to advertisers. Your details go only to our licensed insurance partners.",
        },
      ],
    },

    savingsStories: {
      heading: "Real People Who Dropped COBRA",
      subhead:
        "Healthy adults under 65 are walking away from COBRA, keeping their doctors, and saving hundreds every month with private PPO plans.",
      stories: [
        {
          name: "Marcus B.",
          situation: "Laid off after 12 years",
          location: "Houston, TX",
          before: "$1,090/mo COBRA",
          after: "$640/mo PPO",
          quote:
            "COBRA was killing my severance. The agent showed me a private PPO at $640 with the same network as my old job. Saved me almost $5,000 over six months.",
        },
        {
          name: "Sandra L.",
          situation: "Family of 4, severance ending",
          location: "Atlanta, GA",
          before: "$1,820/mo COBRA",
          after: "$815/mo PPO",
          quote:
            "Family of four on COBRA was $1,820 a month. We switched to a private family PPO at $815, kept our pediatrician, and the deductible is actually lower.",
        },
        {
          name: "Daniel P.",
          situation: "Career change",
          location: "Tampa, FL",
          before: "$1,150/mo COBRA",
          after: "$720/mo PPO",
          quote:
            "I was about to start a new business and COBRA at $1,150 wasn't going to work. Got a private PPO for $720, kept my doctor, and the premiums are tax deductible now too.",
        },
      ],
      disclaimer:
        "Client savings stories are illustrative of typical outcomes. Actual rates depend on age, household composition, state, plan selection, and underwriting. A licensed agent will quote you directly.",
    },

    finalCta: {
      heading: "Stop Overpaying. Start Saving.",
      subhead: "It takes 90 seconds to find out how much you could save. Licensed agents, no obligation.",
      ctaLabel: "Check My Alternatives - Free",
      trustBadges: [
        { icon: "lock", text: "Secure & Private" },
        { icon: "shield", text: "Free, No Obligation" },
        { icon: "check", text: "Licensed Agents" },
      ],
    },
  },

  steps: [
    {
      type: "cardChoice",
      id: "cobraTimeline",
      fieldKey: "cobraTimeline",
      heading: "What's your COBRA situation?",
      subhead: "This helps us find the most urgent alternatives for you.",
      layout: "plain",
      options: [
        { value: "just-received", label: "Just got the COBRA notice", desc: "Recently lost job coverage" },
        {
          value: "on-cobra-expensive",
          label: "Currently on COBRA, too expensive",
          desc: "Actively paying COBRA now",
        },
        { value: "cobra-ending", label: "COBRA ending in 60 days", desc: "Approaching the 18-month limit" },
        {
          value: "exploring",
          label: "Exploring options before deciding",
          desc: "Haven't signed up for COBRA yet",
        },
      ],
    },
    {
      type: "cardChoice",
      id: "cobraCost",
      fieldKey: "cobraCost",
      heading: "What are you paying for COBRA each month?",
      subhead: "Include all family members on the plan.",
      layout: "trailingDollar",
      options: [
        { value: "Under $400/month", desc: "Relatively low for an individual plan" },
        { value: "$400 - $700/month", desc: "Typical for a single person" },
        { value: "$700 - $1,200/month", desc: "Family or older individual" },
        { value: "Over $1,200/month", desc: "Large family or senior coverage" },
      ],
    },
    {
      type: "cardChoice",
      id: "coverageNeeded",
      fieldKey: "coverageNeeded",
      heading: "Who needs coverage?",
      subhead: "We'll find plans sized for your household.",
      layout: "iconGold",
      options: [
        { value: "Just me", icon: "activity", desc: "Individual plan" },
        { value: "Me + spouse", icon: "heart", desc: "Two adults" },
        { value: "Me + children", icon: "users", desc: "Parent with kids" },
        { value: "Entire family", icon: "users", desc: "Spouse and children" },
      ],
    },
    {
      type: "cardChoice",
      id: "healthConsiderations",
      fieldKey: "healthConsiderations",
      heading: "Any ongoing health needs?",
      subhead: "Helps us prioritize the right network and benefits.",
      layout: "iconMuted",
      options: [
        {
          value: "Healthy, just need a safety net",
          icon: "shield",
          iconColor: "text-green-600",
          desc: "Minimal regular care",
        },
        {
          value: "I take regular medications",
          icon: "pill",
          iconColor: "text-blue-600",
          desc: "Prescription drug coverage important",
        },
        {
          value: "Managing a chronic condition",
          icon: "activity",
          iconColor: "text-orange-600",
          desc: "Ongoing specialist care",
        },
        {
          value: "Currently in treatment",
          icon: "heart",
          iconColor: "text-red-600",
          desc: "Active care continuity is critical",
        },
      ],
    },
    {
      type: "stateSearch",
      id: "state",
      fieldKey: "state",
      heading: "What state do you live in?",
      subhead: "Carrier networks and plan availability vary by state.",
    },
    {
      type: "contact",
      id: "contact",
      heading: "Where should we send your options?",
      subhead: "A licensed specialist will reach out within 5 minutes.",
      askAge: true,
      askGovCoverage: true,
      govCoverageLabel: "Currently enrolled in Medicaid or Medicare?",
      govCoverageWarning:
        "Our private PPO alternatives are designed for adults not currently enrolled in Medicaid or Medicare. A licensed specialist can still walk you through your options.",
      consentText: [
        {
          text: "By checking this box and submitting this form, I provide my express written consent to be contacted by Holy Impact Media and its licensed insurance partners, including Dynasty Insurance Group, via phone calls, text messages (including via autodialer or prerecorded message), and email regarding health insurance options. I understand this website is operated by Holy Impact Media, a marketing company, which will route my information to licensed insurance agents. Consent is not required to purchase any goods or services. Reply STOP to opt out of SMS. I also consent under any applicable state telemarketing laws, including the Florida Telephone Solicitation Act. See our ",
        },
        { text: "Terms of Service", href: "/terms" },
        { text: " and " },
        { text: "Privacy Policy", href: "/privacy" },
        { text: "." },
      ],
      submitLabel: "Continue",
    },
    {
      type: "name",
      id: "name",
      heading: "Almost there. What's your name?",
      subhead: "So your specialist can personalize your options.",
      submitLabel: "Show My COBRA Alternatives",
      submittingLabel: "Finding your options...",
      secureNote: "Your information is encrypted and never sold",
    },
  ],

  exitIntent: {
    savingsAmount: "$5,400",
    headline: "Every month on COBRA is money you'll never get back.",
    beforeLabel: "Was paying",
    beforeValue: "$1,090/mo COBRA",
    afterLabel: "Now pays",
    afterValue: "$640/mo PPO",
    comparisonName: "Marcus B. - Houston, TX",
  },

  thankYou: {
    headlineBefore: "Great news, ",
    headlineAfter: ". Alternatives exist.",
    subhead:
      "A licensed specialist is reviewing your options now and will reach out within 5 minutes.",
    savingsEstimator: {
      fromKey: "cobraCost",
      badge: "Estimated Savings",
      currentLabel: "Your COBRA",
      currentSubLabel: "Before tax",
      altLabel: "Estimated Alternative",
      altSubLabel: "Private PPO alternative",
      ranges: {
        "Under $400/month": { cobra: "~$400/mo", low: 160, high: 240 },
        "$400 - $700/month": { cobra: "~$550/mo", low: 220, high: 330 },
        "$700 - $1,200/month": { cobra: "~$950/mo", low: 380, high: 570 },
        "Over $1,200/month": { cobra: "~$1,200+/mo", low: 480, high: 720 },
      },
      fallback: { cobra: "your current amount", low: 200, high: 400 },
      disclaimer:
        "Estimates based on national plan averages. Actual rates depend on plan selection and coverage level.",
    },
    referencePrefix: "CB-PENDING",
    timelineHeading: "What Happens Next?",
    timeline: [
      {
        title: "Right Now",
        badgeText: "Complete",
        desc: "Your information has been securely submitted. Our system is matching you with COBRA alternatives available in your state.",
      },
      {
        title: "Within 5 Minutes",
        badgeText: "In Progress",
        desc: "A licensed health insurance specialist will review your COBRA situation and prepare alternative plan comparisons.",
        showReference: true,
      },
      {
        title: "Next Steps",
        badgeText: "Upcoming",
        desc: "Your specialist will walk you through private PPO options side-by-side with your current COBRA costs and benefits.",
      },
    ],
    disclaimer:
      "By submitting this form, you agree to be contacted by licensed insurance agents. Coverage estimates are illustrative only. Actual premiums depend on age, location, and plan selection.",
  },

  buildPayload: (answers, meta) => ({
    firstName: answers.firstName,
    lastName: answers.lastName,
    email: answers.email,
    phone: answers.phone,
    age: answers.age,
    state: answers.state,
    tcpaConsent: answers.tcpaConsent,
    trustedFormCertUrl: meta.trustedFormCertUrl,
    funnelType: "cobra",
    quizAnswers: {
      cobraTimeline: answers.cobraTimeline,
      cobraCost: answers.cobraCost,
      coverageNeeded: answers.coverageNeeded,
      healthConsiderations: answers.healthConsiderations,
      govCoverage: answers.govCoverage,
    },
    utmSource: meta.utm.source,
    utmMedium: meta.utm.medium,
    utmCampaign: meta.utm.campaign,
  }),
}
