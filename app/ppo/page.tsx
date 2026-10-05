"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Footer } from "@/components/Footer"
import { ExitIntentDialog } from "@/components/ExitIntentDialog"
import {
  Shield,
  ChevronLeft,
  Clock,
  CheckCircle2,
  Phone,
  Mail,
  AlertCircle,
  DollarSign,
  Users,
  Heart,
  Lock,
  ArrowRight,
  Stethoscope,
  Globe,
  Award,
  XCircle,
  Pill,
  Activity,
  Smile,
  Zap,
  FileText,
  X,
} from "lucide-react"

import { SERVICED_STATES } from "@/lib/serviced-states"
import { PPO_BUDGET_BRACKETS } from "@/lib/income-thresholds"
const US_STATES = SERVICED_STATES

const TOTAL_STEPS = 7

const COVERAGE_GAPS = [
  { icon: <Stethoscope className="w-5 h-5" />, label: "Specialist Access", desc: "You may be able to see specialists without a referral" },
  { icon: <Globe className="w-5 h-5" />, label: "PPO Network Access", desc: "Coverage that can access a PPO network of doctors and hospitals" },
  { icon: <Activity className="w-5 h-5" />, label: "Emergency Care", desc: "Emergency room care coverage, depending on your plan" },
  { icon: <Pill className="w-5 h-5" />, label: "Prescriptions", desc: "Broad formulary" },
  { icon: <Smile className="w-5 h-5" />, label: "Dental & Vision", desc: "Add-on options with some plans" },
  { icon: <Zap className="w-5 h-5" />, label: "Telemedicine", desc: "Virtual visits, not available with every plan or in every state" },
]

const HMO_PROBLEMS = [
  "Restricted to narrow networks, your doctor may not be covered",
  "Need referrals just to see a specialist",
  "Deductibles that must be met before some benefits apply",
  "Limited coverage outside your plan's service area",
  "Limited plan options in rural areas",
  "Pre-authorization delays for procedures",
]

const PPO_ADVANTAGES = [
  "You may be able to see the doctors and specialists you want, often without a referral",
  "Coverage that can access a PPO network of doctors and hospitals",
  "Plan options with a range of deductibles and benefits",
  "You stay in control of your care",
  "Often less red tape than narrow-network plans",
]

