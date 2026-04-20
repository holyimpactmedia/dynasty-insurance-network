# DYNASTY LEAD GENERATION SYSTEM - COMPLETE DOCUMENTATION

## PROJECT CONTEXT

**Application:** Dynasty Lead Generation System - Healthcare Insurance Lead Capture & Agent Management Platform  
**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS v4, Framer Motion, Recharts  
**Purpose:** Dual-purpose platform for capturing healthcare insurance consumer leads AND recruiting/managing insurance agents  
**Location:** `/`

---

## SECTION 1: SYSTEM ARCHITECTURE

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DYNASTY LEAD GENERATION SYSTEM                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    CONSUMER-FACING LAYER                              │   │
│  │  ┌─────────────────────┐    ┌─────────────────────┐                  │   │
│  │  │  Healthcare Quiz    │    │   Thank You Page    │                  │   │
│  │  │  Funnel (/)         │───▶│   + Lead Capture    │                  │   │
│  │  │  8-Step Flow        │    │   + Savings Display │                  │   │
│  │  └─────────────────────┘    └─────────────────────┘                  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    AGENT RECRUITING LAYER                             │   │
│  │  ┌─────────────────────┐    ┌─────────────────────┐                  │   │
│  │  │  Recruiting Landing │    │   Application       │                  │   │
│  │  │  Page (/recruit)    │───▶│   7-Step Funnel     │                  │   │
│  │  │  + Income Proof     │    │   + Thank You       │                  │   │
│  │  └─────────────────────┘    └─────────────────────┘                  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    INTERNAL OPERATIONS LAYER                          │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐         │   │
│  │  │ Agent Dashboard│  │ Admin Dashboard│  │ Lead Routing   │         │   │
│  │  │ /dashboard/    │  │ /dashboard/    │  │ /dashboard/    │         │   │
│  │  │ agent          │  │ admin          │  │ routing        │         │   │
│  │  └────────────────┘  └────────────────┘  └────────────────┘         │   │
│  │                                                                       │   │
│  │  ┌────────────────┐                                                  │   │
│  │  │ Projections    │                                                  │   │
│  │  │ /dashboard/    │                                                  │   │
│  │  │ projections    │                                                  │   │
│  │  └────────────────┘                                                  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| Framework | Next.js | 16 | App Router, Server Components |
| Language | TypeScript | 5.x | Type safety |
| Styling | Tailwind CSS | 4.0 | Utility-first CSS |
| UI Components | shadcn/ui | Latest | Button, Card, Badge, Input, etc. |
| Animation | Framer Motion | 11.x | Page transitions, micro-interactions |
| Charts | Recharts | 2.x | Data visualization |
| Icons | Lucide React | Latest | Icon library |
| State | React useState | 19.x | Local component state |
| Persistence | localStorage | Native | Form data recovery |

### Design Patterns

1. **Multi-Step Form Pattern:** Single-page component managing 8-10 steps with conditional rendering
2. **State Lifting:** All form data stored in parent component, passed down as props
3. **Auto-Advance:** Card selections trigger automatic navigation to next step
4. **Exit Intent Capture:** Mouse leave detection for abandonment recovery
5. **LocalStorage Sync:** Form persistence for returning users
6. **Tier-Based Architecture:** Performance tiers (Gold/Silver/Bronze) drive routing and rewards

---

## SECTION 2: FILE STRUCTURE & ORGANIZATION

