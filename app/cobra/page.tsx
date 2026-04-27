"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Footer } from "@/components/Footer"
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
  Calendar,
  Pill,
  Activity,
  ArrowRight,
  Lock,
  Star,
  TrendingDown,
  Award,
  XCircle,
  Stethoscope,
  Eye,
  Smile,
  Zap,
  Globe,
  FileText,
  X,
} from "lucide-react"

const COVERAGE_ITEMS = [
  { icon: <Stethoscope className="w-5 h-5" />, label: "Doctor Visits", desc: "Primary care and specialist visits covered" },
  { icon: <Globe className="w-5 h-5" />, label: "Nationwide Access", desc: "Use doctors anywhere in the country" },
  { icon: <Activity className="w-5 h-5" />, label: "Emergency Care", desc: "ER visits covered at any hospital" },
  { icon: <Pill className="w-5 h-5" />, label: "Prescriptions", desc: "Broad drug formulary, often at lower cost" },
  { icon: <Smile className="w-5 h-5" />, label: "Dental & Vision", desc: "Add-on options available with most plans" },
  { icon: <Heart className="w-5 h-5" />, label: "Mental Health", desc: "Therapy and counseling covered" },
  { icon: <Eye className="w-5 h-5" />, label: "Preventive Care", desc: "Annual exams, screenings, and vaccines" },
  { icon: <Zap className="w-5 h-5" />, label: "Telemedicine", desc: "Concierge virtual visits 24/7 with board-certified physicians" },
]

const COBRA_PROBLEMS = [
  "Costs 102% of your full premium, employer share plus yours",
  "Locked into your old employer's narrow network with no flexibility",
  "Must pay in full each month or lose coverage immediately",
  "Coverage expires after 18 months with no extension",
  "No flexibility. Same plan even if it no longer fits your needs.",
  "Premiums can increase annually with zero notice",
]

const ALTERNATIVE_ADVANTAGES = [
  "Private PPO plans with nationwide coverage and doctor freedom",
  "Keep your preferred doctors or switch to better specialists",
  "Flexible plan tiers to match your healthcare needs and lifestyle",
  "Coverage that continues as long as you need it",
  "No referrals required to see any specialist, anywhere",
  "Enroll in days, not weeks. Same-day applications available.",
]

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
  "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
  "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
  "Wisconsin","Wyoming",
]

const TOTAL_STEPS = 7

