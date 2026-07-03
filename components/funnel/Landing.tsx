import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AlertCircle, ArrowRight, XCircle, CheckCircle2, Award, Star } from "lucide-react"
import { Icon, RichLine } from "./primitives"
import type { LandingConfig } from "@/lib/funnels/types"

// The funnel landing page (step 0): hero → stats → problem/solution → coverage
// → how-it-works → why → stories → final CTA. Markup copied verbatim from the
// original funnel pages; content comes from config. `onStart` advances into the
// quiz (step 1 for step0-gated funnels, or shows the quiz for boolean-gated).
export function Landing({ landing, onStart }: { landing: LandingConfig; onStart: () => void }) {
  const { hero, statsBar, problemSolution: ps, coverage, howItWorks, whyDynasty: why, savingsStories: stories, finalCta } = landing

  return (
    <div className="w-full max-w-none">
      {/* Hero: Pain Points */}
      <section className="relative text-white py-16 px-6 overflow-hidden">
        <img src={hero.bgImage} alt="" className="absolute inset-0 w-full h-full object-cover" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A1128]/95 via-[#0A1128]/85 to-[#0A1128]/95" aria-hidden="true" />
        <div className="relative max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/20 rounded-full text-[#D4AF37] text-sm font-semibold">
            <Icon name={hero.badge.icon} className="w-4 h-4" />
            {hero.badge.text}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight text-balance">
            <RichLine segments={hero.headline} emClassName="text-[#D4AF37]" />
          </h1>
          <p className="text-lg text-gray-300 max-w-xl mx-auto">
            <RichLine segments={hero.subhead} emClassName="text-[#D4AF37] font-semibold" />
          </p>
          <div className="space-y-3 text-left max-w-xl mx-auto">
            {hero.painPoints.map((q, i) => (
              <div key={i} className="flex items-start gap-3 bg-white/10 rounded-lg p-4">
                <AlertCircle className="w-5 h-5 text-[#D4AF37] mt-0.5 flex-shrink-0" />
                <p className="text-gray-200 text-sm leading-relaxed">{q}</p>
              </div>
            ))}
          </div>
          <Button
            onClick={onStart}
            size="lg"
            className="bg-[#D4AF37] text-[#0A1128] hover:bg-[#c9a430] active:bg-[#b89228] font-bold h-14 px-10 text-base w-full sm:w-auto"
          >
            {hero.ctaLabel}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <p className="text-gray-400 text-xs">{hero.ctaSubtext}</p>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-[#D4AF37] py-5 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {statsBar.map((item, i) => (
            <div key={i} className="flex items-center justify-center gap-2 text-[#0A1128] font-semibold text-sm text-center">
              <Icon name={item.icon} className="w-4 h-4 flex-shrink-0" />
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Problem Agitation */}
      <section className="py-16 px-6 bg-background">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">{ps.heading}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">{ps.subhead}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 border-2 border-red-200 bg-red-50/50">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-red-500 font-semibold uppercase tracking-wide">{ps.problemLabel}</p>
                    <h3 className="font-bold text-foreground">{ps.problemTitle}</h3>
                  </div>
                </div>
                <ul className="space-y-3">
                  {ps.problems.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                      <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
            <Card className="p-6 border-2 border-green-200 bg-green-50/50">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-green-600 font-semibold uppercase tracking-wide">{ps.solutionLabel}</p>
                    <h3 className="font-bold text-foreground">{ps.solutionTitle}</h3>
                  </div>
                </div>
                <ul className="space-y-3">
                  {ps.advantages.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold text-foreground">{coverage.heading}</h2>
            <p className="text-muted-foreground text-lg">{coverage.subhead}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {coverage.items.map((item, i) => (
              <Card key={i} className="p-4 md:p-5 text-center space-y-3 hover:shadow-md transition-shadow">
                <div className="w-11 h-11 md:w-12 md:h-12 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto text-[#D4AF37]">
                  <Icon name={item.icon} className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-6 bg-background">
        <div className="max-w-3xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold text-foreground">{howItWorks.heading}</h2>
            <p className="text-muted-foreground text-lg">{howItWorks.subhead}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.steps.map((item, i) => (
              <div key={i} className="text-center space-y-4 max-w-xs mx-auto md:max-w-none">
                <div className="w-16 h-16 bg-[#0A1128] rounded-full flex items-center justify-center mx-auto">
                  <span className="text-[#D4AF37] font-bold text-xl">{item.step}</span>
                </div>
                <h3 className="font-bold text-foreground text-lg">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values / Mission */}
      <section className="py-16 px-6 bg-[#0A1128] text-white">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 items-center">
          <div className="space-y-5 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/20 rounded-full text-[#D4AF37] text-sm font-semibold mx-auto md:mx-0">
              <Award className="w-4 h-4" />
              {why.badge}
            </div>
            <h2 className="text-3xl font-bold leading-tight">{why.heading}</h2>
            {why.paragraphs.map((p, i) => (
              <p key={i} className="text-gray-300 leading-relaxed">{p}</p>
            ))}
          </div>
          <div className="space-y-4">
            {why.features.map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-full flex items-center justify-center flex-shrink-0 text-[#D4AF37]">
                  <Icon name={item.icon} className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-gray-400 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Switch Stories */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold text-foreground">{stories.heading}</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{stories.subhead}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {stories.stories.map((story, i) => (
              <Card key={i} className="p-6 border-2 border-[#D4AF37]/30 bg-white space-y-4">
                <div className="flex items-center gap-1 text-[#D4AF37]">
                  {[...Array(5)].map((_, s) => (
                    <Star key={s} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-xs text-red-600 font-semibold uppercase tracking-wide">Was paying</p>
                    <p className="text-lg font-bold text-red-700">{story.before}</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-xs text-green-700 font-semibold uppercase tracking-wide">Now pays</p>
                    <p className="text-lg font-bold text-green-700">{story.after}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed italic">&ldquo;{story.quote}&rdquo;</p>
                <div className="pt-2 border-t border-border">
                  <p className="text-sm font-semibold text-foreground">{story.name}</p>
                  <p className="text-xs text-muted-foreground">{story.situation}</p>
                  <p className="text-xs text-muted-foreground">{story.location}</p>
                </div>
              </Card>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground max-w-2xl mx-auto">{stories.disclaimer}</p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-6 bg-background">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold text-foreground">{finalCta.heading}</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">{finalCta.subhead}</p>
          <Button
            onClick={onStart}
            size="lg"
            className="bg-[#D4AF37] text-[#0A1128] hover:bg-[#c9a430] active:bg-[#b89228] font-bold h-14 px-10 text-base w-full sm:w-auto"
          >
            {finalCta.ctaLabel}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            {finalCta.trustBadges.map((b, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <Icon name={b.icon} className="w-4 h-4 flex-shrink-0" /> {b.text}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