```
/
├── app/
│   ├── page.tsx                          # Healthcare Insurance Quiz Funnel (1,274 lines)
│   ├── layout.tsx                        # Root layout with metadata
│   ├── globals.css                       # Global styles + Tailwind config
│   │
│   ├── recruit/
│   │   └── page.tsx                      # Agent Recruiting Landing + 7-Step Application
│   │
│   └── dashboard/
│       ├── agent/
│       │   ├── page.tsx                  # Agent Lead Management Dashboard
│       │   └── loading.tsx               # Loading state
│       │
│       ├── admin/
│       │   ├── page.tsx                  # Admin Overview Dashboard
│       │   └── loading.tsx               # Loading state
│       │
│       ├── routing/
│       │   ├── page.tsx                  # Lead Routing Algorithm Visualization
│       │   └── loading.tsx               # Loading state
│       │
│       └── projections/
│           ├── page.tsx                  # Financial Projections & ROI Calculator
│           └── loading.tsx               # Loading state
│
├── components/
│   └── ui/                               # shadcn/ui components (pre-installed)
│       ├── button.tsx
│       ├── card.tsx
│       ├── badge.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── slider.tsx
│       ├── table.tsx
│       ├── tabs.tsx
│       └── ... (other shadcn components)
│
├── public/
│   └── images/
│       └── logo.png                      # Dynasty "Dynasty" logo
│
├── lib/
│   └── utils.ts                          # cn() utility for class merging
│
└── hooks/
    └── use-mobile.tsx                    # Mobile detection hook
```

---

## SECTION 3: ROUTES & PAGES

### Route Map

| Route | File | Purpose | Auth Required |
|-------|------|---------|---------------|
| `/` | `app/page.tsx` | Healthcare Insurance Quiz Funnel | No |
| `/recruit` | `app/recruit/page.tsx` | Agent Recruiting Funnel | No |
| `/dashboard/agent` | `app/dashboard/agent/page.tsx` | Agent Lead Management | Yes (Future) |
| `/dashboard/admin` | `app/dashboard/admin/page.tsx` | Admin Overview | Yes (Future) |
| `/dashboard/routing` | `app/dashboard/routing/page.tsx` | Lead Routing Visualization | Yes (Future) |
| `/dashboard/projections` | `app/dashboard/projections/page.tsx` | Financial Projections | Yes (Future) |

---

### Route: `/` (Healthcare Insurance Quiz Funnel)

**Purpose:** Capture consumer leads for healthcare insurance through ACA-focused multi-step quiz

**Flow (10 Steps):**

```
Step 0: Landing Page
├── Hero with value proposition
├── "Get Healthcare for as Low as $0/Month"
├── Trust badges (ACA Certified, BBB A+, etc.)
├── Testimonials with star ratings
├── CTA: "Check My Savings"
    ↓
Step 1: Qualifying Event
├── Why are you shopping? (4 options)
├── Lost job coverage / Moving / Having baby / Open enrollment / Uninsured
├── Auto-advance on selection
    ↓
Step 2: Household Size
├── Who needs coverage? (4 options)
├── Just me / Me + spouse / Me + children / Family 4+
├── Auto-advance on selection
    ↓
Step 3: Age Input
├── Exact age number input
├── Medicare redirect if 65+
├── Manual continue button
    ↓
Step 4: ZIP Code
├── 5-digit ZIP input
├── State detection from ZIP
├── Validation (5 digits required)
    ↓
Step 5: Income Range
├── Household income selection (6 ranges)
├── Subsidy eligibility calculation
├── Auto-advance on selection
    ↓
Step 6: Plan Priorities
├── What matters most? (4 options)
├── Lowest payment / Best doctors / Low deductibles / Prescriptions
├── Auto-advance on selection
    ↓
Step 7: Contact Collection
├── Phone (optional) + Email (required)
├── TCPA consent checkbox
├── Real-time validation
    ↓
Step 8: Name Collection
├── First name + Last name
├── Final consent acknowledgment
    ↓
Step 9: Thank You Page
├── Personalized savings estimate
├── Timeline (4 steps)
├── What you'll receive section
├── FAQ accordion
├── Testimonials
├── Free guide download CTA
└── Contact information
```

**State Management:**
```typescript
interface Answers {
  qualifyingEvent: string;
  householdSize: string;
  age: string;
  zipCode: string;
  income: string;
  priorities: string;
  phone: string;
  email: string;
  firstName: string;
  lastName: string;
  tcpaConsent: boolean;
}
```

**Key Business Logic:**

