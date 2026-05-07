"use client"

import { useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Lock, Shield, TrendingDown, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface ExitIntentDialogProps {
  open: boolean
  onClose: () => void
  onContinue: () => void

  // Progress through the quiz, 0-100. Surfaces a sunk-cost cue.
  progress: number

  // Funnel-specific copy. All loss-framed (Kahneman: losses ~2x as motivating
  // as equivalent gains). The headline names a specific dollar figure the user
  // would walk away from; the comparison line cites a real before/after from
  // that funnel's testimonials.
  savingsAmount: string       // e.g. "$7,920"
  savingsTimeframe?: string   // default "/year"
  headline: string            // e.g. "Don't walk away from a real family plan"
  beforeLabel: string         // e.g. "Was paying"
  beforeValue: string         // e.g. "$1,420/mo"
  afterLabel: string          // e.g. "Now pays"
  afterValue: string          // e.g. "$760/mo"
  comparisonName: string      // e.g. "The Ramirez Family, Houston, TX"
  continueLabel?: string      // default "Finish My Quiz (60 seconds)"
  dismissLabel?: string       // default "I'll come back later"
}

export function ExitIntentDialog({
  open,
  onClose,
  onContinue,
  progress,
  savingsAmount,
  savingsTimeframe = "/year",
  headline,
  beforeLabel,
  beforeValue,
  afterLabel,
  afterValue,
  comparisonName,
  continueLabel = "Finish My Quiz (60 seconds)",
  dismissLabel = "I'll come back later",
}: ExitIntentDialogProps) {
  const continueButtonRef = useRef<HTMLButtonElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  // Focus management: trap focus on the primary CTA when the dialog opens,
  // and restore the previously focused element when it closes. ESC dismisses.
  useEffect(() => {
    if (!open) return

    previouslyFocused.current = document.activeElement as HTMLElement | null
    continueButtonRef.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener("keydown", onKey)

    // Lock body scroll while the dialog is mounted.
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = previousOverflow
      previouslyFocused.current?.focus?.()
    }
  }, [open, onClose])

  const clampedProgress = Math.max(0, Math.min(100, Math.round(progress)))

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 sm:p-6"
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-intent-headline"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close (small, low-friction; primary action stays the CTA) */}
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Top accent: progress + sunk-cost cue */}
            <div className="bg-[#0A1128] px-6 pt-6 pb-5 text-white">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
                <span>You&apos;re {clampedProgress}% through</span>
                <span className="flex items-center gap-1">
                  <Lock className="h-3.5 w-3.5" />
                  Progress saved
                </span>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${clampedProgress}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="h-full bg-[#D4AF37]"
                />
              </div>
            </div>

            {/* Body */}
            <div className="space-y-5 px-6 py-6 sm:px-8 sm:py-7">
              {/* Loss-framed headline with concrete dollar figure */}
              <div className="space-y-2 text-center">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-red-600">
                  <TrendingDown className="h-3.5 w-3.5" />
                  Don&apos;t leave money on the table
                </div>
                <h2
                  id="exit-intent-headline"
                  className="text-2xl font-bold leading-tight text-foreground sm:text-3xl"
                >
                  {headline}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Households like yours are saving{" "}
                  <span className="font-bold text-foreground">
                    up to {savingsAmount}
                    {savingsTimeframe}
                  </span>
                  .
                </p>
              </div>

              {/* Real before/after - matches the testimonials on the page */}
              <div className="rounded-xl border-2 border-[#D4AF37]/30 bg-gradient-to-br from-[#D4AF37]/5 to-transparent p-4">
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-red-600">
                      {beforeLabel}
                    </p>
                    <p className="text-lg font-bold text-red-700 sm:text-xl">{beforeValue}</p>
                  </div>
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-green-700">
                      {afterLabel}
                    </p>
                    <p className="text-lg font-bold text-green-700 sm:text-xl">{afterValue}</p>
                  </div>
                </div>
                <p className="mt-2.5 text-center text-[11px] text-muted-foreground">
                  {comparisonName}
                </p>
              </div>

              {/* Single primary CTA */}
              <Button
                ref={continueButtonRef}
                onClick={onContinue}
                size="lg"
                className="h-12 w-full bg-[#D4AF37] text-base font-bold text-[#0A1128] shadow-md hover:bg-[#c9a430] active:bg-[#b89228] active:scale-[0.99]"
              >
                {continueLabel}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              {/* Subtle dismissal - keeps friction low for genuine non-fits */}
              <button
                onClick={onClose}
                className="block w-full text-center text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {dismissLabel}
              </button>

              {/* Trust strip */}
              <div className="flex items-center justify-center gap-4 border-t border-border pt-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Licensed agents
                </span>
                <span className="flex items-center gap-1">
                  <Lock className="h-3 w-3" /> No spam
                </span>
                <span>100% free</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
