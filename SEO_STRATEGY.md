# SEO Strategy: Holy Impact Media → Dynasty Insurance Group

**Owner:** Holy Impact Media (operator)
**Routes leads to:** Dynasty Insurance Group (licensed insurance agency)
**Last updated:** 2026
**Status:** Living document — review quarterly

---

## 1. Executive summary

The cheapest qualified leads in private health insurance come from **long-tail, intent-rich organic search** — not paid auctions on broad terms. This document is the playbook for owning those queries, ranked by ROI and timed for a 90-day execution window. Every tactic is checked against TCPA, FTC, CCPA, and FTC Endorsement Guides so we ship growth without inviting enforcement.

The ICP is healthy adults aged 18 to 63 with household income above the ACA subsidy cliff ($60K+ individual / $130K+ family of four), often self-employed or small-business, in 30 specific states. They search for terms like *"what to do when you make too much for Obamacare"* and *"best COBRA alternative"* — high-intent, low-competition queries that convert at 5–15% versus 1–2% on broad insurance terms.

**Targets, 12 months out:**

| Metric | Baseline (today) | 12-month target |
|---|---|---|
| Indexed pages | ~10 | 80+ |
| Organic monthly sessions | ~0 | 25,000+ |
| Organic-sourced leads / month | ~0 | 350+ |
| Blended CAC (paid + organic) | n/a | ≤$22 |
| Organic share of leads | 0% | 55% |

---

## 2. ICP recap (drives every keyword decision)

| Dimension | Definition |
|---|---|
| Age | 18–63 (excludes Medicare segment by design) |
| Household income | $30K to $150K+ (sweet spot $60K–$125K) |
| Health status | Generally healthy; no cancer/diabetes/heart disease in last 5 years |
| Employment | W-2 with no employer plan, 1099/contractor, small business owner (2–50 employees) |
| Location | 30 serviced states (`lib/serviced-states.ts`) |
| Pain | Earns too much for ACA subsidy; HMO networks too narrow; COBRA too expensive |
| Search intent | High commercial intent (already shopping), low brand awareness |

Anything outside this ICP — Medicare-eligible, Medicaid-eligible, severely ill, residents of non-serviced states — is filtered out at the funnel level. SEO content should not attract traffic outside the ICP because every off-target click costs money to filter and erodes Quality Score across the board.

---

## 3. Compliance constraints that shape SEO

Every channel below is filtered through these. If a tactic violates one, it does not ship — period.

### 3.1 TCPA / FTSA
- All landing pages with a phone-capture form must include the express written consent block exactly as it lives on the funnels today. If we build a state page or comparison page with its own form, the consent text is non-negotiable.
- No SMS marketing without prior opt-in. Email-only lead magnets do not require TCPA consent, but SMS opt-in collection on lead-magnet forms must include the same consent language with "Reply STOP."
- Florida residents: FTSA carve-out language (already in funnels) must appear on every form that captures a Florida phone number. **Do not run paid Florida traffic to forms without this.**

### 3.2 FTC Endorsement Guides (16 CFR Part 255)
- Any "best of" or "top X" content (e.g., *"Best COBRA Alternatives 2026"*) must include an affiliate-style disclosure: *"We are compensated when consumers we connect with insurance partners purchase coverage. This compensation may influence which carriers we feature."* — top of page, above the fold.
- Customer testimonials must be real, verifiable, and represent typical results. Stock-photo testimonials with attributed names are an enforcement target. **Do not invent quotes.**
- "As featured in" badges (Forbes, USA Today, etc.) require an actual real article. Do not buy fake-press badges.

### 3.3 FTC Health Claims (16 CFR Part 260 + the 2023 Health Products Compliance Guidance)
- Do not claim a plan "covers everything" or "guarantees" a specific outcome.
- Pricing claims (e.g., *"30 to 60% less than COBRA"*) must be substantiated with documented carrier rate comparisons. If we publish a number, store the source comparison file in `docs/substantiation/`.
- Avoid superlatives without qualification: *"the best plan"*, *"the cheapest"*. Use *"a competitive option for…"* instead.