1. **Subsidy Calculation:**
```typescript
const calculateEstimatedPremium = () => {
  const baseRate = 450; // Base monthly rate
  const ageFactor = Math.max(1, (parseInt(answers.age) - 20) * 0.02);
  const householdFactor = {
    'just-me': 1,
    'me-spouse': 1.8,
    'me-children': 1.6,
    'family': 2.4
  }[answers.householdSize] || 1;
  
  // Income-based subsidy calculation
  const subsidyPercent = getSubsidyPercent(answers.income);
  const grossPremium = baseRate * ageFactor * householdFactor;
  const subsidy = grossPremium * subsidyPercent;
  const netPremium = grossPremium - subsidy;
  
  return { grossPremium, subsidy, netPremium };
};
```

2. **Subsidy Percentages by Income:**
- Under $20K: 85% subsidy
- $20K-$35K: 70% subsidy
- $35K-$50K: 50% subsidy
- $50K-$75K: 30% subsidy
- $75K-$100K: 15% subsidy
- Over $100K: 0% subsidy

---

### Route: `/recruit` (Agent Recruiting Funnel)

**Purpose:** Recruit new insurance agents with income opportunity presentation

**Landing Page Sections:**

1. **Hero Section**
   - Headline: "Stop Chasing Leads. Start Closing Them."
   - Subheadline: Income potential + exclusive leads promise
   - CTA: "Apply Now - Limited Spots"

2. **Income Testimonials**
   - 3 agent success stories with photos
   - Specific income figures ($8,500 - $15,200/month)
   - Required disclaimer: "Results not typical..."

3. **Tier System Visualization**
   ```
   GOLD TIER (Top Performers)
   ├── Requirements: 80%+ contact, 15%+ close
   ├── Rewards: 6+ leads/day, priority routing, bonus pool
   
   SILVER TIER (Solid Performers)
   ├── Requirements: 70%+ contact, 10%+ close
   ├── Rewards: 4+ leads/day, standard routing
   
   BRONZE TIER (Entry Level)
   ├── Requirements: 60%+ contact, 8%+ close
   ├── Rewards: 2+ leads/day, training priority
   ```

4. **Benefits Grid (6 items)**
   - Exclusive leads (no sharing)
   - Comprehensive training
   - Flexible schedule
   - Residual income
   - Performance bonuses
   - Technology platform

**Application Flow (7 Steps):**

```
Step 1: Name → Step 2: Contact → Step 3: State License →
Step 4: Experience Level → Step 5: Current License Status →
Step 6: Why Joining → Step 7: Income Goals → Thank You
```

---

### Route: `/dashboard/agent` (Agent Dashboard)

**Purpose:** Daily operational interface for agents to manage leads

**Tabs:**

1. **Leads Tab**
   - Searchable/filterable lead table
   - Columns: ID, Name, Age, Location, Status, Priority, Time, Actions
   - Status badges: New, Contacted, Appointment, Follow-up, Closed, Lost
   - Quick actions: Call, Email buttons

2. **Performance Tab**
   - Contact rate progress bar vs tier requirement
   - Close rate progress bar vs target
   - Visual comparison to tier thresholds

3. **Activity Tab**
   - Real-time activity feed
   - Events: Lead assigned, Contact made, Appointment set
   - Daily summary section

**Key Metrics Cards:**
- Leads Today (with "new" badge)
- Contact Rate % (color-coded)
- Close Rate % (vs target)
- Monthly Revenue

---

### Route: `/dashboard/admin` (Admin Dashboard)

**Purpose:** Leadership overview of entire system

**Sections:**

1. **Key Metrics Row**
   - Leads Today
   - Active Campaigns
   - Active Agents (with tier breakdown pie)
   - Today's Sales + Profit

2. **Campaign Performance**
   - Campaign cards with spend/CPL tracking
   - Pause/Resume controls
   - Color-coded CPL alerts (green/yellow/red)