export default function COBRAQuizPage() {
  const [currentStep, setCurrentStep] = useState(0)
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
      const saved = localStorage.getItem("cobraQuizData")
      if (saved) {
        const data = JSON.parse(saved)
        setAnswers(data.answers || {})
        setCurrentStep(data.step || 0)
      }
    } catch (e) {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem("cobraQuizData", JSON.stringify({ answers, step: currentStep }))
    } catch (e) {
      // ignore
    }
  }, [answers, currentStep])

  // TrustedForm script
  useEffect(() => {
    if (typeof window !== "undefined") {
      const script = document.createElement("script")
      script.type = "text/javascript"
      script.text = `tf_form_id = 'cobra-alternative-finder';`
      document.head.appendChild(script)
    }
  }, [])

  // Exit intent
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && currentStep > 0 && currentStep < TOTAL_STEPS + 1 && !showExitIntent) {
        setShowExitIntent(true)
      }
    }
    document.addEventListener("mouseleave", handleMouseLeave)
    return () => document.removeEventListener("mouseleave", handleMouseLeave)
  }, [currentStep, showExitIntent])

  const updateAnswer = (key: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: "" }))
  }

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS + 1))
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0))

  const handleAutoAdvance = (key: string, value: any, delay = 400) => {
    updateAnswer(key, value)
    setTimeout(() => nextStep(), delay)
  }

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const validatePhone = (phone: string) => phone.replace(/\D/g, "").length === 10
  const validateName = (name: string) => name.trim().length >= 2

  const handleContactSubmit = () => {
    const newErrors: Record<string, string> = {}
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

      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: answers.firstName,
          lastName: answers.lastName,
          email: answers.email,
          phone: answers.phone,
          state: answers.state,
          tcpaConsent: answers.tcpaConsent,
          trustedFormCertUrl,
          funnelType: "cobra",
          quizAnswers: {
            cobraTimeline: answers.cobraTimeline,
            cobraCost: answers.cobraCost,
            coverageNeeded: answers.coverageNeeded,
            healthConsiderations: answers.healthConsiderations,
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
      localStorage.removeItem("cobraQuizData")
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to submit. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const progress = currentStep >= 1 && currentStep <= TOTAL_STEPS ? (currentStep / TOTAL_STEPS) * 100 : 0

  const filteredStates = US_STATES.filter((s) =>
    s.toLowerCase().includes(stateSearch.toLowerCase())
  )

  // Calculate estimated savings based on cobra cost bracket
  const getEstimatedSavings = () => {
    const cost = answers.cobraCost
    const ranges: Record<string, { cobra: string; low: number; high: number }> = {
      "Under $400/month":    { cobra: "~$400/mo",   low: 160, high: 240 },
      "$400 - $700/month":   { cobra: "~$550/mo",   low: 220, high: 330 },
      "$700 - $1,200/month": { cobra: "~$950/mo",   low: 380, high: 570 },
      "Over $1,200/month":   { cobra: "~$1,200+/mo", low: 480, high: 720 },
    }
    return ranges[cost] || { cobra: "your current amount", low: 200, high: 400 }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="w-full py-4 px-6 flex items-center justify-center border-b bg-[#0A1128]">
        <img src="/images/logo.avif" alt="Dynasty" className="h-16 w-auto" />
      </header>

      {/* Progress bar */}
      {!showThankYou && currentStep >= 1 && currentStep <= TOTAL_STEPS && (
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
      {!showThankYou && currentStep >= 1 && currentStep <= TOTAL_STEPS && (
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

      {/* Exit intent modal */}
      {showExitIntent && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-8 max-w-md w-full relative"
          >
            <button
              onClick={() => setShowExitIntent(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto">
                <DollarSign className="w-8 h-8 text-[#D4AF37]" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Stop Overpaying for COBRA</h3>
              <p className="text-muted-foreground">
                Enter your email and we&apos;ll send you our private guide to COBRA alternatives, premium PPO plans
                built for executives between roles.
              </p>
              <Input
                type="email"
                placeholder="your@email.com"
                value={answers.exitEmail || ""}
                onChange={(e) => updateAnswer("exitEmail", e.target.value)}
                className="h-12"
              />
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowExitIntent(false)} className="flex-1">
                  Continue Quiz
                </Button>
                <Button
                  onClick={() => {
                    if (answers.exitEmail && validateEmail(answers.exitEmail)) {
                      updateAnswer("email", answers.exitEmail)
                      setShowExitIntent(false)
                    }
                  }}
                  className="flex-1 bg-[#D4AF37] text-[#0A1128] hover:bg-[#D4AF37]/90"
                >
                  Send Guide
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Step content */}
      <div className={currentStep === 0 && !showThankYou ? "flex-1" : "flex-1 flex items-start justify-center px-4 py-6 sm:px-6 sm:items-center"}>
        <AnimatePresence mode="wait">
          <motion.div
            key={showThankYou ? "thank-you" : currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className={currentStep === 0 && !showThankYou ? "w-full" : "w-full max-w-2xl"}
          >
            {/* ── THANK YOU ─────────────────────────────────────── */}
            {showThankYou ? (
              (() => {
                const savings = getEstimatedSavings()
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
                        Great news, {answers.firstName}. Alternatives exist.
                      </h1>
                      <p className="text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
                        A licensed specialist is reviewing your options now and will reach out within 10 minutes.
                      </p>
                    </div>

                    {/* Savings comparison card */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Card className="p-8 border-2 border-[#D4AF37] bg-gradient-to-br from-[#0A1128] to-[#1a2744] text-white">
                        <div className="text-center mb-6">
                          <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/20 rounded-full text-[#D4AF37] text-sm font-semibold">
                            <TrendingDown className="w-4 h-4" />
                            Estimated Savings
                          </span>
                        </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="bg-red-900/40 rounded-xl p-5 text-center border border-red-500/30">
                            <p className="text-sm text-red-300 mb-2 font-medium">Your COBRA</p>
                            <p className="text-3xl font-bold text-red-200">{savings.cobra}</p>
                            <p className="text-xs text-red-400 mt-1">Before tax</p>
                          </div>
                          <div className="bg-green-900/40 rounded-xl p-5 text-center border border-green-500/30">
                            <p className="text-sm text-green-300 mb-2 font-medium">Estimated Alternative</p>
                            <p className="text-3xl font-bold text-green-200">
                              ${savings.low}–${savings.high}/mo
                            </p>
                            <p className="text-xs text-green-400 mt-1">Private PPO alternative</p>
                          </div>
                        </div>
                        <p className="text-center text-xs text-gray-400 mt-4">
                          Estimates based on national plan averages. Actual rates depend on plan selection and coverage level.
                        </p>
                      </Card>
                    </motion.div>

                    {/* Timeline */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Card className="p-8 border border-border">
                        <h2 className="text-2xl font-bold text-foreground mb-6 text-center">What Happens Next?</h2>
                        <div className="space-y-6">
                          {[
                            {
                              icon: <CheckCircle2 className="w-6 h-6 text-green-600" />,
                              bg: "bg-green-100",
                              title: "Right Now",
                              badge: { text: "Complete", cls: "bg-green-100 text-green-700" },
                              desc: "Your information has been securely submitted. Our system is matching you with COBRA alternatives available in your state.",
                              extra: null,
                            },
                            {
                              icon: <Clock className="w-6 h-6 text-[#D4AF37]" />,
                              bg: "bg-[#D4AF37]/10 border-2 border-[#D4AF37]",
                              title: "Within 10 Minutes",
                              badge: { text: "In Progress", cls: "bg-blue-100 text-blue-700" },
                              desc: "A licensed health insurance specialist will review your COBRA situation and prepare alternative plan comparisons.",
                              extra: (
                                <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg mt-2">
                                  <Mail className="w-4 h-4 text-[#D4AF37] mt-0.5 flex-shrink-0" />
                                  <span>
                                    Check your inbox for a confirmation with reference number:{" "}
                                    <span className="font-mono font-semibold">
                                      {referenceNumber || "CB-PENDING"}
                                    </span>
                                  </span>
                                </div>
                              ),
                            },
                            {
                              icon: <Phone className="w-6 h-6 text-gray-400" />,
                              bg: "bg-gray-100",
                              title: "Next Steps",
                              badge: { text: "Upcoming", cls: "bg-gray-100 text-gray-600" },
                              desc: "Your specialist will walk you through private PPO options side-by-side with your current COBRA costs and benefits.",
                              extra: null,
                            },
                          ].map((item, i) => (
                            <div key={i} className="flex gap-4">
                              <div className="flex flex-col items-center">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${item.bg}`}>
                                  {item.icon}
                                </div>
                                {i < 2 && <div className="w-0.5 flex-1 bg-gray-200 mt-2" />}
                              </div>
                              <div className="pb-6">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${item.badge.cls}`}>
                                    {item.badge.text}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">{item.desc}</p>
                                {item.extra}
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </motion.div>

                    {/* Disclaimer */}
                    <p className="text-xs text-center text-muted-foreground px-4">
                      By submitting this form, you agree to be contacted by licensed insurance agents. Coverage estimates
                      are illustrative only. Actual premiums depend on age, location, and plan selection.
                    </p>
                  </div>
                )
              })()
            ) : currentStep === 0 ? (
              /* ── LANDING PAGE ─────────────────────────────────── */
              <div className="w-full max-w-none -mx-6 px-0">

                {/* Hero: Pain Points */}
                <section className="relative text-white py-16 px-6 overflow-hidden">
                  <img src="/images/heroes/cobra.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" aria-hidden="true" />
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0A1128]/95 via-[#0A1128]/85 to-[#0A1128]/95" aria-hidden="true" />
                  <div className="relative max-w-3xl mx-auto text-center space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/20 rounded-full text-[#D4AF37] text-sm font-semibold">
                      <AlertCircle className="w-4 h-4" />
                      COBRA Alternatives - Free Consultation
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold leading-tight text-balance">
                      COBRA Is <span className="text-[#D4AF37]">Eating Your Severance</span>. Private PPO Is <span className="text-[#D4AF37]">Half the Cost</span>.
                    </h1>
                    <p className="text-lg text-gray-300 max-w-xl mx-auto">
                      Healthy adults under 64 can replace COBRA with a private PPO and keep their doctors. Often for <span className="text-[#D4AF37] font-semibold">30 to 60% less</span> per month.
                    </p>
                    <div className="space-y-3 text-left max-w-xl mx-auto">
                      {[
                        "You are paying 102% of the full premium. Your employer pays nothing.",
                        "COBRA expires in 18 months. The marketplace will not subsidize you at your income level.",
                        "You are locked into a plan that may not fit your life anymore.",
                      ].map((q, i) => (
                        <div key={i} className="flex items-start gap-3 bg-white/10 rounded-lg p-4">
                          <AlertCircle className="w-5 h-5 text-[#D4AF37] mt-0.5 flex-shrink-0" />
                          <p className="text-gray-200 text-sm leading-relaxed">{q}</p>
                        </div>
                      ))}
                    </div>
                    <Button
                      onClick={() => setCurrentStep(1)}
                      size="lg"
                      className="bg-[#D4AF37] text-[#0A1128] hover:bg-[#c9a430] active:bg-[#b89228] font-bold h-14 px-10 text-base w-full sm:w-auto"
                    >
                      See My COBRA Alternatives - Free
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                    <p className="text-gray-400 text-xs">Takes 90 seconds. No obligation. Licensed agents only.</p>
                  </div>
                </section>

                {/* Stats Bar */}
                <section className="bg-[#D4AF37] py-5 px-6">
                  <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { icon: <DollarSign className="w-4 h-4 flex-shrink-0" />, text: "Avg COBRA premium: $850/month" },
                      { icon: <TrendingDown className="w-4 h-4 flex-shrink-0" />, text: "Save 40-60% vs COBRA" },
                      { icon: <Globe className="w-4 h-4 flex-shrink-0" />, text: "Nationwide PPO Networks" },
                      { icon: <Stethoscope className="w-4 h-4 flex-shrink-0" />, text: "No Referrals Required" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-center gap-2 text-[#0A1128] font-semibold text-sm text-center">
                        {item.icon}
                        <span>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Problem Agitation */}
                <section className="py-16 px-6 bg-background">
                  <div className="max-w-4xl mx-auto space-y-12">
                    <div className="text-center space-y-4">
                      <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                        COBRA Was Never Meant to Be a Long-Term Plan
                      </h2>
                      <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        COBRA is a bridge. It was never built to be affordable. The moment you lose your job,
                        your employer stops paying. You pay everything plus a 2% admin fee.
                        Most people can get the same or better coverage for far less.
                      </p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <Card className="p-6 border-2 border-red-200 bg-red-50/50">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                              <XCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                              <p className="text-xs text-red-500 font-semibold uppercase tracking-wide">The Problem</p>
                              <h3 className="font-bold text-foreground">Staying on COBRA</h3>
                            </div>
                          </div>
                          <ul className="space-y-3">
                            {COBRA_PROBLEMS.map((item, i) => (
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
                              <p className="text-xs text-green-600 font-semibold uppercase tracking-wide">The Solution</p>
                              <h3 className="font-bold text-foreground">Private PPO Alternatives</h3>
                            </div>
                          </div>
                          <ul className="space-y-3">
                            {ALTERNATIVE_ADVANTAGES.map((item, i) => (
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
                      <h2 className="text-3xl font-bold text-foreground">Private PPO Plans Cover Everything COBRA Did</h2>
                      <p className="text-muted-foreground text-lg">
                        Same benefits. Real networks. A fraction of the cost.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                      {COVERAGE_ITEMS.map((item, i) => (
                        <Card key={i} className="p-4 md:p-5 text-center space-y-3 hover:shadow-md transition-shadow">
                          <div className="w-11 h-11 md:w-12 md:h-12 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto text-[#D4AF37]">
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
                      <h2 className="text-3xl font-bold text-foreground">Switching Takes 3 Steps. COBRA Takes Your Money.</h2>
                      <p className="text-muted-foreground text-lg">Stop overpaying. Start today.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {[
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
                      ].map((item, i) => (
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
                        Why Dynasty
                      </div>
                      <h2 className="text-3xl font-bold leading-tight">
                        Losing Your Job Is Hard. Losing Your Coverage Does Not Have to Follow.
                      </h2>
                      <p className="text-gray-300 leading-relaxed">
                        Dynasty Insurance Group connects executives and entrepreneurs leaving COBRA with private PPO
                        plans built for high earners, often with broader networks and richer benefits. We are not a
                        public exchange. We are licensed specialists who curate carrier-direct options for you.
                      </p>
                      <p className="text-gray-300 leading-relaxed">
                        No pressure. Concierge service. Just answers.
                      </p>
                    </div>
                    <div className="space-y-4">
                      {[
                        { icon: <Shield className="w-5 h-5" />, title: "Licensed in Your State", desc: "Every agent we work with is state-licensed and compliant." },
                        { icon: <DollarSign className="w-5 h-5" />, title: "Carrier-Compensated", desc: "Premiums are identical whether you work with us or buy direct. Carriers compensate us." },
                        { icon: <Clock className="w-5 h-5" />, title: "10-Minute Response", desc: "A real specialist contacts you within 10 minutes on business days." },
                        { icon: <Lock className="w-5 h-5" />, title: "Your Data Is Secure", desc: "We never sell your information to third parties." },
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-full flex items-center justify-center flex-shrink-0 text-[#D4AF37]">
                            {item.icon}
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

                {/* Final CTA */}
                <section className="py-16 px-6 bg-background">
                  <div className="max-w-2xl mx-auto text-center space-y-6">
                    <h2 className="text-3xl font-bold text-foreground">Stop Overpaying. Start Saving.</h2>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                      It takes 90 seconds to find out how much you could save. Licensed agents, no obligation.
                    </p>
                    <Button
                      onClick={() => setCurrentStep(1)}
                      size="lg"
                      className="bg-[#D4AF37] text-[#0A1128] hover:bg-[#c9a430] active:bg-[#b89228] font-bold h-14 px-10 text-base w-full sm:w-auto"
                    >
                      Check My Alternatives - Free
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                    <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5"><Lock className="w-4 h-4 flex-shrink-0" /> Secure &amp; Private</span>
                      <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 flex-shrink-0" /> Free, No Obligation</span>
                      <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Licensed Agents</span>
                    </div>
                  </div>
                </section>
              </div>
            ) : (
              /* ── QUIZ STEPS ───────────────────────────────────── */
              <div className="space-y-6">
                {/* Step counter */}
                <div className="text-center text-sm text-muted-foreground font-medium">
                  Step {currentStep} of {TOTAL_STEPS}
                </div>

                {/* Step 1: COBRA Timeline */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <h2 className="text-3xl font-bold text-foreground">What&apos;s your COBRA situation?</h2>
                      <p className="text-muted-foreground">This helps us find the most urgent alternatives for you.</p>
                    </div>
                    <div className="grid gap-3">
                      {[
                        { value: "just-received", label: "Just got the COBRA notice", desc: "Recently lost job coverage" },
                        { value: "on-cobra-expensive", label: "Currently on COBRA, too expensive", desc: "Actively paying COBRA now" },
                        { value: "cobra-ending", label: "COBRA ending in 60 days", desc: "Approaching the 18-month limit" },
                        { value: "exploring", label: "Exploring options before deciding", desc: "Haven't signed up for COBRA yet" },
                      ].map((option) => (
                        <Card
                          key={option.value}
                          onClick={() => handleAutoAdvance("cobraTimeline", option.value)}
                          className={`p-5 cursor-pointer border-2 transition-all duration-150 hover:border-[#D4AF37] hover:shadow-md active:scale-[0.99] active:bg-[#D4AF37]/10 ${
                            answers.cobraTimeline === option.value
                              ? "border-[#D4AF37] bg-[#D4AF37]/5"
                              : "border-border"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-2xl">{option.icon}</span>
                            <div>
                              <div className="font-semibold text-foreground">{option.label}</div>
                              <div className="text-sm text-muted-foreground">{option.desc}</div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 2: Monthly COBRA Cost */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <h2 className="text-3xl font-bold text-foreground">What are you paying for COBRA each month?</h2>
                      <p className="text-muted-foreground">Include all family members on the plan.</p>
                    </div>
                    <div className="grid gap-3">
                      {[
                        { value: "Under $400/month", desc: "Relatively low for an individual plan" },
                        { value: "$400 - $700/month", desc: "Typical for a single person" },
                        { value: "$700 - $1,200/month", desc: "Family or older individual" },
                        { value: "Over $1,200/month", desc: "Large family or senior coverage" },
                      ].map((option) => (
                        <Card
                          key={option.value}
                          onClick={() => handleAutoAdvance("cobraCost", option.value)}
                          className={`p-5 cursor-pointer border-2 transition-all duration-150 hover:border-[#D4AF37] hover:shadow-md active:scale-[0.99] active:bg-[#D4AF37]/10 ${
                            answers.cobraCost === option.value
                              ? "border-[#D4AF37] bg-[#D4AF37]/5"
                              : "border-border"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-foreground">{option.value}</div>
                              <div className="text-sm text-muted-foreground">{option.desc}</div>
                            </div>
                            <DollarSign className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 3: Coverage Needed */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <h2 className="text-3xl font-bold text-foreground">Who needs coverage?</h2>
                      <p className="text-muted-foreground">We&apos;ll find plans sized for your household.</p>
                    </div>
                    <div className="grid gap-3">
                      {[
                        { value: "Just me", icon: <Activity className="w-5 h-5 text-[#D4AF37]" />, desc: "Individual plan" },
                        { value: "Me + spouse", icon: <Heart className="w-5 h-5 text-[#D4AF37]" />, desc: "Two adults" },
                        { value: "Me + children", icon: <Users className="w-5 h-5 text-[#D4AF37]" />, desc: "Parent with kids" },
                        { value: "Entire family", icon: <Users className="w-5 h-5 text-[#D4AF37]" />, desc: "Spouse and children" },
                      ].map((option) => (
                        <Card
                          key={option.value}
                          onClick={() => handleAutoAdvance("coverageNeeded", option.value)}
                          className={`p-5 cursor-pointer border-2 transition-all duration-150 hover:border-[#D4AF37] hover:shadow-md active:scale-[0.99] active:bg-[#D4AF37]/10 ${
                            answers.coverageNeeded === option.value
                              ? "border-[#D4AF37] bg-[#D4AF37]/5"
                              : "border-border"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0">
                              {option.icon}
                            </div>
                            <div>
                              <div className="font-semibold text-foreground">{option.value}</div>
                              <div className="text-sm text-muted-foreground">{option.desc}</div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 4: Health Considerations */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <h2 className="text-3xl font-bold text-foreground">Any ongoing health needs?</h2>
                      <p className="text-muted-foreground">Helps us prioritize the right network and benefits.</p>
                    </div>
                    <div className="grid gap-3">
                      {[
                        { value: "Healthy, just need a safety net", icon: <Shield className="w-5 h-5 text-green-600" />, desc: "Minimal regular care" },
                        { value: "I take regular medications", icon: <Pill className="w-5 h-5 text-blue-600" />, desc: "Prescription drug coverage important" },
                        { value: "Managing a chronic condition", icon: <Activity className="w-5 h-5 text-orange-600" />, desc: "Ongoing specialist care" },
                        { value: "Currently in treatment", icon: <Heart className="w-5 h-5 text-red-600" />, desc: "Active care continuity is critical" },
                      ].map((option) => (
                        <Card
                          key={option.value}
                          onClick={() => handleAutoAdvance("healthConsiderations", option.value)}
                          className={`p-5 cursor-pointer border-2 transition-all duration-150 hover:border-[#D4AF37] hover:shadow-md active:scale-[0.99] active:bg-[#D4AF37]/10 ${
                            answers.healthConsiderations === option.value
                              ? "border-[#D4AF37] bg-[#D4AF37]/5"
                              : "border-border"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                              {option.icon}
                            </div>
                            <div>
                              <div className="font-semibold text-foreground">{option.value}</div>
                              <div className="text-sm text-muted-foreground">{option.desc}</div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 5: State */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <h2 className="text-3xl font-bold text-foreground">What state do you live in?</h2>
                      <p className="text-muted-foreground">Carrier networks and plan availability vary by state.</p>
                    </div>
                    <Input
                      type="text"
                      placeholder="Search states..."
                      value={stateSearch}
                      onChange={(e) => setStateSearch(e.target.value)}
                      className="h-12 text-base"
                      autoFocus
                    />
                    <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                      {filteredStates.map((state) => (
                        <button
                          key={state}
                          onClick={() => handleAutoAdvance("state", state)}
                          className={`p-3 text-sm rounded-lg border-2 text-left font-medium transition-all hover:border-[#D4AF37] ${
                            answers.state === state
                              ? "border-[#D4AF37] bg-[#D4AF37]/10 text-foreground"
                              : "border-border text-foreground hover:bg-muted/50"
                          }`}
                        >
                          {state}
                        </button>
                      ))}
                    </div>
                    {errors.state && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" /> {errors.state}
                      </p>
                    )}
                  </div>
                )}

                {/* Step 6: Contact Info */}
                {currentStep === 6 && (
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <h2 className="text-3xl font-bold text-foreground">Where should we send your options?</h2>
                      <p className="text-muted-foreground">A licensed specialist will reach out within 10 minutes.</p>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Phone <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            type="tel"
                            placeholder="(555) 000-0000"
                            value={answers.phone || ""}
                            onChange={(e) => updateAnswer("phone", e.target.value)}
                            className={`pl-10 h-12 ${errors.phone ? "border-destructive" : ""}`}
                          />
                        </div>
                        {errors.phone && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" /> {errors.phone}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Email <span className="text-destructive">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            type="email"
                            placeholder="your@email.com"
                            value={answers.email || ""}
                            onChange={(e) => updateAnswer("email", e.target.value)}
                            className={`pl-10 h-12 ${errors.email ? "border-destructive" : ""}`}
                          />
                        </div>
                        {errors.email && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" /> {errors.email}
                          </p>
                        )}
                      </div>

                      {/* TCPA consent */}
                      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={answers.tcpaConsent || false}
                            onChange={(e) => updateAnswer("tcpaConsent", e.target.checked)}
                            className="mt-1 w-4 h-4 accent-[#D4AF37]"
                          />
                          <span className="text-xs text-muted-foreground leading-relaxed">
                            By checking this box and submitting this form, I provide my express written consent to be
                            contacted by Dynasty Insurance Group via phone calls, text messages (including via autodialer
                            or prerecorded message), and email regarding health insurance options. Consent is not
                            required to purchase any product or service. Message and data rates may apply. Reply STOP to
                            opt out. See our{" "}
                            <a href="/terms" className="underline hover:text-foreground">Terms of Service</a> and{" "}
                            <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a>.
                          </span>
                        </label>
                        {errors.tcpaConsent && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" /> {errors.tcpaConsent}
                          </p>
                        )}
                      </div>

                      <Button
                        onClick={handleContactSubmit}
                        className="w-full h-12 bg-[#D4AF37] text-[#0A1128] hover:bg-[#c9a430] active:bg-[#b89228] font-semibold text-base"
                      >
                        Continue
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 7: Name + Submit */}
                {currentStep === 7 && (
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <h2 className="text-3xl font-bold text-foreground">Almost there. What&apos;s your name?</h2>
                      <p className="text-muted-foreground">So your specialist can personalize your options.</p>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">First name</label>
                          <Input
                            type="text"
                            placeholder="Jane"
                            value={answers.firstName || ""}
                            onChange={(e) => updateAnswer("firstName", e.target.value)}
                            className={`h-12 ${errors.firstName ? "border-destructive" : ""}`}
                          />
                          {errors.firstName && (
                            <p className="text-xs text-destructive flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> {errors.firstName}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Last name</label>
                          <Input
                            type="text"
                            placeholder="Smith"
                            value={answers.lastName || ""}
                            onChange={(e) => updateAnswer("lastName", e.target.value)}
                            className={`h-12 ${errors.lastName ? "border-destructive" : ""}`}
                          />
                          {errors.lastName && (
                            <p className="text-xs text-destructive flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> {errors.lastName}
                            </p>
                          )}
                        </div>
                      </div>

                      {submitError && (
                        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          {submitError}
                        </div>
                      )}

                      <Button
                        onClick={handleNameSubmit}
                        disabled={isSubmitting}
                        className="w-full h-12 bg-[#D4AF37] text-[#0A1128] hover:bg-[#D4AF37]/90 font-bold text-base disabled:opacity-50"
                      >
                        {isSubmitting ? "Finding your options..." : "Show My COBRA Alternatives"}
                        {!isSubmitting && <ArrowRight className="w-4 h-4 ml-2" />}
                      </Button>

                      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <Lock className="w-3 h-3" />
                        <span>Your information is encrypted and never sold</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {(currentStep === 0 || showThankYou) && <Footer />}
    </div>
  )
}