### 3.4 CCPA / CPRA
- Cookie banner: required for California residents. Currently missing. Must be added before scaling paid traffic.
- Every landing page that captures California traffic must link to the privacy policy with the CCPA section in the footer. Already done sitewide via `components/Footer.tsx`.
- Honor Global Privacy Control (GPC) headers automatically. Implementation: a server-side check in `proxy.ts` that reads `Sec-GPC: 1` and skips third-party advertising cookies for those visitors.

### 3.5 ADA / WCAG 2.1 AA
- Insurance is a high-litigation accessibility category. Every page must:
  - Have alt text on hero images (currently empty `alt=""` — to fix)
  - Color contrast ≥ 4.5:1 for body text
  - Keyboard-navigable forms with visible focus rings
  - Form errors announced via `aria-live`

### 3.6 State licensing disclosure
- We service 30 states. Pages must not imply national coverage. Every state landing page should include: *"Dynasty Insurance Group's licensed agents serve [State Name] residents. We do not currently offer coverage outside our 30 serviced states."*
- For state pages targeting non-serviced states (which we should not build), the page would need to redirect or note the limitation prominently.

### 3.7 Medicare exclusion (critical)
- We explicitly do not service the Medicare market. Per CMS Marketing Rules (42 CFR § 422.2260+), Medicare lead-gen has its own strict regime (third-party marketing organization registration, 48-hour scope of appointment forms, etc.).
- All copy must avoid implying we sell Medicare. The age cap (≤63) on the funnels is a compliance feature, not just a positioning choice.
- Do not bid on Medicare keywords in paid search. Do not write organic content optimizing for Medicare queries.

---

## 4. Strategic priorities (ranked by ROI)

| # | Tactic | Effort | Time to first lead | 12mo lead estimate | Cost per lead |
|---|---|---|---|---|---|
| 1 | Programmatic state pages (×30) | 1 week | 30–60 days | 80–150/mo | <$2 |
| 2 | Long-tail comparison content | 4 weeks | 60–90 days | 60–120/mo | <$3 |
| 3 | Question-driven blog content (×40) | 6 months | 90–120 days | 50–100/mo | <$5 |
| 4 | Schema markup additions | 1 day | 30 days | +15–25% CTR sitewide | $0 |
| 5 | Lead magnet (PDF + drip) | 1 week | 30 days | 100–200/mo (email) | <$1 |
| 6 | Off-page (Reddit, YouTube, newsletters) | Ongoing | 60–90 days | 80–200/mo | <$8 |
| 7 | Google Ads → SEO flywheel | Ongoing | 1 day | 100–500/mo | $15–40 |

Cumulative target: **350+ organic-sourced leads/mo by month 12**, blended CAC ≤$22.

---

## 5. Tactic 1: Programmatic state pages (highest ROI)

### 5.1 Why first

Each of the 30 serviced states becomes a dedicated SEO surface targeting commercial-intent local queries. *"private health insurance Florida no marketplace"* has 90 monthly searches with KD 22 (low). *"Texas health insurance for self-employed"* has 320 monthly searches with KD 28. Multiply by 30 states and each query type and you have ~600 long-tail surfaces with cumulative volume of 8,000–15,000 monthly searches we can rank for in 6 months.

### 5.2 URL structure

```
/state/florida              ← canonical
/state/texas
/state/colorado
…
```

Use `/state/{slug}` (slug = lowercase, hyphenated). Generate via Next.js dynamic segment with `generateStaticParams` so all 30 are statically rendered at build time.

### 5.3 Template anatomy (one component, 30 outputs)

```
app/state/[slug]/page.tsx
```

Each page renders:

1. **H1 with state name + intent**: *"Private PPO Health Insurance for Florida Residents Without Marketplace Subsidies"*
2. **State-specific hero**: median household income + ACA subsidy cap for that state, sourced from a static JSON in `lib/state-data.ts`
3. **"Why Florida residents come to us"** section — pulls 3–4 ICP pain points
4. **State-specific carrier mention**: *"In Florida we route to plans from Blue Cross Blue Shield of Florida, Cigna, and United Healthcare"* (verify before publishing per state)
5. **Embedded quiz CTA**: button to `/individual` with `?utm_source=state-page&utm_state=fl`
6. **State-specific FAQ** (5 questions, each schema-marked): *"Do I qualify for ACA subsidies in Florida at $80K income?"*, *"How fast can I enroll in private PPO coverage in Florida?"*, etc.
7. **Trust strip + footer** (existing components)