3. **Agent Performance Table**
   - All agents with tier badges
   - Status indicators
   - Contact/Close rates with color coding

4. **Lead Pipeline**
   - Funnel visualization: Leads → Contacted → Appointments → Sales
   - Daily leads bar chart (7 days)

5. **Governance & Alerts**
   - Active alerts (Warning/Info severity)
   - Compliance checklist

6. **Financial Overview**
   - Ad spend, Revenue, Profit margin, ROI

---

### Route: `/dashboard/routing` (Lead Routing Visualization)

**Purpose:** Demonstrate tier-based routing algorithm

**6-Step Animation Sequence:**

```
1. Lead Incoming
   └── New lead enters system
       ↓
2. Check State License
   └── Filter agents not licensed in lead's state
       ↓
3. Filter by Tier Match
   └── Match lead quality to agent tier
       ↓
4. Check Daily Cap
   └── Verify agents haven't hit daily limit
       ↓
5. Round-Robin Selection
   └── Select from eligible agents fairly
       ↓
6. Agent Notification
   └── Selected agent receives lead instantly
```

**Interactive Features:**
- Play/Pause button
- Reset button
- Speed selector (1x, 2x, 5x)
- Agent elimination visualization with reasons

---

### Route: `/dashboard/projections` (Financial Projections)

**Purpose:** ROI calculator for leadership/investors

**Calculators:**

1. **Pilot Phase Calculator**
   - Inputs: Leads, Contact Rate, Close Rate, Avg Commission
   - Outputs: CPL, Sales, Revenue, Profit, Margin %

2. **Scale Phase Modeler**
   - Daily ad spend slider ($500-$10,000)
   - Projects: Monthly leads, Sales, Revenue, Operating costs, Profit

3. **Year 1 Growth Chart**
   - 12-month line chart
   - Revenue, Profit, Ad Spend curves

4. **Agent-Funded Revenue**
   - Bronze/Silver/Gold agent counts
   - MRR calculation

5. **Competitive Comparison**
   - Dynasty vs Buy Leads vs Cold Calling vs Third-Party

---

## SECTION 4: COMPONENTS (DETAILED)

### Component: Healthcare Quiz Funnel (app/page.tsx)

```typescript
COMPONENT: InsuranceQuiz
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: app/page.tsx
Purpose: Multi-step healthcare insurance lead capture funnel
Type: Feature Component (Full Page)
Lines: ~1,274

PROPS INTERFACE:
// No props - standalone page component

STATE MANAGEMENT:
- currentStep: number (0-9)
- answers: Answers object (all form data)
- errors: Record<string, string> (validation errors)
- showExitIntent: boolean (popup visibility)

KEY FUNCTIONS:
- nextStep(): Advances to next step with validation
- prevStep(): Returns to previous step
- updateAnswer(key, value): Updates single answer field
- handleAutoAdvance(key, value): Updates and auto-advances
- validateEmail(email): Email regex validation
- validatePhone(phone): Phone format validation
- calculateEstimatedPremium(): Subsidy calculation logic

STYLING:
- Tailwind CSS classes
- Navy (#0A1128) and Gold (#D4AF37) color scheme
- Framer Motion for transitions
- Responsive: mobile-first with md: breakpoints

ANIMATIONS:
- AnimatePresence for step transitions
- initial={{ opacity: 0, x: 20 }}
- animate={{ opacity: 1, x: 0 }}
- exit={{ opacity: 0, x: -20 }}

PERSISTENCE:
- localStorage.setItem('healthcareQuizAnswers', JSON.stringify(answers))
- useEffect loads on mount

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Component: Agent Recruiting Funnel (app/recruit/page.tsx)

```typescript
COMPONENT: AgentRecruitingPage
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: app/recruit/page.tsx
Purpose: Agent recruiting landing page + 7-step application
Type: Feature Component (Full Page)

STATE MANAGEMENT:
- showApplication: boolean (landing vs form view)
- currentStep: number (0-7)
- applicationData: object (form fields)

