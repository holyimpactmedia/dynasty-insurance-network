"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Footer } from "@/components/Footer"
import { ExitIntentDialog } from "@/components/ExitIntentDialog"
import { ChevronLeft } from "lucide-react"
import { SERVICED_STATES } from "@/lib/serviced-states"
import { injectTrustedFormId } from "@/lib/hooks/useTrustedForm"
import { validateEmail, validatePhone, validateName } from "@/lib/funnels/validation"
import type { FunnelConfig } from "@/lib/funnels/types"
import { FunnelHeader } from "./Header"
import { Landing } from "./Landing"
import { QuizSteps } from "./QuizSteps"
import { ThankYou } from "./ThankYou"

// One stateful engine renders any funnel from a FunnelConfig. State machine,
// localStorage persistence, TrustedForm injection, exit-intent, and the
// /api/leads submit are copied verbatim from the original funnel pages — the
// only differences between funnels live in the config data.
export function QuizEngine({ config }: { config: FunnelConfig }) {
  const TOTAL_STEPS = config.steps.length
  const isBooleanGate = config.landingGate.kind === "boolean"
  const router = useRouter()

  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [stateSearch, setStateSearch] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showExitIntent, setShowExitIntent] = useState(false)
  const [showThankYou, setShowThankYou] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null)
  // Boolean-gated funnels (ppo) split the landing from the quiz via `showQuiz`;
  // step0-gated funnels (cobra et al.) show the landing at currentStep === 0.
  const [showQuiz, setShowQuiz] = useState(!isBooleanGate)
  // Redirect variant (business → /self-employed for sole proprietors).
  const [showRedirect, setShowRedirect] = useState(false)

  // LocalStorage persistence. `storageVersion` invalidates stale mid-quiz
  // resumes across a deploy so a warm lead never lands on a since-changed step.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(config.localStorageKey)
      if (saved) {
        const data = JSON.parse(saved)
        if (data.version === config.storageVersion) {
          setAnswers(data.answers || {})
          setCurrentStep(Math.min(Math.max(data.step || 0, 0), TOTAL_STEPS + 1))
          if (isBooleanGate && typeof data.showQuiz === "boolean") setShowQuiz(data.showQuiz)
        }
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(
        config.localStorageKey,
        JSON.stringify({ answers, step: currentStep, showQuiz, version: config.storageVersion }),
      )
    } catch {
      // ignore
    }
  }, [answers, currentStep, showQuiz, config.localStorageKey, config.storageVersion])

  // TrustedForm form ID (TCPA cert scoping). Same inline script the pages used.
  useEffect(() => {
    injectTrustedFormId(config.trustedFormId)
  }, [config.trustedFormId])

  // Exit intent — desktop, one-shot per session, in-quiz only.
  useEffect(() => {
    if (showThankYou) return
    if (currentStep <= 0 || currentStep > TOTAL_STEPS) return
    if (isBooleanGate && !showQuiz) return
    if (typeof window === "undefined") return

    const SESSION_KEY = config.exitIntentSessionKey
    if (sessionStorage.getItem(SESSION_KEY)) return

    const isCoarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches
    if (isCoarsePointer) return

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !showExitIntent) {
        setShowExitIntent(true)
        sessionStorage.setItem(SESSION_KEY, "1")
      }
    }
    document.addEventListener("mouseleave", handleMouseLeave)
    return () => document.removeEventListener("mouseleave", handleMouseLeave)
  }, [currentStep, showExitIntent, showThankYou, showQuiz, isBooleanGate, TOTAL_STEPS, config.exitIntentSessionKey])

  const updateAnswer = (key: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: "" }))
  }

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS + 1))
  const prevStep = () => {
    if (isBooleanGate && currentStep === 1) {
      setShowQuiz(false)
      return
    }
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const onStart = () => {
    if (isBooleanGate) setShowQuiz(true)
    setCurrentStep(1)
  }

  const handleAutoAdvance = (key: string, value: any, delay = 400) => {
    updateAnswer(key, value)
    // Redirect variant: a specific answer routes elsewhere instead of advancing.
    if (config.redirect && key === config.redirect.whenFieldEquals.key && value === config.redirect.whenFieldEquals.value) {
      setShowRedirect(true)
      setTimeout(() => router.push(config.redirect!.to), config.redirect.delayMs)
      return
    }
    setTimeout(() => nextStep(), delay)
  }

  const handleContactSubmit = () => {
    const activeStep = config.steps[currentStep - 1]
    const newErrors: Record<string, string> = {}
    if (activeStep?.type === "contact" && activeStep.askAge) {
      const ageNum = Number.parseInt(answers.age)
      if (!answers.age || Number.isNaN(ageNum)) {
        newErrors.age = "Please enter your age"
      } else if (ageNum < 18 || ageNum >= 64) {
        newErrors.age = "These plans are available to healthy adults under 65"
      }
    }
    if (activeStep?.type === "contact" && activeStep.askGovCoverage) {
      if (!answers.govCoverage) {
        newErrors.govCoverage = "Please answer to continue"
      }
    }
    if (!answers.email || !validateEmail(answers.email)) {
      newErrors.email = "Please enter a valid email address"
    }
    if (!answers.phone) {
      newErrors.phone = "Phone number is required"
    } else if (!validatePhone(answers.phone)) {
      newErrors.phone = "Please enter a valid 10-digit phone number"
    }
    if (!answers.tcpaConsent) {
      newErrors.tcpaConsent = "You must agree to be contacted to proceed"
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    nextStep()
  }

  const handleNameSubmit = async () => {
    const newErrors: Record<string, string> = {}
    if (!answers.firstName || !validateName(answers.firstName)) {
      newErrors.firstName = "Please enter your first name (at least 2 characters)"
    }
    if (!answers.lastName || !validateName(answers.lastName)) {
      newErrors.lastName = "Please enter your last name (at least 2 characters)"
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const trustedFormCertUrl =
        (document.getElementById("xxTrustedFormCertUrl") as HTMLInputElement)?.value || null
      const urlParams = new URLSearchParams(window.location.search)

      const body = config.buildPayload(answers, {
        trustedFormCertUrl,
        utm: {
          source: urlParams.get("utm_source"),
          medium: urlParams.get("utm_medium"),
          campaign: urlParams.get("utm_campaign"),
        },
      })

      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to submit")

      setReferenceNumber(data.referenceNumber)
      setShowThankYou(true)
      localStorage.removeItem(config.localStorageKey)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to submit. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const progress = currentStep >= 1 && currentStep <= TOTAL_STEPS ? (currentStep / TOTAL_STEPS) * 100 : 0
  const filteredStates = SERVICED_STATES.filter((s) => s.toLowerCase().includes(stateSearch.toLowerCase()))

  const landingVisible = !showThankYou && (isBooleanGate ? !showQuiz : currentStep === 0)
  const inQuiz = !showThankYou && currentStep >= 1 && currentStep <= TOTAL_STEPS && (!isBooleanGate || showQuiz)
  const activeStep = config.steps[currentStep - 1]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <FunnelHeader />

      {/* Progress bar */}
      {inQuiz && (
        <div className="w-full h-1 bg-muted">
          <motion.div
            className="h-full bg-[#D4AF37]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}

      {/* Back button */}
      {inQuiz && (
        <Button
          variant="ghost"
          size="sm"
          onClick={prevStep}
          className="fixed top-4 left-4 z-50 flex items-center gap-2 bg-white text-[#0A1128] hover:bg-gray-100 border-2 border-[#D4AF37] shadow-lg rounded-full px-4 h-10 font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>
      )}

      <ExitIntentDialog
        open={showExitIntent}
        onClose={() => setShowExitIntent(false)}
        onContinue={() => setShowExitIntent(false)}
        progress={progress}
        savingsAmount={config.exitIntent.savingsAmount}
        headline={config.exitIntent.headline}
        beforeLabel={config.exitIntent.beforeLabel}
        beforeValue={config.exitIntent.beforeValue}
        afterLabel={config.exitIntent.afterLabel}
        afterValue={config.exitIntent.afterValue}
        comparisonName={config.exitIntent.comparisonName}
      />

      {/* Step content */}
      <div className={landingVisible ? "flex-1" : "flex-1 flex items-start justify-center px-4 py-6 sm:px-6 sm:items-center"}>
        <AnimatePresence mode="wait">
          <motion.div
            key={showThankYou ? "thank-you" : currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className={landingVisible ? "w-full" : "w-full max-w-2xl"}
          >
            {showThankYou ? (
              <ThankYou thankYou={config.thankYou} answers={answers} referenceNumber={referenceNumber} />
            ) : landingVisible ? (
              <Landing landing={config.landing} onStart={onStart} />
            ) : showRedirect && config.redirect ? (
              <div className="text-center space-y-4 py-12">
                <p className="text-lg text-muted-foreground">{config.redirect.message}</p>
              </div>
            ) : activeStep ? (
              <QuizSteps
                step={activeStep}
                stepNumber={currentStep}
                totalSteps={TOTAL_STEPS}
                answers={answers}
                errors={errors}
                updateAnswer={updateAnswer}
                handleAutoAdvance={handleAutoAdvance}
                stateSearch={stateSearch}
                setStateSearch={setStateSearch}
                filteredStates={filteredStates}
                onContactSubmit={handleContactSubmit}
                onNameSubmit={handleNameSubmit}
                isSubmitting={isSubmitting}
                submitError={submitError}
              />
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      {(landingVisible || showThankYou) && <Footer />}
    </div>
  )
}
