import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { CheckCircle2, TrendingDown, Clock, Phone, Mail } from "lucide-react"
import type { ThankYouConfig } from "@/lib/funnels/types"

// Position-based styling for the 3-status "what happens next" timeline.
// Copied verbatim from the original funnel thank-you page.
const TIMELINE_STYLES = [
  { icon: <CheckCircle2 className="w-6 h-6 text-green-600" />, bg: "bg-green-100", badgeCls: "bg-green-100 text-green-700" },
  { icon: <Clock className="w-6 h-6 text-[#D4AF37]" />, bg: "bg-[#D4AF37]/10 border-2 border-[#D4AF37]", badgeCls: "bg-blue-100 text-blue-700" },
  { icon: <Phone className="w-6 h-6 text-gray-400" />, bg: "bg-gray-100", badgeCls: "bg-gray-100 text-gray-600" },
]

export function ThankYou({
  thankYou: ty,
  answers,
  referenceNumber,
}: {
  thankYou: ThankYouConfig
  answers: Record<string, any>
  referenceNumber: string | null
}) {
  const est = ty.savingsEstimator
  const savings = est ? est.ranges[answers[est.fromKey]] ?? est.fallback : null

  return (
    <div className="space-y-8 pb-12">
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto shadow-lg"
        >
          <CheckCircle2 className="w-10 h-10 text-white" />
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground">
          {ty.headlineBefore}
          {answers.firstName}
          {ty.headlineAfter}
        </h1>
        <p className="text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">{ty.subhead}</p>
      </div>

      {/* Savings comparison card */}
      {est && savings && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="p-8 border-2 border-[#D4AF37] bg-gradient-to-br from-[#0A1128] to-[#1a2744] text-white">
            <div className="text-center mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/20 rounded-full text-[#D4AF37] text-sm font-semibold">
                <TrendingDown className="w-4 h-4" />
                {est.badge}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-red-900/40 rounded-xl p-5 text-center border border-red-500/30">
                <p className="text-sm text-red-300 mb-2 font-medium">{est.currentLabel}</p>
                <p className="text-3xl font-bold text-red-200">{savings.cobra}</p>
                <p className="text-xs text-red-400 mt-1">{est.currentSubLabel}</p>
              </div>
              <div className="bg-green-900/40 rounded-xl p-5 text-center border border-green-500/30">
                <p className="text-sm text-green-300 mb-2 font-medium">{est.altLabel}</p>
                <p className="text-3xl font-bold text-green-200">
                  ${savings.low}–${savings.high}/mo
                </p>
                <p className="text-xs text-green-400 mt-1">{est.altSubLabel}</p>
              </div>
            </div>
            <p className="text-center text-xs text-gray-400 mt-4">{est.disclaimer}</p>
          </Card>
        </motion.div>
      )}

      {/* Timeline */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="p-8 border border-border">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">{ty.timelineHeading}</h2>
          <div className="space-y-6">
            {ty.timeline.map((item, i) => {
              const style = TIMELINE_STYLES[i] ?? TIMELINE_STYLES[TIMELINE_STYLES.length - 1]
              return (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${style.bg}`}>
                      {style.icon}
                    </div>
                    {i < ty.timeline.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-2" />}
                  </div>
                  <div className="pb-6">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{item.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${style.badgeCls}`}>
                        {item.badgeText}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                    {item.showReference && (
                      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg mt-2">
                        <Mail className="w-4 h-4 text-[#D4AF37] mt-0.5 flex-shrink-0" />
                        <span>
                          Check your inbox for a confirmation with reference number:{" "}
                          <span className="font-mono font-semibold">{referenceNumber || ty.referencePrefix}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </motion.div>

      {/* Disclaimer */}
      <p className="text-xs text-center text-muted-foreground px-4">{ty.disclaimer}</p>
    </div>
  )
}
