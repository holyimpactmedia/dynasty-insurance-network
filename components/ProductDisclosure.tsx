import { ShieldCheck } from "lucide-react"

/**
 * Standardized product-clarity disclosure used on every consumer funnel.
 *
 * The carrier and its legal counsel review the site for two unspoken
 * questions: (1) "what product category is this actually?" and (2) "is this
 * being sold as a marketplace alternative?". This block answers both in one
 * line — the products are off-exchange ACA-compliant individual major medical
 * plans (the same product category sold on Healthcare.gov, just purchased
 * privately without subsidies). That framing protects benefit claims (mental
 * health, preventive care, no pre-existing condition exclusions) and makes
 * clear the site is not advertising STLDI / indemnity / health-share products.
 */
export function ProductDisclosure({
  variant = "default",
}: {
  variant?: "default" | "compact"
}) {
  if (variant === "compact") {
    return (
      <p className="text-xs text-muted-foreground text-center max-w-2xl mx-auto leading-relaxed">
        All plans presented are ACA-compliant individual major medical health insurance, purchased off-exchange
        (without federal premium tax credits). Plan availability and final pricing depend on your state, age, household
        composition, and underwriting.
      </p>
    )
  }

  return (
    <div className="rounded-xl border border-[#D4AF37]/30 bg-[#0A1128] text-white px-5 py-4 sm:px-6 sm:py-5 flex items-start gap-4 max-w-3xl mx-auto">
      <div className="w-9 h-9 rounded-full bg-[#D4AF37]/15 flex items-center justify-center flex-shrink-0 text-[#D4AF37]">
        <ShieldCheck className="w-5 h-5" />
      </div>
      <div className="space-y-1.5 text-sm leading-relaxed">
        <p className="font-semibold text-[#D4AF37] text-xs uppercase tracking-wider">About these plans</p>
        <p className="text-gray-200">
          All plans presented are <span className="text-white font-semibold">ACA-compliant individual major medical
          health insurance</span>, purchased off-exchange (without federal premium tax credits or cost-sharing
          reductions). Plans cover the ten essential health benefits, with no pre-existing-condition exclusions.
        </p>
        <p className="text-gray-400 text-xs">
          Final premiums, networks, and benefit design depend on your state, age, household composition, tobacco
          use, and the issuing carrier&apos;s underwriting.
        </p>
      </div>
    </div>
  )
}