KEY SECTIONS:
1. Landing Page (showApplication = false)
   - Hero with income hook
   - Tier system cards
   - Benefits grid
   - Testimonials with disclaimers
   
2. Application Form (showApplication = true)
   - 7-step progressive form
   - Validation per step
   - Thank you with next steps

INCOME DISCLAIMER:
"Results not typical. Income depends on individual effort,
market conditions, and other factors. Past performance
does not guarantee future results."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Component: Agent Dashboard (app/dashboard/agent/page.tsx)

```typescript
COMPONENT: AgentDashboard
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: app/dashboard/agent/page.tsx
Purpose: Daily lead management interface for agents
Type: Dashboard Component

TABS:
- leads: Lead management table
- performance: Metrics visualization
- activity: Activity feed

MOCK DATA:
- mockLeads: 6 sample leads with varied statuses
- mockActivity: 5 recent activity items

KEY FEATURES:
- Search by name or ID
- Filter by status dropdown
- Sortable columns
- Quick action buttons (Call, Email)
- Performance progress bars
- Real-time activity feed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Component: Admin Dashboard (app/dashboard/admin/page.tsx)

```typescript
COMPONENT: AdminDashboard
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: app/dashboard/admin/page.tsx
Purpose: Leadership overview of entire system
Type: Dashboard Component

SECTIONS:
1. KPI Cards (4)
2. Campaign Performance (3 campaigns)
3. Agent Table (6 agents)
4. Lead Pipeline Funnel
5. Daily Leads Chart
6. Alerts & Governance
7. Financial Overview

CHARTS:
- Recharts PieChart (tier distribution)
- Recharts BarChart (daily leads)
- Custom funnel visualization

MOCK DATA:
- mockCampaigns: 3 ad campaigns
- mockAgents: 6 agents across tiers
- mockAlerts: 2 system alerts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## SECTION 5: DATA LAYER & STATE MANAGEMENT

### State Architecture

```
LOCAL STATE (useState)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Each page manages its own state independently:

Healthcare Quiz:
{
  currentStep: number,
  answers: {
    qualifyingEvent: string,
    householdSize: string,
    age: string,
    zipCode: string,
    income: string,
    priorities: string,
    phone: string,
    email: string,
    firstName: string,
    lastName: string,
    tcpaConsent: boolean
  },
  errors: Record<string, string>,
  showExitIntent: boolean
}

Agent Recruiting:
{
  showApplication: boolean,
  currentStep: number,
  applicationData: {
    firstName: string,
    lastName: string,
    email: string,
    phone: string,
    state: string,
    experience: string,
    licenseStatus: string,
    whyJoining: string,
    incomeGoal: string
  }
}

Agent Dashboard:
{
  activeTab: 'leads' | 'performance' | 'activity',
  searchQuery: string,
  statusFilter: string
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### LocalStorage Persistence

```typescript
PERSISTENCE LAYER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Key: 'healthcareQuizAnswers'
Purpose: Recover form data for returning users

Save Logic:
useEffect(() => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('healthcareQuizAnswers', JSON.stringify(answers));
  }
}, [answers]);

Load Logic:
useEffect(() => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('healthcareQuizAnswers');
    if (saved) {
      setAnswers(JSON.parse(saved));
    }
  }
}, []);

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## SECTION 6: BUSINESS LOGIC & CALCULATIONS

### Subsidy Calculation

```typescript
FUNCTION: calculateEstimatedPremium
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Location: app/page.tsx (inline)
Purpose: Calculate estimated healthcare premium with federal subsidy

ALGORITHM:
1. Start with base rate ($450/month)
2. Apply age factor: (age - 20) * 2% increase per year
3. Apply household multiplier:
   - Just me: 1.0x
   - Me + spouse: 1.8x
   - Me + children: 1.6x
   - Family 4+: 2.4x
4. Calculate subsidy based on income:
   - Under $20K: 85% subsidy
   - $20K-$35K: 70% subsidy
   - $35K-$50K: 50% subsidy
   - $50K-$75K: 30% subsidy
   - $75K-$100K: 15% subsidy
   - Over $100K: 0% subsidy
5. Net premium = Gross - Subsidy

EXAMPLE:
Input: Age 45, Family 4+, Income $35K-$50K
Gross: $450 × 1.5 (age) × 2.4 (family) = $1,620
Subsidy: $1,620 × 50% = $810
Net: $810/month

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Tier Qualification Logic

```typescript
FUNCTION: getTierBadge
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Purpose: Determine agent tier based on performance metrics