### 5.4 State data file

```ts
// lib/state-data.ts
export const STATE_DATA = {
  florida: {
    name: "Florida",
    abbreviation: "FL",
    medianHouseholdIncome: 67917,
    acaSubsidyCap400Pct: { individual: 60240, family4: 124800 },
    population: 22610726,
    largestCities: ["Miami", "Orlando", "Tampa", "Jacksonville"],
    ftsa: true,  // triggers Florida-specific consent
    carriers: ["Blue Cross Blue Shield of Florida", "Cigna", "United Healthcare", "Aetna"],
  },
  // …29 more
}
```

### 5.5 Metadata per page

Each state page exports its own `generateMetadata`:

- `title`: *"Private PPO Plans for {State} Residents | Holy Impact Media"*
- `description`: 155 chars, includes state name + ICP qualifier + CTA
- `alternates.canonical`: `/state/{slug}`
- OG image: dynamic, generated via Next.js `opengraph-image.tsx` in the `[slug]` segment using the state name overlaid on a brand-consistent image
- `keywords`: state-specific long-tail set

### 5.6 Schema markup (per page)

Add `LocalBusiness` (or `InsuranceAgency` subtype) schema:

```json
{
  "@type": "InsuranceAgency",
  "name": "Dynasty Insurance Group — Florida",
  "areaServed": { "@type": "State", "name": "Florida" },
  "parentOrganization": { "@id": "https://dynastyinsurancenetwork.com/#organization" }
}
```

Plus `FAQPage` schema for the state-specific FAQ section.

### 5.7 Internal linking

- Footer "Coverage Options" column gains a "By State" link → `/state` index page
- Build `/state/page.tsx` as a hub linking to all 30
- Every state page links back to the 6 funnel pages with descriptive anchor text (not "click here")
- Homepage hero CTA gains a small "or browse by state" link

### 5.8 Build order

Week 1: ship template + 5 highest-volume states (FL, TX, NC, GA, OH).
Week 2: remaining 25 states.

---

## 6. Tactic 2: Comparison content

### 6.1 Target queries (volume / KD / CPC pulled from Ahrefs Q1 2026)

| Query | Vol | KD | CPC | Page slug |
|---|---|---|---|---|
| cobra vs private insurance | 1,300 | 24 | $4.20 | `/compare/cobra-vs-private-ppo` |
| ppo vs hmo which is better | 2,400 | 29 | $3.80 | `/compare/ppo-vs-hmo` |
| aca marketplace vs private insurance | 880 | 21 | $5.10 | `/compare/aca-vs-private-ppo` |
| short term vs long term health insurance | 720 | 18 | $3.40 | `/compare/short-term-vs-private-ppo` |
| medishare vs health insurance | 590 | 15 | $2.90 | `/compare/medishare-vs-private-ppo` |

Total addressable monthly: ~5,900 searches at avg KD 21.

### 6.2 Page structure (template)