export default function PPOQuizPage() {
  const [showQuiz, setShowQuiz] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [stateSearch, setStateSearch] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showExitIntent, setShowExitIntent] = useState(false)
  const [showThankYou, setShowThankYou] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null)

  // LocalStorage persistence
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ppoQuizData")
      if (saved) {
        const data = JSON.parse(saved)
        if (data.showQuiz) {
          setShowQuiz(true)
          setAnswers(data.answers || {})
          setCurrentStep(data.step || 1)
        }
      }
    } catch (e) {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem("ppoQuizData", JSON.stringify({ showQuiz, answers, step: currentStep }))
    } catch (e) {}
  }, [showQuiz, answers, currentStep])

  // TrustedForm
  useEffect(() => {
    if (typeof window !== "undefined") {
      const script = document.createElement("script")
      script.type = "text/javascript"
      script.text = `tf_form_id = 'ppo-coverage-finder';`
      document.head.appendChild(script)
    }
  }, [])

  // Exit intent - desktop, one-shot per session, only during the quiz.
  useEffect(() => {
    if (!showQuiz || showThankYou) return
    if (typeof window === "undefined") return

    const SESSION_KEY = "exitIntentShown_ppo"
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
  }, [showQuiz, showExitIntent, showThankYou])

  const updateAnswer = (key: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: "" }))
  }

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS))
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1))

  const handleAutoAdvance = (key: string, value: any, delay = 400) => {
    updateAnswer(key, value)
    setTimeout(() => nextStep(), delay)
  }

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const validatePhone = (phone: string) => phone.replace(/\D/g, "").length === 10
  const validateName = (name: string) => name.trim().length >= 2

  const handleContactSubmit = () => {
    const newErrors: Record<string, string> = {}
    const ageNum = Number.parseInt(answers.age)
    if (!answers.age || Number.isNaN(ageNum)) {
      newErrors.age = "Please enter your age"
    } else if (ageNum < 18 || ageNum >= 64) {
      newErrors.age = "These plans are available to healthy adults under 65"
    }
    if (!answers.govCoverage) {
      newErrors.govCoverage = "Please answer to continue"
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
      newErrors.firstName = "Please enter your first name"
    }
    if (!answers.lastName || !validateName(answers.lastName)) {
      newErrors.lastName = "Please enter your last name"
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const trustedFormCertUrl = (document.getElementById("xxTrustedFormCertUrl") as HTMLInputElement)?.value || null
      const urlParams = new URLSearchParams(window.location.search)

      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: answers.firstName,
          lastName: answers.lastName,
          email: answers.email,
          phone: answers.phone,
          age: answers.age,
          state: answers.state,
          incomeRange: answers.income,
          householdSize: answers.coverage,
          qualifyingEvent: "ppo_coverage",
          priorities: answers.priority ? [answers.priority] : [],
          funnelType: "ppo",
          tcpaConsent: answers.tcpaConsent,
          trustedFormCertUrl,
          quizAnswers: {
            coverage: answers.coverage,
            currentSituation: answers.currentSituation,
            priority: answers.priority,
            budget: answers.budget,
            govCoverage: answers.govCoverage,
          },
          utmSource: urlParams.get("utm_source"),
          utmMedium: urlParams.get("utm_medium"),
          utmCampaign: urlParams.get("utm_campaign"),
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to submit")

      setReferenceNumber(data.referenceNumber)
      setShowThankYou(true)
      localStorage.removeItem("ppoQuizData")
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to submit. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const progress = ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100
  const filteredStates = US_STATES.filter((s) => s.toLowerCase().includes(stateSearch.toLowerCase()))

  // ─── Landing Page ────────────────────────────────────────────────────────────
  if (!showQuiz) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="w-full py-4 px-6 flex items-center justify-center border-b bg-[#0A1128]">
          <img src="/images/logo.avif" alt="Dynasty" className="h-16 w-auto" />
        </header>

        <main className="flex-1">

          {/* Hero: Pain Points */}
          <section className="relative text-white py-16 px-6 overflow-hidden">
            <img src="/images/heroes/ppo.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" aria-hidden="true" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#0A1128]/95 via-[#0A1128]/85 to-[#0A1128]/95" aria-hidden="true" />
            <div className="relative max-w-3xl mx-auto text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/20 rounded-full text-[#D4AF37] text-sm font-semibold">
                <Shield className="w-4 h-4" />
                Private Health Coverage
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight text-balance">
                Stop <span className="text-[#D4AF37]">Asking Permission</span> to See a Doctor
              </h1>
              <p className="text-lg text-gray-300 max-w-xl mx-auto">
                Private health coverage for healthy adults under 65. You may be able to see the <span className="text-[#D4AF37] font-semibold">specialists you want</span> and skip the referrals.
              </p>
              <div className="space-y-3 text-left max-w-xl mx-auto">
                {[
                  "Your current plan makes you get a referral just to see a specialist.",
                  "Your premium climbs every renewal but your network keeps shrinking.",
                  "Your plan charges you full price until you hit a deductible you never reach.",
                ].map((q, i) => (
                  <div key={i} className="flex items-start gap-3 bg-white/10 rounded-lg p-4">
                    <AlertCircle className="w-5 h-5 text-[#D4AF37] mt-0.5 flex-shrink-0" />
                    <p className="text-gray-200 text-sm leading-relaxed">{q}</p>
                  </div>
                ))}
              </div>
              <Button
                onClick={() => setShowQuiz(true)}
                size="lg"
                className="bg-[#D4AF37] text-[#0A1128] hover:bg-[#c9a430] active:bg-[#b89228] font-bold h-14 px-10 text-base w-full sm:w-auto"
              >
                Check My Coverage Options - Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <p className="text-gray-400 text-xs">Takes 90 seconds. No obligation. Licensed agents only.</p>
            </div>
          </section>

          {/* Stats Bar */}
          <section className="bg-[#D4AF37] py-5 px-6">
            <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
              { icon: <Globe className="w-4 h-4 flex-shrink-0" />, text: "Access to a PPO network" },
              { icon: <Stethoscope className="w-4 h-4 flex-shrink-0" />, text: "Often no referrals needed" },
              { icon: <Shield className="w-4 h-4 flex-shrink-0" />, text: "You may keep your doctors" },
              { icon: <DollarSign className="w-4 h-4 flex-shrink-0" />, text: "Free consultation with a licensed agent" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-center gap-2 text-[#0A1128] font-semibold text-sm text-center">
                  {item.icon}
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Problem Agitation: HMO Restrictions */}
          <section className="py-16 px-6 bg-background">
            <div className="max-w-4xl mx-auto space-y-12">
              <div className="text-center space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                  HMO Plans Were Built for Insurance Companies. Not for You.
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Every restriction in your HMO plan saves them money. Referrals. Narrow networks.
                  Prior authorizations. Pre-auth delays. Private health coverage can remove much of that.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* HMO Restrictions */}
                <Card className="p-6 border-2 border-red-200 bg-red-50/50">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <XCircle className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-xs text-red-500 font-semibold uppercase tracking-wide">The Problem</p>
                        <h3 className="font-bold text-foreground">HMO & Narrow Network Plans</h3>
                      </div>
                    </div>
                    <ul className="space-y-3">
                      {HMO_PROBLEMS.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                          <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>

                {/* PPO Advantages */}
                <Card className="p-6 border-2 border-green-200 bg-green-50/50">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-green-600 font-semibold uppercase tracking-wide">The Solution</p>
                        <h3 className="font-bold text-foreground">Private Health Coverage</h3>
                      </div>
                    </div>
                    <ul className="space-y-3">
                      {PPO_ADVANTAGES.map((item, i) => (
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

          {/* What PPO Covers */}
          <section className="py-16 px-6 bg-muted/30">
            <div className="max-w-4xl mx-auto space-y-10">
              <div className="text-center space-y-3">
                <h2 className="text-3xl font-bold text-foreground">What Private Health Coverage Can Include</h2>
                <p className="text-muted-foreground text-lg">
                  Benefits vary by plan and availability.
                </p>
              </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {COVERAGE_GAPS.map((item, i) => (
                <Card key={i} className="p-4 md:p-5 text-center space-y-3 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto text-[#D4AF37]">
                      {item.icon}
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
                <h2 className="text-3xl font-bold text-foreground">Getting Better Coverage Is Easy</h2>
                <p className="text-muted-foreground text-lg">Three simple steps to a plan that actually works.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    step: "1",
                    title: "Coverage Review",
                        desc: "A licensed agent reviews your situation to identify what you actually need and what you're currently missing.",
                  },
                  {
                    step: "2",
                    title: "Choose Your Plan",
                    desc: "A licensed agent compares private health coverage options and walks you through what may fit, with clear pricing from the carrier.",
                  },
                  {
                    step: "3",
                    title: "Rest Easy",
                    desc: "Enroll and get coverage that may let you see the doctors you want, without asking permission.",
                  },
                ].map((item, i) => (
                  <div key={i} className="text-center space-y-4">
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

          {/* Values Section */}
          <section className="py-16 px-6 bg-[#0A1128] text-white">
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 items-center">
              <div className="space-y-5 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/20 rounded-full text-[#D4AF37] text-sm font-semibold mx-auto md:mx-0">
                  <Award className="w-4 h-4" />
                  Why Dynasty
                </div>
                <h2 className="text-3xl font-bold leading-tight">
                  Real Coverage. Real People. No Runaround.
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  Dynasty Insurance Group is a team of licensed insurance agents. We do not push a plan on you.
                  We look at your doctors, your budget, and your life. Then we find what fits.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  No pressure. No hidden fees. Just a plan that fits.
                </p>
              </div>
              <div className="space-y-4">
                {[
                  { icon: <Shield className="w-5 h-5" />, title: "Licensed in Your State", desc: "Every agent we work with is state-licensed and compliant." },
                  { icon: <DollarSign className="w-5 h-5" />, title: "100% Free to You", desc: "Our service costs you nothing. We are paid per lead by our licensed insurance partners." },
                  { icon: <Clock className="w-5 h-5" />, title: "5-Minute Response", desc: "A licensed agent contacts you within 5 minutes on business days." },
                  { icon: <Lock className="w-5 h-5" />, title: "Your Data Is Secure", desc: "Your information goes to our licensed insurance partners so a licensed agent can contact you about coverage options." },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 bg-white/5 rounded-xl p-4">
                    <div className="w-10 h-10 bg-[#D4AF37]/20 rounded-lg flex items-center justify-center text-[#D4AF37] flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{item.title}</p>
                      <p className="text-gray-400 text-sm mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Final CTA */}
          <section className="py-16 px-6 bg-[#0A1128] text-white">
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-balance">
                See What Private Health Coverage You May Qualify For
              </h2>
              <p className="text-gray-300 leading-relaxed">
                Takes 90 seconds. No obligation. A licensed agent will contact you within 5 minutes
                with private health coverage options that may fit.
              </p>
              <Button
                onClick={() => setShowQuiz(true)}
                size="lg"
              className="bg-[#D4AF37] text-[#0A1128] hover:bg-[#c9a430] active:bg-[#b89228] font-bold h-14 px-10 text-base w-full sm:w-auto"
            >
              Check My Coverage Options - Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-400 pt-2">
                <span className="flex items-center gap-1.5"><Lock className="w-4 h-4" /> Secure & Private</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-400" /> No Obligation</span>
                <span className="flex items-center gap-1.5"><Shield className="w-4 h-4" /> Licensed Agents Only</span>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    )
  }

  // ─── Quiz Flow ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="w-full py-4 px-6 flex items-center justify-center border-b bg-[#0A1128]">
        <img src="/images/logo.avif" alt="Dynasty" className="h-16 w-auto" />
      </header>

      {/* Progress bar */}
      {!showThankYou && (
        <div className="w-full h-1 bg-muted">
          <motion.div
            className="h-full bg-[#D4AF37]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      )}

      {/* Back button */}
      {!showThankYou && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (currentStep === 1) setShowQuiz(false)
            else prevStep()
          }}
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
        headline="Skip the referrals. Don't skip your coverage options."
      />

          <div className="flex-1 flex items-start justify-center px-4 py-6 sm:px-6 sm:items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={showThankYou ? "thank-you" : currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-2xl"
          >
            {showThankYou ? (
              <div className="space-y-8 pb-12">
                <div className="text-center space-y-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.6 }}
                    className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto shadow-lg"
                  >
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  </motion.div>
                  <div className="space-y-3">
                    <h1 className="text-4xl font-bold text-foreground">
                      You&apos;re All Set, {answers.firstName}!
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
                      A licensed agent is reviewing your information right now and will contact you
                      within 5 minutes with coverage options that may fit.
                    </p>
                  </div>
                </div>

                {/* PPO Advantage Card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <Card className="p-8 bg-gradient-to-br from-[#0A1128] to-[#1a2744] text-white shadow-xl border-0">
                    <div className="text-center space-y-5">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/20 rounded-full text-[#D4AF37] text-sm font-semibold">
                        <Stethoscope className="w-4 h-4" />
                        What a PPO Network Can Offer
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                        {[
                          { label: "Network", hmo: "Narrow, limited doctors", ppo: "Access to a broad PPO network" },
                          { label: "Referrals", hmo: "Required for specialists", ppo: "Often not needed" },
                        ].map((row, i) => (
                          <div key={i} className="bg-white/5 rounded-lg p-3 space-y-2">
                            <p className="text-[#D4AF37] text-xs font-semibold uppercase tracking-wide">{row.label}</p>
                            <div className="flex items-start gap-1.5 text-xs">
                              <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-400">{row.hmo}</span>
                            </div>
                            <div className="flex items-start gap-1.5 text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-100">{row.ppo}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </motion.div>

                {/* Timeline */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <Card className="p-8 border-2 border-[#D4AF37]">
                    <div className="space-y-6">
                      <div className="text-center">
                        <h2 className="text-2xl font-bold text-foreground mb-1">What Happens Next?</h2>
                        <p className="text-muted-foreground text-sm">Your reference number:{" "}
                          <span className="font-mono font-semibold text-foreground">{referenceNumber || "PPO-PENDING"}</span>
                        </p>
                      </div>
                      <div className="space-y-5">
                        {[
                          { icon: <CheckCircle2 className="w-6 h-6 text-green-600" />, bg: "bg-green-100", title: "Right Now: Complete", desc: "Your information is submitted and a licensed agent has been notified.", badge: "Done", badgeColor: "bg-green-100 text-green-700" },
                          { icon: <Clock className="w-6 h-6 text-[#D4AF37]" />, bg: "bg-[#D4AF37]/10 border-2 border-[#D4AF37]", title: "Within 5 Minutes", desc: "A licensed agent reviews your answers and prepares a personalized needs analysis.", badge: "In Progress", badgeColor: "bg-blue-100 text-blue-700" },
                          { icon: <Phone className="w-6 h-6 text-gray-400" />, bg: "bg-gray-100", title: "Enrollment Call", desc: "Your licensed agent conducts a needs analysis, walks you through your options, and can help you enroll if you decide to.", badge: "Upcoming", badgeColor: "bg-gray-100 text-gray-600" },
                        ].map((item, i) => (
                          <div key={i} className="flex gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${item.bg}`}>
                              {item.icon}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.badgeColor}`}>{item.badge}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Step indicator */}
                <div className="text-center">
                  <span className="text-sm text-muted-foreground">Step {currentStep} of {TOTAL_STEPS}</span>
                </div>

                {/* Step 1: Coverage For */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="text-center space-y-3">
                      <h2 className="text-3xl font-bold text-foreground">Who needs coverage?</h2>
                      <p className="text-muted-foreground">This helps us find the right plan size and pricing.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Just Me", value: "individual", icon: <Users className="w-6 h-6" /> },
                        { label: "Me + Spouse", value: "couple", icon: <Heart className="w-6 h-6" /> },
                        { label: "Me + Child(ren)", value: "single_parent", icon: <Users className="w-6 h-6" /> },
                        { label: "My Whole Family", value: "family", icon: <Users className="w-6 h-6" /> },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleAutoAdvance("coverage", opt.value)}
                          className={`p-5 rounded-xl border-2 text-center space-y-2 transition-all duration-150 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 active:scale-[0.98] active:bg-[#D4AF37]/10 ${
                            answers.coverage === opt.value ? "border-[#D4AF37] bg-[#D4AF37]/10" : "border-border"
                          }`}
                        >
                          <div className="text-[#0A1128] flex justify-center">{opt.icon}</div>
                          <p className="font-semibold text-foreground">{opt.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 2: Current Situation */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="text-center space-y-3">
                      <h2 className="text-3xl font-bold text-foreground">What&apos;s your current coverage situation?</h2>
                      <p className="text-muted-foreground">This tells us what plan type will work best for you.</p>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: "I have an HMO or narrow-network plan", value: "hmo" },
                        { label: "I currently have no health insurance", value: "uninsured" },
                        { label: "I'm currently on COBRA", value: "cobra" },
                        { label: "I have employer coverage but want better options", value: "employer" },
                        { label: "I'm self-employed or between jobs", value: "self_employed" },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleAutoAdvance("currentSituation", opt.value)}
                          className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-150 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 active:scale-[0.99] active:bg-[#D4AF37]/10 ${
                            answers.currentSituation === opt.value ? "border-[#D4AF37] bg-[#D4AF37]/10" : "border-border"
                          }`}
                        >
                          <p className="font-medium text-foreground">{opt.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 3: Top Priority */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="text-center space-y-3">
                      <h2 className="text-3xl font-bold text-foreground">What matters most to you in a plan?</h2>
                      <p className="text-muted-foreground">We&apos;ll prioritize this when finding your options.</p>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: "Choosing my own doctors and specialists", value: "doctor_choice", icon: <Stethoscope className="w-5 h-5" /> },
                        { label: "Broad network coverage, I travel or work remotely", value: "nationwide", icon: <Globe className="w-5 h-5" /> },
                        { label: "Low monthly premium", value: "low_premium", icon: <DollarSign className="w-5 h-5" /> },
                        { label: "Low deductible, I use my insurance regularly", value: "low_deductible", icon: <Activity className="w-5 h-5" /> },
                        { label: "Prescription coverage for ongoing medications", value: "prescriptions", icon: <Pill className="w-5 h-5" /> },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleAutoAdvance("priority", opt.value)}
                          className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-4 transition-all duration-150 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 active:scale-[0.99] active:bg-[#D4AF37]/10 ${
                            answers.priority === opt.value ? "border-[#D4AF37] bg-[#D4AF37]/10" : "border-border"
                          }`}
                        >
                          <div className="text-[#D4AF37]">{opt.icon}</div>
                          <p className="font-medium text-foreground">{opt.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 4: Budget */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="text-center space-y-3">
                      <h2 className="text-3xl font-bold text-foreground">What&apos;s your monthly budget for coverage?</h2>
                      <p className="text-muted-foreground">Coverage options range widely. This helps narrow your options.</p>
                    </div>
                    <div className="space-y-3">
                      {PPO_BUDGET_BRACKETS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleAutoAdvance("budget", opt.value)}
                          className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-150 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 active:scale-[0.99] active:bg-[#D4AF37]/10 ${
                            answers.budget === opt.value ? "border-[#D4AF37] bg-[#D4AF37]/10" : "border-border"
                          }`}
                        >
                          <p className="font-medium text-foreground">{opt.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 5: State */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <div className="text-center space-y-3">
                      <h2 className="text-3xl font-bold text-foreground">What state do you need coverage in?</h2>
                      <p className="text-muted-foreground">Availability varies by state. We&apos;ll check your area.</p>
                    </div>
                    <Input
                      type="text"
                      placeholder="Search states..."
                      value={stateSearch}
                      onChange={(e) => setStateSearch(e.target.value)}
                      className="h-12"
                    />
                    <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                      {filteredStates.map((state) => (
                        <button
                          key={state}
                          onClick={() => handleAutoAdvance("state", state)}
                          className={`p-3 rounded-lg border text-sm text-left transition-all duration-150 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 active:scale-[0.98] active:bg-[#D4AF37]/10 ${
                            answers.state === state ? "border-[#D4AF37] bg-[#D4AF37]/10 font-semibold" : "border-border"
                          }`}
                        >
                          {state}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 6: Contact */}
                {currentStep === 6 && (
                  <div className="space-y-6">
                    <div className="text-center space-y-3">
                      <h2 className="text-3xl font-bold text-foreground">Where should we send your coverage options?</h2>
                      <p className="text-muted-foreground">A licensed agent will reach out within 5 minutes.</p>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Input
                          type="number"
                          placeholder="Age *"
                          value={answers.age || ""}
                          onChange={(e) => updateAnswer("age", e.target.value)}
                          min={18}
                          max={100}
                          className={`h-12 ${errors.age ? "border-red-500" : ""}`}
                        />
                        {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Currently enrolled in Medicaid or Medicare?
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {["No", "Yes"].map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => updateAnswer("govCoverage", opt)}
                              className={`p-3 rounded-lg border-2 font-semibold transition-all ${
                                answers.govCoverage === opt
                                  ? "border-[#D4AF37] bg-[#D4AF37]/10"
                                  : "border-border hover:border-[#D4AF37]"
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                        {answers.govCoverage === "Yes" && (
                          <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded p-2">
                            Our private health coverage options are designed for adults not currently enrolled in Medicaid or Medicare. A licensed agent can still walk you through your options.
                          </p>
                        )}
                        {errors.govCoverage && <p className="text-red-500 text-xs">{errors.govCoverage}</p>}
                      </div>
                      <div>
                        <Input
                          type="email"
                          placeholder="Email address *"
                          value={answers.email || ""}
                          onChange={(e) => updateAnswer("email", e.target.value)}
                          className={`h-12 ${errors.email ? "border-red-500" : ""}`}
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                      </div>
                      <div>
                        <Input
                          type="tel"
                          placeholder="Phone number (required)"
                          value={answers.phone || ""}
                          onChange={(e) => updateAnswer("phone", e.target.value)}
                          className={`h-12 ${errors.phone ? "border-red-500" : ""}`}
                        />
                        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={answers.tcpaConsent || false}
                            onChange={(e) => updateAnswer("tcpaConsent", e.target.checked)}
                            className="mt-1"
                          />
                          <span className="text-xs text-muted-foreground leading-relaxed">
                            By checking this box and submitting this form, I provide my electronic signature through which I expressly consent to be contacted by Holy Impact Media and its licensed insurance partners, including licensed insurance agents affiliated with Dynasty Insurance Group and USHEALTH Advisors, LLC, at the telephone number I have provided and that such contact shall be made via telephone calls, text messages (including via automated telephone dialing systems or artificial / prerecorded voice message), and email regarding health coverage options. I understand this website is operated by Holy Impact Media, a marketing company, which will route my information to licensed insurance agents. Consent is not required to purchase any goods or services and may be revoked at any time. Reply STOP to opt out of SMS. I also consent under any applicable state telemarketing laws, including the Florida Telephone Solicitation Act. Message and data rates may apply. Message frequency varies. I further agree to the{" "}
                            <a href="/terms" className="underline hover:text-foreground">Terms of Service</a> and{" "}
                            <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a>.
                          </span>
                        </label>
                        {errors.tcpaConsent && <p className="text-red-500 text-xs">{errors.tcpaConsent}</p>}
                      </div>
                      <Button
                        onClick={handleContactSubmit}
                        className="w-full h-12 bg-[#D4AF37] text-[#0A1128] hover:bg-[#c9a430] active:bg-[#b89228] font-bold"
                      >
                        See My Coverage Options
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <Lock className="w-3 h-3" />
                        Your information is kept secure
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 7 - Name */}
                {currentStep === 7 && (
                  <div className="space-y-6">
                    <div className="text-center space-y-3">
                      <h2 className="text-3xl font-bold text-foreground">Last step: what&apos;s your name?</h2>
                      <p className="text-muted-foreground">So your licensed agent can personalize your options.</p>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Input
                          type="text"
                          placeholder="First name *"
                          value={answers.firstName || ""}
                          onChange={(e) => updateAnswer("firstName", e.target.value)}
                          className={`h-12 ${errors.firstName ? "border-red-500" : ""}`}
                          autoFocus
                        />
                        {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                      </div>
                      <div>
                        <Input
                          type="text"
                          placeholder="Last name *"
                          value={answers.lastName || ""}
                          onChange={(e) => updateAnswer("lastName", e.target.value)}
                          className={`h-12 ${errors.lastName ? "border-red-500" : ""}`}
                        />
                        {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                      </div>
                      {submitError && (
                        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          {submitError}
                        </div>
                      )}
                      <Button
                        onClick={handleNameSubmit}
                        disabled={isSubmitting}
                        className="w-full h-12 bg-[#D4AF37] text-[#0A1128] hover:bg-[#c9a430] active:bg-[#b89228] font-bold"
                      >
                        {isSubmitting ? "Submitting..." : "Get My Coverage Options"}
                        {!isSubmitting && <ArrowRight className="w-4 h-4 ml-2" />}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {showThankYou && <Footer />}
    </div>
  )
}
