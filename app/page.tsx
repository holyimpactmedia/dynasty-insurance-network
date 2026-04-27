import type { Metadata } from "next"
import Link from "next/link"
import { Footer } from "@/components/Footer"

export const metadata: Metadata = {
  title: "Find Your Plan",
  description:
    "Individual, family, COBRA, self-employed, or group coverage. Find the right private PPO plan for your situation in 90 seconds.",
  openGraph: {
    title: "Dynasty Insurance Group | Find Your Private PPO Plan",
    description:
      "Individual, family, COBRA, self-employed, or group coverage. Nationwide PPO plans. No referrals. Licensed specialists standing by.",
    url: "/",
  },
  twitter: {
    title: "Dynasty Insurance Group | Find Your Private PPO Plan",
    description:
      "Individual, family, COBRA, self-employed, or group coverage. Nationwide PPO plans. No referrals.",
  },
}
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Shield,
  Users,
  Heart,
  ArrowRight,
  CheckCircle2,
  Star,
  DollarSign,
  Clock,
  Award,
  Briefcase,
  Building2,
  Stethoscope,
  Globe,
} from "lucide-react"

const funnels = [
  {
    href: "/individual",
    icon: <Shield className="w-10 h-10 text-[#D4AF37]" />,
    tag: "Most Popular",
    tagColor: "bg-[#D4AF37]/20 text-[#D4AF37]",
    title: "Individual Health Coverage",
    subtitle: "Private PPO Plans",
    description:
      "Compare private PPO plans with nationwide coverage and doctor freedom. Quick 2-minute quiz to find your best options.",
    highlights: [
      "Nationwide PPO networks",
      "No referrals required",
      "Keep your preferred doctors",
      "Coverage in all 50 states",
    ],
    cta: "Find Individual Plans",
    ctaStyle: "bg-[#D4AF37] text-[#0A1128] hover:bg-[#D4AF37]/90",
    border: "border-[#D4AF37]",
  },
  {
    href: "/family",
    icon: <Users className="w-10 h-10 text-blue-500" />,
    tag: "Best for Families",
    tagColor: "bg-blue-100 text-blue-700",
    title: "Family Health Coverage",
    subtitle: "Private Family Plans",
    description:
      "Find private family plans that cover every member with nationwide access. Pediatric care, mental health, and full specialist coverage included.",
    highlights: [
      "Full family PPO coverage",
      "Pediatric and dental options",
      "Mental health & therapy included",
      "One plan for the whole family",
    ],
    cta: "Find Family Plans",
    ctaStyle: "bg-blue-600 text-white hover:bg-blue-700",
    border: "border-blue-200",
  },
  {
    href: "/cobra",
    icon: <Heart className="w-10 h-10 text-red-500" />,
    tag: "Lost Job Coverage",
    tagColor: "bg-red-100 text-red-700",
    title: "COBRA Alternatives",
    subtitle: "Save 40-60% vs COBRA",
    description:
      "Recently lost employer coverage? Most people save 40-60% by switching from COBRA to a private PPO alternative. Check your options in 90 seconds.",
    highlights: [
      "Average COBRA costs $850+/month",
      "Private alternatives with better value",
      "Nationwide network coverage",
      "Flexible enrollment for job loss",
    ],
    cta: "Compare COBRA Alternatives",
    ctaStyle: "bg-red-600 text-white hover:bg-red-700",
    border: "border-red-200",
  },
  {
    href: "/self-employed",
    icon: <Briefcase className="w-10 h-10 text-amber-500" />,
    tag: "Entrepreneurs & Contractors",
    tagColor: "bg-amber-100 text-amber-700",
    title: "Self-Employed Coverage",
    subtitle: "100% Tax Deductible",
    description:
      "Entrepreneurs and contractors deserve premium coverage with flexibility. Your premiums may be fully tax deductible with HSA-eligible plans available.",
    highlights: [
      "100% premium tax deductible",
      "HSA-eligible options available",
      "Nationwide PPO networks",
      "See any doctor without referrals",
    ],
    cta: "Find Self-Employed Plans",
    ctaStyle: "bg-amber-500 text-white hover:bg-amber-600",
    border: "border-amber-200",
  },
  {
    href: "/ppo",
    icon: <Stethoscope className="w-10 h-10 text-indigo-500" />,
    tag: "Doctor Freedom",
    tagColor: "bg-indigo-100 text-indigo-700",
    title: "PPO Coverage",
    subtitle: "See Any Doctor, Anywhere",
    description:
      "Tired of narrow networks and referral requirements? Private PPO plans let you see any doctor or specialist, no permission needed, nationwide coverage included.",
    highlights: [
      "No referrals, see any specialist directly",
      "Nationwide in-network and out-of-network coverage",
      "Lower deductibles than most HMO plans",
      "Real coverage with no hidden holes",
    ],
    cta: "Find PPO Plans",
    ctaStyle: "bg-indigo-600 text-white hover:bg-indigo-700",
    border: "border-indigo-200",
  },
  {
    href: "/business",
    icon: <Building2 className="w-10 h-10 text-emerald-500" />,
    tag: "Small Business",
    tagColor: "bg-emerald-100 text-emerald-700",
    title: "Group Health Benefits",
    subtitle: "2-50 Employees",
    description:
      "Offer your team premium group coverage. Group plans provide better rates and help you attract and retain top talent with comprehensive benefits.",
    highlights: [
      "Better rates than individual plans",
      "Deductible as a business expense",
      "Attract and retain top talent",
      "Comprehensive employee benefits",
    ],
    cta: "Get Group Plan Options",
    ctaStyle: "bg-emerald-600 text-white hover:bg-emerald-700",
    border: "border-emerald-200",
  },
]