1. **H1 with the comparison** (exact-match query)
2. **TL;DR table** above the fold — 5–7 row decision matrix (cost, network, when it makes sense, when it doesn't)
3. **Inline funnel CTA** at end of TL;DR ("Get matched with a private PPO specialist in 90 seconds →")
4. **2,000–2,500 words** of substantive content. Each section 200–400 words covering: cost, network, deductibles, prescriptions, dental/vision, when X is better, when Y is better
5. **Real numbers** with source citations — pricing from carrier filings on hhs.gov, deductibles from CMS data
6. **FTC compensation disclosure** at top: *"Holy Impact Media is compensated when consumers we connect with insurance partners purchase coverage. This may influence which products we feature. We do not feature carriers we don't have access to. Read our [advertising disclosure](/advertising-disclosure)."*
7. **Related FAQs** with `FAQPage` schema
8. **Second CTA** at bottom + sticky mobile CTA

### 6.3 Compensation disclosure page

Create `/advertising-disclosure` once. Link from every comparison page header. Required content:

- Holy Impact Media's compensation model (per-lead from Dynasty + carrier referral fees if applicable)
- Which carriers we have direct relationships with
- Which carriers we do not have access to (if any)
- How rankings/comparisons are determined
- Statement that compensation does not affect the consumer's premium

This single page closes 90% of FTC Endorsement Guides exposure for the comparison content category.

---

## 7. Tactic 3: Question-driven blog content

### 7.1 Target query categories

**Category A — ICP pain (highest convert):**
- *"What if I make too much for Obamacare subsidies"* (590/mo, KD 18)
- *"Subsidy cliff explained"* (480/mo, KD 12)
- *"Health insurance for healthy adults under 65"* (140/mo, KD 8)
- *"Why is my employer health insurance so expensive"* (1,100/mo, KD 22)

**Category B — Self-employed/1099:**
- *"Health insurance for 1099 contractors"* (880/mo, KD 19)
- *"Can I deduct health insurance premiums as self-employed"* (3,400/mo, KD 35) — high volume but harder
- *"Best health insurance for freelancers"* (590/mo, KD 24)

**Category C — Transition events:**
- *"Best alternative to COBRA"* (720/mo, KD 16)
- *"Lost my job how do I get health insurance"* (1,800/mo, KD 28)
- *"Health insurance after layoff"* (1,300/mo, KD 21)

**Category D — Family/situation:**
- *"Family health insurance not through employer"* (260/mo, KD 14)
- *"Health insurance for family of 4 self-employed"* (170/mo, KD 9)

### 7.2 Editorial calendar (40 posts in 6 months)

| Month | Posts | Categories |
|---|---|---|
| 1 | 8 | Cat A x4, Cat C x4 (highest commercial intent) |
| 2 | 8 | Cat A x3, Cat B x3, Cat C x2 |
| 3 | 8 | Cat B x4, Cat D x4 |
| 4 | 8 | Cat A x2, Cat B x2, Cat C x2, Cat D x2 |
| 5 | 4 | Refresh top 4 by traffic with updated data |
| 6 | 4 | Long-form pillar pages (5,000+ words) |

### 7.3 Per-post template

- H1 = exact-match query (within reason)
- TL;DR box at top (100 words)
- 1,500–2,500 words
- 2 inline CTAs to relevant funnel
- 1 sticky-on-scroll quiz CTA on mobile
- "Last updated" timestamp (Google rewards freshness)
- Author byline: actual licensed insurance agent name + bio with state license number (E-A-T signal — critical for YMYL content)
- Internal links to 3 related blog posts + 2 funnel pages
- `Article` schema with `author`, `datePublished`, `dateModified`, `publisher`

### 7.4 E-A-T signals (non-negotiable for health/insurance)

Google classifies health and finance content as YMYL ("Your Money or Your Life") and applies stricter quality standards. Every post must demonstrate Expertise, Experience, Authoritativeness, Trustworthiness:

- **Author byline with credentials** — real agent name, state license number, link to their bio page
- **Reviewed by** byline — separate licensed agent who reviewed for accuracy, with timestamp
- **Sources cited** — link to CMS, hhs.gov, KFF.org, BLS data
- **Date stamps** — published + last reviewed
- **Disclosure** — Holy Impact Media compensation disclosure linked in every post header
- **Avoid medical claims** — never say a plan "treats" or "cures." Stick to coverage descriptions.

### 7.5 Content production pipeline

1. **Brief** — keyword target, search intent, competitor SERP analysis (top 3 organic results for the query), word count target
2. **Draft** — Claude generates a structured first draft from the brief
3. **Fact-check** — licensed agent reviews for accuracy, adds real-world context, signs as author or reviewer
4. **Edit** — copy editor polishes, ensures FTC disclosure present, ensures no medical claims, checks state licensing language
5. **Publish** — Next.js MDX route, schema markup, internal links
6. **Distribute** — share on Reddit, Twitter, LinkedIn, email list (see Tactic 6)

---

## 8. Tactic 4: Schema markup additions (free, high impact)

### 8.1 Currently in place
- `Organization` (root layout)
- `WebSite` (root layout)
- `Organization` for Holy Impact Media (added)

### 8.2 Add to root layout
- `InsuranceAgency` subtype for Dynasty (more specific than Organization, unlocks insurance-specific search features)

### 8.3 Add per page
- `FAQPage` on every funnel landing page (you already write the FAQs as plain JSX — just add JSON-LD)
- `BreadcrumbList` on every non-home page
- `Article` schema on every blog post
- `LocalBusiness` (state) on every state page
- `HowTo` schema on COBRA page ("How to switch from COBRA to a private PPO" — 7-step guide)

### 8.4 Verification

After deploying, run every public URL through:
- Google Rich Results Test (search.google.com/test/rich-results)
- Schema.org Validator (validator.schema.org)
- Bing Webmaster Tools

Set up a monthly recurring task to re-check after content updates.

---

## 9. Tactic 5: Lead magnet for cheap email leads

### 9.1 The asset

**"Private PPO Buyer's Guide: Real Coverage When the Marketplace Won't Help You"** — 12-page PDF, professionally designed, no fluff. Contents:

1. Why your income disqualifies you from ACA subsidies (1 page)
2. The four real options when you're priced out (1 page)
3. Side-by-side comparison: marketplace HMO vs. private PPO (2 pages)
4. The three numbers that matter most when shopping (1 page)
5. Carrier networks: who covers what (1 page)
6. Common mistakes that cost $5K+ per year (1 page)
7. State-specific notes for our 30 serviced states (3 pages, scannable)
8. Glossary (1 page)
9. Next step: free 90-second match with a licensed specialist (1 page)

### 9.2 Capture form

- **Email-only** (no phone). This drops TCPA risk to near zero — no phone, no autodialer, no consent required for SMS.
- Standard email-marketing consent: *"By submitting, I agree to receive Holy Impact Media's educational emails. I can unsubscribe at any time via the link in any email."*
- Capture: first name, email, state. Three fields, no more.
- Embed on every blog post, every comparison page, in a slide-up on funnel exit-intent

### 9.3 Drip campaign (5 emails over 14 days)

| Day | Subject | Goal |
|---|---|---|
| 0 | Your guide is here. Here's what to read first. | Deliver PDF |
| 2 | The #1 mistake I see when people leave their employer plan | Educate, build trust |
| 5 | Why your COBRA quote is probably 40% too high | Pain point |
| 9 | A real example: how Lisa in Tampa cut $4,200/year | Case study (real, with permission) |
| 14 | Want me to find you a plan? Takes 90 seconds. | CTA to funnel |

After day 14, drop into a monthly newsletter (industry updates, rate changes, state-specific notices).

### 9.4 Economics

- Email-only lead cost: $1–3 (ads to lead magnet)
- Email-to-funnel conversion: ~8–15% over 30 days
- Effective phone-lead cost: $7–25 — 3–4× cheaper than direct phone-form ads

---

## 10. Tactic 6: Off-page distribution

### 10.1 Reddit (highest ROI off-page channel for this ICP)

**Targets:** r/personalfinance, r/Entrepreneur, r/freelance, r/HealthInsurance, r/insurance, r/sidehustle, r/digitalnomad, r/smallbusiness, r/selfemployed.

**Approach:** Build a real account, post 3 substantive answers per week for 3 months without ever linking to Holy Impact Media. After establishing karma + history, occasionally drop a relevant link when it actually answers the question. Disclose affiliation per Reddit rules (the site, not just FTC).

**Do not:** spam, post the same content across subs, use throwaway accounts, sock-puppet upvote.

**Bonus:** get linked in a subreddit's wiki for "alternatives to ACA marketplace" or "insurance for freelancers" → permanent free traffic.

### 10.2 YouTube

3–6 minute explainer videos:

- *"What to do when your employer drops your health insurance"*
- *"How to leave COBRA without losing your doctor"*
- *"Health insurance for freelancers, explained in 5 minutes"*
- *"The ACA subsidy cliff: what it is and what to do about it"*

Production: simple talking-head with B-roll, $200–500/video freelance editor. Embed quiz CTA in description + pinned comment + on-screen overlay.

YouTube SEO: title = exact-match query, description includes target keywords, transcript uploaded, end screen with subscribe + visit-website cards.

### 10.3 Newsletter sponsorships

Personal-finance audiences read newsletters more than they read blogs. Sponsor:

- Money With Katie (~$3K)
- Financial Samurai (~$2K)
- Choose FI (~$2K)
- Mr. Money Mustache forum sponsorship (~$500)
- Side Hustle Nation podcast (~$1K)

Each sponsorship = 5K–25K targeted impressions, conversion typically 0.3–1% to email capture, then drip.

### 10.4 Press / link-building

Pitch personal-finance writers at:
- NerdWallet (link from any "best of" article = high authority)
- The Penny Hoarder
- Money.com
- Kiplinger
- US News Money
- Consumer Reports

Pitch angle: data-driven press release. Example: *"31% of self-employed Americans say their health insurance is unaffordable, new Holy Impact Media survey finds."* Run a 500-person SurveyMonkey survey ($300), turn results into a press release, distribute via PRWeb.

### 10.5 Reciprocal partnerships

Find non-competing services for the same ICP:
- Bookkeeping/CPA services for 1099 workers (Bench, Collective, Catch)
- Self-employed mortgage brokers
- LLC/incorporation services (Stripe Atlas, ZenBusiness)

Cross-promote: they recommend us for health insurance, we recommend them for their service. Free distribution at zero cost.

---

## 11. Tactic 7: Paid + organic flywheel

### 11.1 The play

Run small Google Ads budgets ($1,000–3,000/mo) on the **exact long-tail queries we plan to rank for organically**. This:

1. Reveals which queries actually convert (vs. just have search volume)
2. Generates immediate leads while we wait for SEO to mature
3. Trains Google's AI on our landing page intent (slight ranking boost via behavioral signals)
4. Once organic ranks at position 1–3 for a query, we cut the ad and the lead becomes free

### 11.2 Initial keyword set (start here)

| Query | Match type | Max CPC |
|---|---|---|
| private health insurance no marketplace | Exact | $5 |
| best alternative to cobra | Exact | $4 |
| ppo plan no employer | Phrase | $5 |
| health insurance for self employed | Phrase | $7 |
| ACA subsidy cliff | Exact | $3 |

Run 30 days, check conversion data, kill losers, double down on winners.

### 11.3 Negative keywords (mandatory)

Block:
- medicare, medicaid, medishare (we don't sell these)
- free, cheap, affordable (low-intent)
- jobs, careers (intent mismatch)
- meaning, definition, what is (informational, not buying)
- complaints, lawsuit, scam (PR/reputation queries)

### 11.4 Quality Score discipline

- Each ad group → one landing page tightly themed to the query
- Use the relevant funnel landing page or dedicated state page
- Mobile load time <2s (already covered by Next.js + Vercel)
- Quality Score ≥7 keeps CPC down 30–50% vs. competitors

---

## 12. Technical SEO checklist

| Item | Status | Action |
|---|---|---|
| Sitemap.xml | ✓ Done | Already at `/sitemap.xml` via `app/sitemap.ts` |
| Robots.txt | ✓ Done | Disallows `/dashboard`, `/auth`, `/api` |
| HTTPS | ✓ Done | Vercel auto-provisions |
| Canonical URLs | ✓ Done | `alternates: { canonical }` per page |
| Mobile-first | ✓ Done | Responsive across funnels |
| Page speed (Core Web Vitals) | Mostly | Test with PageSpeed Insights monthly |
| Image alt text | ✗ Missing | All hero images use `alt=""` — fix immediately |
| Open Graph tags | ✓ Done | Per-page OG images shipped |
| Structured data (Organization) | ✓ Done | JSON-LD in root layout |
| Structured data (FAQ, Article, etc.) | ✗ Missing | Add per Tactic 4 |
| 301 redirects from old URLs | n/a | None to redirect — fresh build |
| 404 page | Default Next.js | Build branded 404 with funnel CTA |
| Breadcrumbs | ✗ Missing | Add `<BreadcrumbList>` schema sitewide |
| hreflang tags | n/a | Single-language site |
| `NEXT_PUBLIC_SITE_URL` set in prod | ✗ Missing | Set to canonical domain in Vercel env |
| Search Console verified | ? | Verify if not done |
| Bing Webmaster verified | ? | Verify if not done |
| GA4 connected | ✓ Done | Vercel Analytics |
| Cookie banner (CCPA) | ✗ Missing | Required before scaling paid traffic |

---

## 13. Measurement framework

### 13.1 KPIs (review weekly)

| Metric | Source | Target by month 3 | Target by month 12 |
|---|---|---|---|
| Indexed pages in Google | Search Console | 30 | 80 |
| Total organic clicks/mo | Search Console | 1,500 | 25,000 |
| Avg position for ICP queries | Search Console | 18 | 6 |
| Funnel completion rate (organic) | GA4 | 4% | 8% |
| Organic-sourced leads/mo | Internal CRM | 60 | 350 |
| Cost per organic lead | Calculated | <$10 | <$3 |
| Cost per paid lead | Google Ads | $25 | $20 |
| Email-magnet capture rate (page → email) | GA4 | 6% | 12% |
| Email-to-funnel conversion (30-day) | CRM | 8% | 15% |

### 13.2 Dashboards to build (Looker Studio or similar)

1. **Organic traffic by page** — sortable by clicks, impressions, CTR, position
2. **Lead source attribution** — UTM-tagged, broken out by channel and campaign
3. **Funnel completion by source** — paid vs. organic vs. email vs. direct
4. **Cohort LTV** — leads grouped by source, tracked through to "sold" status in CRM

### 13.3 Compliance dashboard

Separate dashboard tracking:

- TrustedForm certificate URL captured per lead (✓ y/n)
- TCPA consent timestamp recorded (✓ y/n)
- IP address recorded (✓ y/n)
- State of origin within serviced 30 (✓ y/n)
- CCPA opt-out requests received and responded to within 45 days (count)

If any compliance metric drops below 100%, treat as P0.

---

## 14. 90-day execution roadmap

### Days 1–7 (Quick wins)
- [ ] Add `InsuranceAgency` schema to root layout
- [ ] Add `FAQPage` schema to all 6 funnel landing pages
- [ ] Fix image alt text on all hero images
- [ ] Verify Google Search Console + Bing Webmaster Tools
- [ ] Set `NEXT_PUBLIC_SITE_URL` to canonical domain in Vercel
- [ ] Build branded 404 page with funnel CTA
- [ ] Add cookie banner (CCPA-compliant, GPC-aware)

### Days 8–21 (Programmatic state pages)
- [ ] Build `lib/state-data.ts` with all 30 states
- [ ] Build `app/state/[slug]/page.tsx` template
- [ ] Build `app/state/page.tsx` index hub
- [ ] Generate dynamic OG images per state
- [ ] Add per-state schema (LocalBusiness + FAQPage)
- [ ] Update sitemap.ts to include all 30 state URLs
- [ ] Submit updated sitemap to Search Console

### Days 22–35 (Comparison content)
- [ ] Build `app/compare/[slug]/page.tsx` template
- [ ] Write 5 comparison pages: cobra-vs-private-ppo, ppo-vs-hmo, aca-vs-private-ppo, short-term-vs-private-ppo, medishare-vs-private-ppo
- [ ] Build `/advertising-disclosure` page
- [ ] Add FTC compensation disclosure component
- [ ] Internal-link the 6 funnel pages from each comparison

### Days 36–60 (Blog content + lead magnet)
- [ ] Build `app/blog/[slug]/page.tsx` template (MDX)
- [ ] Recruit one licensed agent author + one reviewer (E-A-T)
- [ ] Build the lead-magnet PDF
- [ ] Build email capture component (no phone, email-only)
- [ ] Set up the 5-email drip in Resend
- [ ] Publish first 8 blog posts (Months 1 plan above)

### Days 61–90 (Off-page launch + paid pilots)
- [ ] Open Reddit account, start commenting program
- [ ] Record + publish first 3 YouTube videos
- [ ] Reach out to 5 newsletter sponsors with media kit
- [ ] Launch Google Ads with keyword set in §11.2 (budget: $1,500/mo)
- [ ] Pitch first data-driven press story
- [ ] Initiate 3 reciprocal partnerships
- [ ] First quarterly review: traffic, leads, CPL by source

---

## 15. Risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Google algorithm update tanks YMYL rankings | Medium | High | Heavy E-A-T investment (real authors with credentials), diversified channel mix so we're never >40% organic-dependent |
| FTC enforcement on lead-gen industry | Medium | High | Compliance dashboard; substantiation files for all numerical claims; advertising disclosure on every comparison page |
| TCPA class action | Low (if compliant) | Catastrophic | Maintain 100% TrustedForm capture rate; per-state consent language; quarterly audit by external TCPA counsel |
| State licensing complaint | Low | Medium | All state pages clearly note Dynasty's licensing; never imply national coverage; never bid on non-serviced states |
| Reddit account ban | Medium | Low | Real account, real value-add posts, proper disclosure; treat as additive not load-bearing |
| Newsletter sponsor poor ROI | High | Low | Test small ($500–1K), measure carefully, kill losers fast |
| Paid ad CPC creep | Medium | Medium | Strict negative keywords; tight ad-group → landing-page themes; pause keywords with QS <6 |
| Competitor copies our state pages | High | Low | Original substantiation data, real licensed authors, fresh date stamps; first-mover advantage on most state queries |
| Carrier rate changes invalidate published numbers | High | Medium | Quarterly content refresh schedule; disclaim "rates as of [date]"; monitor carrier filings via state insurance departments |

---

## 16. Roles and ownership

| Function | Owner | Cadence |
|---|---|---|
| SEO strategy + measurement | Marketing lead | Weekly review |
| Content production (blog, comparison) | Content lead + freelance writers | Weekly publish |
| State-page maintenance | Engineering | Quarterly data refresh |
| Compliance review | Legal counsel + TCPA specialist | Quarterly audit |
| Schema + technical SEO | Engineering | Monthly Lighthouse audit |
| Paid ad management | Marketing lead or agency | Weekly bid review |
| Reddit / YouTube / off-page | Marketing lead | Daily Reddit activity, weekly YouTube publish |
| Newsletter sponsorships | Marketing lead | Monthly outreach |
| Lead-magnet email drip | Marketing lead | Quarterly content refresh |
| Author bylines + E-A-T pages | Content lead + actual licensed agents | One-time setup, refresh annually |

---

## 17. Budget estimate (12 months)

| Line item | Annual |
|---|---|
| Content (40 blog posts × $250) | $10,000 |
| Comparison pages (10 × $400) | $4,000 |
| Lead magnet PDF design | $800 |
| YouTube production (24 videos × $400) | $9,600 |
| Newsletter sponsorships | $18,000 |
| Press release distribution | $1,200 |
| Survey for press story | $500 |
| Google Ads (avg $1,500/mo) | $18,000 |
| External TCPA counsel review (quarterly) | $4,000 |
| Tools: Ahrefs Pro, Surfer SEO, Looker | $4,800 |
| **Total** | **$70,900** |

At target 350 organic leads/mo by month 12 → ~3,500 leads/year from this strategy. **Effective CPL: ~$20 blended.** At Dynasty's $28 lead price to USHA Marketplace and Holy Impact Media's per-lead spread, this is profitable from month 4 onward.

---

## 18. What this document does not cover

- Email marketing strategy beyond the lead-magnet drip (separate doc)
- Brand strategy, visual identity refresh (separate)
- Paid social (Meta, TikTok) — possible later, not part of cheap-leads thesis
- International expansion — out of scope (US-only)
- Medicare market expansion — explicitly excluded (compliance + ICP mismatch)
- Affiliate program for sub-publishers — separate compliance regime, evaluate Q3
- Webinar funnel — possible later
- B2B partnerships beyond reciprocal (broker referrals, etc.) — separate

---

## 19. Quarterly review checklist

Every 90 days:

- [ ] Review §13.1 KPIs vs. targets
- [ ] Refresh state-page data (median income, FPL caps if updated)
- [ ] Refresh top 5 blog posts by traffic with current data
- [ ] Audit FTC disclosures still present on every comparison page
- [ ] Run TCPA + CCPA compliance dashboard
- [ ] Run Lighthouse on all funnel + state + comparison pages
- [ ] Re-test schema markup in Google Rich Results Test
- [ ] Review and update this document

---

**This is a living document. Edit it. Argue with it. Don't treat it as scripture — treat it as the current best plan, updated as data comes in.**