REQUIREMENTS:

GOLD TIER:
- Contact Rate: >= 80%
- Close Rate: >= 15%
- Rewards: 6+ leads/day, priority routing, bonus pool access

SILVER TIER:
- Contact Rate: >= 70%
- Close Rate: >= 10%
- Rewards: 4+ leads/day, standard routing

BRONZE TIER:
- Contact Rate: >= 60%
- Close Rate: >= 8%
- Rewards: 2+ leads/day, training support

PROBATION:
- Contact Rate: < 60% OR Close Rate: < 8%
- Consequences: Lead reduction, performance review

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Lead Routing Algorithm

```typescript
FUNCTION: routeLead
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Purpose: Assign incoming lead to optimal agent

ALGORITHM:
1. FILTER by state license
   └── Remove agents not licensed in lead's state

2. FILTER by tier match
   └── Premium leads → Gold/Silver only
   └── Standard leads → All tiers eligible

3. FILTER by capacity
   └── Remove agents at daily cap
   └── Remove agents marked "busy"

4. SORT by priority
   └── Gold agents first
   └── Then by least recent assignment (round-robin)

5. SELECT top agent
   └── Assign lead to first eligible agent

6. NOTIFY agent
   └── Push notification + email
   └── Log assignment in activity feed

TIMING: < 0.3 seconds average

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## SECTION 7: UI/UX PATTERNS & DESIGN SYSTEM

### Color Palette

```
PRIMARY COLORS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Navy Blue (Trust/Authority):
- Primary: #0A1128 - Headers, text
- Dark: #1e3a8a - Hover states
- Light: #1e40af - Accents

Gold (Premium/Success):
- Primary: #D4AF37 - CTAs, highlights
- Light: #E8C976 - Gradients
- Gradient: linear-gradient(to right, #D4AF37, #E8C976)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SEMANTIC COLORS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Success: #22c55e (green-500) - Checkmarks, positive metrics
Error: #ef4444 (red-500) - Validation errors, alerts
Warning: #f59e0b (amber-500) - Warnings, attention
Info: #3b82f6 (blue-500) - Information, links

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NEUTRAL COLORS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- White: #ffffff - Backgrounds
- Gray 50: #f9fafb - Subtle backgrounds
- Gray 100: #f3f4f6 - Cards, borders
- Gray 200: #e5e7eb - Dividers
- Gray 500: #6b7280 - Secondary text
- Gray 700: #374151 - Body text
- Gray 900: #111827 - Headings

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Typography

```
FONT FAMILIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Primary: Geist Sans
- Usage: All text (headings and body)
- Weights: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

Monospace: Geist Mono
- Usage: Code, reference numbers
- Weight: 400

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TYPE SCALE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- text-4xl/text-3xl: Hero headlines (mobile responsive)
- text-2xl: Section headings
- text-xl: Card titles
- text-lg: Subheadings, emphasis
- text-base: Body text
- text-sm: Secondary text, labels
- text-xs: Captions, badges

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Spacing System

```
SPACING SCALE (Tailwind)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- p-1: 4px - Tight padding
- p-2: 8px - Button padding
- p-3: 12px - Card padding inner
- p-4: 16px - Standard padding
- p-6: 24px - Section padding
- p-8: 32px - Large sections
- p-12: 48px - Hero sections

Gap patterns:
- gap-2: Between inline items
- gap-4: Between cards
- gap-6: Between sections
- gap-8: Major section breaks

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Breakpoints

```
RESPONSIVE BREAKPOINTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Mobile First Strategy:
- Base: 0px+ (mobile)
- sm: 640px+ (large mobile)
- md: 768px+ (tablet)
- lg: 1024px+ (desktop)
- xl: 1280px+ (large desktop)

Common Patterns:
- grid-cols-1 md:grid-cols-2: 1 col mobile, 2 col tablet+
- text-3xl md:text-4xl: Smaller headlines on mobile
- px-4 md:px-8: Tighter padding on mobile
- hidden md:block: Hide on mobile, show on tablet+

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Animation Patterns

```
FRAMER MOTION PATTERNS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Page Transitions:
<AnimatePresence mode="wait">
  <motion.div
    key={currentStep}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
  >

Staggered Children:
{items.map((item, i) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: i * 0.1 }}
  >
))}