export default function PlansPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="w-full py-4 px-6 flex items-center justify-center border-b bg-[#0A1128]">
        <img src="/images/logo.avif" alt="Dynasty" className="h-16 w-auto" />
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative text-white py-20 px-6 overflow-hidden">
          <img
            src="/images/heroes/home.jpg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0A1128]/95 via-[#0A1128]/85 to-[#0A1128]/95" aria-hidden="true" />
          <div className="relative max-w-3xl mx-auto text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/20 rounded-full text-[#D4AF37] text-sm font-medium">
              <Award className="w-4 h-4" />
              Licensed Insurance Agency
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight text-balance">
              Real Coverage for the Earners the <span className="text-[#D4AF37]">Marketplace Forgets</span>
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto text-pretty leading-relaxed">
              Private PPO plans for healthy Americans aged <span className="text-[#D4AF37] font-semibold">18 to 63</span> who earn too much for ACA subsidies but
              still need real coverage that takes their doctor and travels with them.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400 pt-2">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-400" /> Concierge Service</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-400" /> Licensed Agents Only</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-400" /> Results in 2 Minutes</span>
            </div>
          </div>
        </section>

        {/* Stats bar */}
        <section className="bg-[#D4AF37] py-5 px-6">
          <div className="max-w-4xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icon: <Users className="w-4 h-4 flex-shrink-0" />, text: "1,000+ clients served" },
              { icon: <Globe className="w-4 h-4 flex-shrink-0" />, text: "Nationwide PPO coverage" },
              { icon: <Star className="w-4 h-4 flex-shrink-0" />, text: "4.9/5 client rating" },
              { icon: <Clock className="w-4 h-4 flex-shrink-0" />, text: "5-min agent response" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-center gap-2 text-[#0A1128] font-semibold text-sm text-center">
                {item.icon}
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Plan cards */}
        <section className="py-16 px-6 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl font-bold text-foreground">Choose Your Coverage Type</h2>
              <p className="text-muted-foreground text-lg">
                Answer a few quick questions and get matched with a licensed specialist.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:grid-cols-3">
              {funnels.map((funnel) => (
                <Card
                  key={funnel.href}
                  className={`p-8 border-2 ${funnel.border} flex flex-col hover:shadow-lg transition-shadow`}
                >
                  <div className="flex-1 space-y-5">
                    {/* Icon & tag */}
                    <div className="flex items-start justify-between">
                      <div className="p-3 rounded-xl bg-muted">
                        {funnel.icon}
                      </div>
                      <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${funnel.tagColor}`}>
                        {funnel.tag}
                      </span>
                    </div>

                    {/* Title */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        {funnel.subtitle}
                      </p>
                      <h3 className="text-xl font-bold text-foreground">{funnel.title}</h3>
                    </div>

                    {/* Description */}
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {funnel.description}
                    </p>

                    {/* Highlights */}
                    <ul className="space-y-2">
                      {funnel.highlights.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-6">
                    <Button asChild className={`w-full h-12 font-semibold ${funnel.ctaStyle}`}>
                      <Link href={funnel.href}>
                        {funnel.cta}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Trust section */}
        <section className="py-16 px-6 bg-background">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-foreground mb-10">Why Families Choose Dynasty</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Shield className="w-8 h-8 text-[#D4AF37]" />,
                  title: "Licensed & Compliant",
                  desc: "All agents are licensed in your state and TCPA-compliant. Your data is protected and never sold to third parties.",
                },
                {
                  icon: <DollarSign className="w-8 h-8 text-[#D4AF37]" />,
                  title: "100% Free Service",
                  desc: "Our service is completely free to you. We're compensated by the insurance carriers when you enroll, never by you.",
                },
                {
                  icon: <Clock className="w-8 h-8 text-[#D4AF37]" />,
                  title: "Fast Response",
                  desc: "A licensed specialist contacts you within 5 minutes on business days. No waiting, no call centers. Real people who know your options.",
                },
              ].map((item, i) => (
                <div key={i} className="text-center space-y-3">
                  <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto">
                    {item.icon}
                  </div>
                  <h3 className="font-bold text-foreground text-lg">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA banner */}
        <section className="py-12 px-6 bg-[#0A1128] text-white">
          <div className="max-w-2xl mx-auto text-center space-y-5">
            <h2 className="text-3xl font-bold">Not Sure Which Plan Type You Need?</h2>
            <p className="text-gray-300">
              Start with our individual coverage quiz and our specialists will match you to the right plan.
            </p>
            <Button asChild size="lg" className="bg-[#D4AF37] text-[#0A1128] hover:bg-[#D4AF37]/90 font-bold h-14 px-10">
              <Link href="/individual">
                Start the Quiz
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