Hover Effects:
whileHover={{ scale: 1.02, y: -2 }}
transition={{ type: "spring", stiffness: 300 }}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## SECTION 8: DATA FLOW & USER JOURNEYS

### Journey 1: Consumer Lead Capture

```
USER JOURNEY: Healthcare Quote Request
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GOAL: Consumer submits information to receive healthcare quote

ENTRY: / (direct link, ad, referral)

FLOW:
Landing Page
├── User sees: Hero, trust badges, testimonials
├── User does: Clicks "Check My Savings"
├── State: currentStep = 0 → 1
    ↓
Qualifying Event
├── User sees: 4 options (why shopping)
├── User does: Clicks option card
├── State: answers.qualifyingEvent updated
├── Auto-advance to step 2
    ↓
Household Size
├── User sees: 4 options (coverage needs)
├── User does: Clicks option card
├── State: answers.householdSize updated
├── Auto-advance to step 3
    ↓
Age Input
├── User sees: Number input field
├── User does: Enters age, clicks Continue
├── Validation: Must be 18-64 (65+ redirected to Medicare)
├── State: answers.age updated
    ↓
ZIP Code
├── User sees: ZIP input field
├── User does: Enters 5-digit ZIP, clicks Continue
├── Validation: 5 digits required
├── State: answers.zipCode updated
    ↓
Income Selection
├── User sees: 6 income range options
├── User does: Clicks applicable range
├── State: answers.income updated
├── Auto-advance to step 6
    ↓
Plan Priorities
├── User sees: 4 priority options
├── User does: Clicks most important factor
├── State: answers.priorities updated
├── Auto-advance to step 7
    ↓
Contact Collection
├── User sees: Phone (optional), Email (required), TCPA checkbox
├── User does: Enters email, checks consent
├── Validation: Valid email format, consent checked
├── State: answers.phone, answers.email, answers.tcpaConsent
    ↓
Name Collection
├── User sees: First name, Last name inputs
├── User does: Enters names, clicks Submit
├── Validation: Both names required (2+ chars)
├── State: answers.firstName, answers.lastName
    ↓
Thank You Page
├── User sees: Savings estimate, timeline, FAQ, testimonials
├── Next steps: Agent call within 24 hours
├── State: Final, form complete

EXIT INTENT HANDLING:
- Mouse leaves viewport → showExitIntent popup
- "Get Results by Email" → captures email before abandonment
- Dismiss → user continues or leaves

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Journey 2: Agent Application

```
USER JOURNEY: Agent Recruitment Application
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GOAL: Insurance professional applies to join Dynasty

ENTRY: /recruit (direct link, referral, ad)

FLOW:
Landing Page
├── User sees: Income testimonials, tier system, benefits
├── User does: Scrolls, reads content, clicks "Apply Now"
├── State: showApplication = true
    ↓
7-Step Application
├── Step 1: Name → Step 2: Contact → Step 3: State →
├── Step 4: Experience → Step 5: License → Step 6: Why Joining →
├── Step 7: Income Goal → Thank You
    ↓
Thank You Page
├── User sees: Reference number, timeline, next steps
├── Next steps: Interview scheduling within 48 hours

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## SECTION 9: CONFIGURATION & ENVIRONMENT

### Environment Variables (Required for Production)

```
ENVIRONMENT VARIABLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Currently using mock data. For production, would need:

DATABASE_URL=
├── Purpose: PostgreSQL connection string
├── Used in: All data operations
├── Required: Yes

NEXT_PUBLIC_API_URL=
├── Purpose: API base URL
├── Used in: Client-side API calls
├── Required: Yes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## SECTION 10: WHAT'S MISSING FOR PRODUCTION

### Critical Gaps

```
PRODUCTION REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. DATABASE INTEGRATION
   - Need: Supabase, Neon, or PostgreSQL
   - Tables: leads, agents, campaigns, activities
   - Status: Currently mock data only

2. AUTHENTICATION SYSTEM
   - Need: NextAuth.js or Supabase Auth
   - Roles: Agent, Admin, Super Admin
   - Status: No auth implemented

3. API ROUTES
   - Need: /api/leads, /api/agents, /api/campaigns
   - Methods: POST (create), GET (read), PATCH (update)
   - Status: No API routes exist

4. LEAD ROUTING ENGINE
   - Need: Real-time routing algorithm
   - Integration: Webhook triggers, queue system
   - Status: Visualization only, no actual routing

5. NOTIFICATION SYSTEM
   - Need: Email (SendGrid), SMS (Twilio)
   - Events: Lead assigned, appointment reminder
   - Status: Not implemented

6. CRM INTEGRATION
   - Need: Salesforce, HubSpot, or custom CRM
   - Sync: Lead status, agent performance
   - Status: Not implemented

7. ANALYTICS
   - Need: Mixpanel, Amplitude, or custom
   - Events: Funnel completion, conversion tracking
   - Status: Not implemented

8. PAYMENT PROCESSING
   - Need: Stripe for agent subscriptions
   - Tiers: Bronze $497, Silver $997, Gold $1,497
   - Status: Not implemented

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## SECTION 11: TESTING CONSIDERATIONS

### Test Cases Needed

```
TESTING STRATEGY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

UNIT TESTS:
- calculateEstimatedPremium() with various inputs
- validateEmail() edge cases
- validatePhone() formats
- Tier qualification logic

INTEGRATION TESTS:
- Full funnel completion flow
- Form validation sequences
- LocalStorage persistence

E2E TESTS:
- Consumer quiz happy path
- Agent application happy path
- Exit intent popup trigger
- Mobile responsive behavior

ACCESSIBILITY TESTS:
- Keyboard navigation
- Screen reader compatibility
- Color contrast ratios
- Focus indicators

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## QUICK REFERENCE

### URL Routes
| URL | Purpose |
|-----|---------|
| `/` | Healthcare Insurance Quiz |
| `/recruit` | Agent Recruiting |
| `/dashboard/agent` | Agent Dashboard |
| `/dashboard/admin` | Admin Dashboard |
| `/dashboard/routing` | Routing Visualization |
| `/dashboard/projections` | Financial Projections |

### Key Files
| File | Lines | Purpose |
|------|-------|---------|
| `app/page.tsx` | ~1,274 | Healthcare funnel |
| `app/recruit/page.tsx` | ~600 | Agent recruiting |
| `app/dashboard/agent/page.tsx` | ~580 | Agent dashboard |
| `app/dashboard/admin/page.tsx` | ~600 | Admin dashboard |
| `app/dashboard/routing/page.tsx` | ~350 | Routing viz |
| `app/dashboard/projections/page.tsx` | ~400 | Projections |

### Design Tokens
| Token | Value | Usage |
|-------|-------|-------|
| Navy | #0A1128 | Primary text |
| Gold | #D4AF37 | CTAs, accents |
| Success | #22c55e | Positive states |
| Error | #ef4444 | Validation errors |

---

*Documentation generated for Dynasty Lead Generation System*
*Last updated: January 2026*
