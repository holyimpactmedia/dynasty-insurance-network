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
  Lock,
  Users,
  Heart,
  DollarSign,
  Baby,
  Home,
  ArrowRight,
  Award,
  Activity,
  XCircle,
  AlertCircle,
  Stethoscope,
  Smile,
  Zap,
  Globe,
  FileText,
} from "lucide-react"

import { SERVICED_STATES } from "@/lib/serviced-states"
import {
  FAMILY_INCOME_BRACKETS_BY_SIZE,
  parseHouseholdSize,
} from "@/lib/income-thresholds"
const FAMILY_COVERAGE_ITEMS = [
  { icon: <Baby className="w-5 h-5" />, label: "Pediatric Care", desc: "Routine checkups, vaccines, and specialist visits for kids" },
  { icon: <Stethoscope className="w-5 h-5" />, label: "Specialist Access", desc: "See specialists in the plan network, often without a referral" },
  { icon: <Globe className="w-5 h-5" />, label: "PPO Network Access", desc: "Coverage that can access a broad PPO network of providers" },
  { icon: <Activity className="w-5 h-5" />, label: "Emergency Care", desc: "Emergency room care may be covered under your plan" },
  { icon: <Smile className="w-5 h-5" />, label: "Dental & Vision", desc: "Add-on options available for your family" },
  { icon: <Zap className="w-5 h-5" />, label: "Telemedicine", desc: "Virtual visits may be available, not offered with every plan or in every state" },
]

const FAMILY_PROBLEMS = [
  "Employer family coverage can carry high monthly premiums with limited networks",
  "Narrow networks mean your pediatrician may not be covered",
  "High deductibles can leave families exposed to unexpected bills",
  "Kids aging off your plan at 26 with limited private options",
  "Regional coverage limits can leave your family with gaps when traveling",
  "Many plans may not include dental and vision options for your family",
]

const FAMILY_ADVANTAGES = [
  "Private health coverage that can access a PPO network for your family",
  "Pediatric specialists that may be accessible without a referral",
  "Options that can let you keep your family's doctors, including pediatricians and OB-GYNs",
  "Access to a broad PPO network of hospitals and physicians",
  "Dental and vision add-ons available",
  "Flexible enrollment options for growing families",
]

const US_STATES = SERVICED_STATES

const TOTAL_STEPS = 8

export default function FamilyQuizPage() {
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
      const saved = localStorage.getItem("familyQuizData")
      if (saved) {
        const data = JSON.parse(saved)
        setAnswers(data.answers || {})
        setCurrentStep(data.step || 0)
      }
    } catch (e) { /* ignore */ }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem("familyQuizData", JSON.stringify({ answers, step: currentStep }))
    } catch (e) { /* ignore */ }
  }, [answers, currentStep])

  // TrustedForm script
  useEffect(() => {
    if (typeof window !== "undefined") {
      const script = document.createElement("script")
      script.type = "text/javascript"
      script.text = `tf_form_id = 'family-health-plan-selector';`
      document.head.appendChild(script)
    }
  }, [])

  // Exit intent - one-shot per browser session, desktop only (mouseleave on
  // touch devices fires unpredictably). Skips the landing page and skips
  // anyone who has already submitted.
  useEffect(() => {
    if (showThankYou) return
    if (currentStep <= 0 || currentStep > TOTAL_STEPS) return
    if (typeof window === "undefined") return

    const SESSION_KEY = "exitIntentShown_family"
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
  }, [currentStep, showExitIntent, showThankYou])

  const updateAnswer = (key: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: "" }))
  }

  const toggleMultiAnswer = (key: string, value: string) => {
    setAnswers((prev) => {
      const current: string[] = prev[key] || []
      return {
        ...prev,
        [key]: current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value],
      }
    })
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
          age: answers.primaryAge,
          state: answers.state,
          incomeRange: answers.income,
          tcpaConsent: answers.tcpaConsent,
          trustedFormCertUrl,
          funnelType: "family",
          quizAnswers: {
            familyComposition: answers.familyComposition,
            childrenAges: answers.childrenAges,
            priority: answers.priority,
            currentCoverage: answers.currentCoverage,
            income: answers.income,
            healthScreen: answers.healthScreen,
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
      localStorage.removeItem("familyQuizData")
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to submit. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const progress = currentStep >= 1 && currentStep <= TOTAL_STEPS ? (currentStep / TOTAL_STEPS) * 100 : 0
  const filteredStates = US_STATES.filter((s) => s.toLowerCase().includes(stateSearch.toLowerCase()))

  // Determine if children are involved (skip Step 2 if no children)
  const hasChildren = answers.familyComposition && answers.familyComposition !== "2 adults, no children"

  // Step options
  const familyCompositionOptions = [
    { value: "2 adults, no children", icon: <Users className="w-6 h-6" />, label: "2 adults, no children" },
    { value: "2 adults + 1-2 children", icon: <Home className="w-6 h-6" />, label: "2 adults + 1–2 children" },
    { value: "2 adults + 3 or more children", icon: <Baby className="w-6 h-6" />, label: "2 adults + 3 or more children" },
    { value: "Single parent with children", icon: <Heart className="w-6 h-6" />, label: "Single parent with children" },
  ]

  const childrenAgesOptions = answers.familyComposition === "2 adults, no children"
    ? [{ value: "No children", label: "No children" }]
    : [
        { value: "Under 5 (infant/toddler)", label: "Under 5 (infant/toddler)" },
        { value: "5-12 (school age)", label: "5–12 (school age)" },
        { value: "13-17 (teenager)", label: "13–17 (teenager)" },
        { value: "18-25 (young adult)", label: "18–25 (young adult)" },
      ]

  const priorityOptions = [
    { value: "Top pediatric specialists & children's hospitals", icon: <Baby className="w-6 h-6" />, label: "Top pediatric specialists & children's hospitals" },
    { value: "Access to specialists, often without referrals", icon: <Stethoscope className="w-6 h-6" />, label: "Access to specialists, often without referrals" },
    { value: "Low deductibles and predictable family budget", icon: <Shield className="w-6 h-6" />, label: "Low deductibles and predictable family budget" },
  ]

  const coverageOptions = [
    { value: "No coverage right now", label: "No coverage right now" },
    { value: "Employer plan is too restrictive", label: "Employer plan is too restrictive" },
    { value: "Currently on an HMO and want private coverage", label: "Currently on an HMO and want private coverage" },
    { value: "Child aging off my plan soon", label: "Child aging off my plan soon" },
  ]

  // Income brackets are scoped to household size so the floor sits above the
  // 2026 subsidy threshold for that household. Set in lib/income-thresholds.ts.
  const householdSize = parseHouseholdSize(answers.familyComposition)
  const incomeOptions = FAMILY_INCOME_BRACKETS_BY_SIZE[householdSize]

  // Effective step accounting for the skipped children step
  const getEffectiveStep = () => {
    if (!hasChildren && currentStep >= 2) return currentStep + 1
    return currentStep
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
      <ExitIntentDialog
        open={showExitIntent}
        onClose={() => setShowExitIntent(false)}
        onContinue={() => setShowExitIntent(false)}
        progress={progress}
        headline="Your family is one step away from your coverage options."
      />

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
                  <h1 className="text-4xl md:text-5xl font-bold text-foreground text-balance">
                    Your family coverage options are being prepared, {answers.firstName}.
                  </h1>
                  <p className="text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
                    A licensed agent will contact you within 5 minutes.
                  </p>
                </div>

                {/* Coverage features card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="p-8 border-2 border-[#D4AF37] bg-gradient-to-br from-[#0A1128] to-[#1a2744] text-white">
                    <div className="text-center mb-6">
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/20 rounded-full text-[#D4AF37] text-sm font-semibold">
                        <Award className="w-4 h-4" />
                        What Your Family Gets
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center mb-4">
                      <div className="bg-white/10 rounded-xl p-4">
                        <p className="text-xs text-gray-300 mb-1">Network</p>
                        <p className="text-xl font-bold">PPO</p>
                        <p className="text-xs text-gray-400 mt-1">Broad provider access</p>
                      </div>
                      <div className="bg-[#D4AF37]/20 rounded-xl p-4 border border-[#D4AF37]/40">
                        <p className="text-xs text-[#D4AF37] mb-1">Referrals</p>
                        <p className="text-xl font-bold text-[#D4AF37]">Flexible</p>
                        <p className="text-xs text-[#D4AF37]/70 mt-1">Varies by plan</p>
                      </div>
                      <div className="bg-white/10 rounded-xl p-4">
                        <p className="text-xs text-gray-300 mb-1">Pediatric</p>
                        <p className="text-xl font-bold">Available</p>
                        <p className="text-xs text-gray-400 mt-1">Ask your agent</p>
                      </div>
                    </div>
                    <p className="text-center text-sm text-gray-300">
                      Your licensed agent will present private health coverage options tailored to your household.
                    </p>
                    <p className="text-center text-xs text-gray-500 mt-2">
                      Rates depend on age, location, and plan selection. Your licensed agent shows you exact pricing.
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
                          desc: "Your family's information has been securely submitted. Our system is matching you with family plans available in your state.",
                          extra: null,
                        },
                        {
                          icon: <Clock className="w-6 h-6 text-[#D4AF37]" />,
                          bg: "bg-[#D4AF37]/10 border-2 border-[#D4AF37]",
                          title: "Within 5 Minutes",
                          badge: { text: "In Progress", cls: "bg-blue-100 text-blue-700" },
                          desc: "A licensed insurance agent will review your situation and prepare personalized health coverage options including pediatric benefits.",
                          extra: (
                            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg mt-2">
                              <Mail className="w-4 h-4 text-[#D4AF37] mt-0.5 flex-shrink-0" />
                              <span>
                                Check your inbox for a confirmation with reference number:{" "}
                                <span className="font-mono font-semibold">
                                  {referenceNumber || "FM-PENDING"}
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
                          desc: "Your licensed agent will conduct a needs analysis and review private health coverage options with you.",
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

                <p className="text-xs text-center text-muted-foreground px-4">
                  By submitting this form, you agree to be contacted by licensed insurance agents. Coverage estimates
                  are illustrative only. Actual premiums depend on age, location, and plan selection.
                </p>
              </div>

            ) : currentStep === 0 ? (
              /* ── LANDING PAGE ─────────────────────────────────── */
              <div className="w-full max-w-none">

                {/* Hero */}
                <section className="relative text-white py-16 px-6 overflow-hidden">
                  <img src="/images/heroes/family.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" aria-hidden="true" />
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0A1128]/95 via-[#0A1128]/85 to-[#0A1128]/95" aria-hidden="true" />
                  <div className="relative max-w-3xl mx-auto text-center space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/20 rounded-full text-[#D4AF37] text-sm font-semibold">
                      <Heart className="w-4 h-4" />
                      Family Health Coverage - Free Consultation
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold leading-tight text-balance">
                      Private Family Health Coverage That <span className="text-[#D4AF37]">Fits Your Family</span>
                    </h1>
                    <p className="text-lg text-gray-300 max-w-xl mx-auto">
                      Private health coverage for working families that can access a PPO network. Keep your doctors and explore specialist options for your household.
                    </p>
                    <div className="space-y-3 text-left max-w-xl mx-auto">
                      {[
                        "Families paying high monthly premiums for narrow-network plans they can barely use.",
                        "Pediatricians and specialists who suddenly aren't in-network when you need them most.",
                        "Employer family coverage with deductibles so high one ER visit wipes out your savings.",
                      ].map((q, i) => (
                        <div key={i} className="flex items-start gap-3 bg-white/10 rounded-lg p-4">
                          <AlertCircle className="w-5 h-5 text-[#D4AF37] mt-0.5 flex-shrink-0" />
                          <p className="text-gray-200 text-sm leading-relaxed">{q}</p>
                        </div>
                      ))}
                    </div>
                    <Button
                      onClick={nextStep}
                      size="lg"
                      className="bg-[#D4AF37] text-[#0A1128] hover:bg-[#c9a430] active:bg-[#b89228] font-bold h-14 px-10 text-base w-full sm:w-auto"
                    >
                      Find Family Plans - Free
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
                      { icon: <Stethoscope className="w-4 h-4 flex-shrink-0" />, text: "Keep your doctors" },
                      { icon: <Shield className="w-4 h-4 flex-shrink-0" />, text: "See specialists in-network" },
                      { icon: <DollarSign className="w-4 h-4 flex-shrink-0" />, text: "Free consultation" },
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
                        Your Family Deserves Coverage That Works Around You
                      </h2>
                      <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Many family plans limit you to narrow networks with referrals for specialists.
                        Private health coverage that accesses a PPO network can give your family more freedom to choose doctors.
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
                              <h3 className="font-bold text-foreground">Typical Employer Family Plans</h3>
                            </div>
                          </div>
                          <ul className="space-y-3">
                            {FAMILY_PROBLEMS.map((item, i) => (
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
                              <h3 className="font-bold text-foreground">Private Health Coverage</h3>
                            </div>
                          </div>
                          <ul className="space-y-3">
                            {FAMILY_ADVANTAGES.map((item, i) => (
                              <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span dangerouslySetInnerHTML={{ __html: item }} />
                              </li>
                            ))}
                          </ul>
                        </div>
                      </Card>
                    </div>
                  </div>
                </section>

                {/* Coverage Grid */}
                <section className="py-16 px-6 bg-muted/30">
                  <div className="max-w-4xl mx-auto space-y-10">
                    <div className="text-center space-y-3">
                      <h2 className="text-3xl font-bold text-foreground">Coverage Options for Your Whole Family</h2>
                      <p className="text-muted-foreground text-lg">
                        Private health coverage with benefit options for your family.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                      {FAMILY_COVERAGE_ITEMS.map((item, i) => (
                        <Card key={i} className="p-5 text-center space-y-3 hover:shadow-md transition-shadow">
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
                      <h2 className="text-3xl font-bold text-foreground">Getting the Right Family Plan Takes 3 Steps</h2>
                      <p className="text-muted-foreground text-lg">Simple. Fast. No pressure.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {[
                        {
                          step: "1",
                          title: "Tell Us About Your Family",
                          desc: "Kids ages, your doctors, your priorities. 90 seconds. No jargon.",
                        },
                        {
                          step: "2",
                          title: "See Your Options",
                          desc: "A licensed agent shows you private health coverage options and pricing, side by side.",
                        },
                        {
                          step: "3",
                          title: "Enroll and Relax",
                          desc: "Pick your plan and enroll. Your licensed agent explains when coverage can begin.",
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

                {/* Values / Mission */}
                <section className="py-16 px-6 bg-[#0A1128] text-white">
                  <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 items-center">
                    <div className="space-y-5 text-center md:text-left">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/20 rounded-full text-[#D4AF37] text-sm font-semibold mx-auto md:mx-0">
                        <Award className="w-4 h-4" />
                        Why Dynasty
                      </div>
                      <h2 className="text-3xl font-bold leading-tight">
                        Your Family Deserves Better Access to Care
                      </h2>
                      <p className="text-gray-300 leading-relaxed">
                        Dynasty Insurance Group finds private health coverage options that can let your kids
                        see their pediatrician, often without a referral, and that can access a broad PPO
                        network of providers.
                      </p>
                      <p className="text-gray-300 leading-relaxed">
                        One call. No pressure. We handle the comparison work for you.
                      </p>
                    </div>
                    <div className="space-y-4">
                      {[
                        { icon: <Shield className="w-5 h-5" />, title: "Licensed in Your State", desc: "Every agent we work with is state-licensed and compliant." },
                        { icon: <DollarSign className="w-5 h-5" />, title: "100% Free to You", desc: "Our service costs you nothing. We are paid per lead by our licensed insurance partners." },
                        { icon: <Clock className="w-5 h-5" />, title: "5-Minute Response", desc: "A licensed agent contacts you within 5 minutes on business days." },
                        { icon: <Lock className="w-5 h-5" />, title: "Your Data Is Handled Carefully", desc: "Your information is shared with our licensed insurance partners so a licensed agent can contact you about coverage options." },
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
                    <h2 className="text-3xl font-bold text-foreground">Your Family Is Worth It. Let&apos;s Find the Right Plan.</h2>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                      Takes 90 seconds. Free, no obligation. Licensed agents who specialize in family coverage.
                    </p>
                    <Button
                      onClick={nextStep}
                      size="lg"
                      className="bg-[#D4AF37] text-[#0A1128] hover:bg-[#c9a430] active:bg-[#b89228] font-bold h-14 px-10 text-base w-full sm:w-auto"
                    >
                      Find Our Family Plans - Free
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                    <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Lock className="w-4 h-4" /> Secure &amp; Private</span>
                      <span className="flex items-center gap-1"><Shield className="w-4 h-4" /> Free, No Obligation</span>
                      <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Licensed Agents</span>
                    </div>
                  </div>
                </section>
              </div>

            ) : currentStep === 1 ? (
              /* ── STEP 1: Family Composition ───────────────────── */
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-[#D4AF37] uppercase tracking-wide">Step 1 of {TOTAL_STEPS}</p>
                  <h2 className="text-3xl font-bold text-foreground">Who needs coverage?</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {familyCompositionOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleAutoAdvance("familyComposition", opt.value)}
                      className={`p-5 rounded-xl border-2 text-left transition-all hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 flex items-center gap-4 ${
                        answers.familyComposition === opt.value
                          ? "border-[#D4AF37] bg-[#D4AF37]/5"
                          : "border-border"
                      }`}
                    >
                      <div className="text-[#D4AF37]">{opt.icon}</div>
                      <span className="font-medium text-foreground">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

            ) : currentStep === 2 ? (
              /* ── STEP 2: Children's Ages (skip if no children) ── */
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-[#D4AF37] uppercase tracking-wide">Step 2 of {TOTAL_STEPS}</p>
                  <h2 className="text-3xl font-bold text-foreground">How old are your children?</h2>
                  <p className="text-muted-foreground">Select all that apply</p>
                </div>
                <div className="space-y-3">
                  {childrenAgesOptions.map((opt) => {
                    const selected = (answers.childrenAges || []).includes(opt.value)
                    return (
                      <button
                        key={opt.value}
                        onClick={() => toggleMultiAnswer("childrenAges", opt.value)}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all hover:border-[#D4AF37] ${
                          selected ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-border"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            selected ? "border-[#D4AF37] bg-[#D4AF37]" : "border-gray-300"
                          }`}>
                            {selected && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </div>
                          <span className="font-medium text-foreground">{opt.label}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
                {errors.childrenAges && <p className="text-sm text-red-500">{errors.childrenAges}</p>}
                <Button
                  onClick={() => {
                    if (!answers.childrenAges?.length) {
                      setErrors((p) => ({ ...p, childrenAges: "Please select at least one age group" }))
                      return
                    }
                    nextStep()
                  }}
                  className="w-full h-12 bg-[#D4AF37] text-[#0A1128] hover:bg-[#c9a430] active:bg-[#b89228] font-semibold"
                >
                  Continue
                </Button>
              </div>

            ) : currentStep === 3 ? (
              /* ── STEP 3: Qualifying Questions (primary adult age + health) ── */
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-[#D4AF37] uppercase tracking-wide">Step 3 of {TOTAL_STEPS}</p>
                  <h2 className="text-3xl font-bold text-foreground">A Couple Quick Qualifying Questions</h2>
                  <p className="text-muted-foreground">Helps us route you to the right specialist</p>
                </div>

                <div className="space-y-6 max-w-md mx-auto w-full">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Primary adult&apos;s age</label>
                    <Input
                      type="number"
                      placeholder="Enter age"
                      value={answers.primaryAge || ""}
                      onChange={(e) => updateAnswer("primaryAge", e.target.value)}
                      className="h-14 text-lg text-center"
                      min={18}
                      max={100}
                    />
                    {answers.primaryAge && Number.parseInt(answers.primaryAge) >= 64 && (
                      <Card className="p-4 bg-blue-50 border-blue-200">
                        <p className="text-sm text-blue-700">
                          At 64+, you may qualify for Medicare options. Our private health coverage is designed for healthy adults under 65. A licensed agent can still help.
                        </p>
                      </Card>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">
                      In the last 5 years, has anyone on the plan been treated for cancer, diabetes, heart disease, or any other significant condition?
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {["No", "Yes"].map((opt) => (
                        <Card
                          key={opt}
                          className={`p-4 cursor-pointer border-2 text-center font-semibold transition-all ${
                            answers.healthScreen === opt
                              ? "border-[#D4AF37] bg-[#D4AF37]/10"
                              : "border-border hover:border-[#D4AF37]"
                          }`}
                          onClick={() => updateAnswer("healthScreen", opt)}
                        >
                          {opt}
                        </Card>
                      ))}
                    </div>
                    {answers.healthScreen === "Yes" && (
                      <Card className="p-4 bg-amber-50 border-amber-200">
                        <p className="text-sm text-amber-700">
                          Our private health coverage is designed for healthy households. With a significant medical history, a guaranteed-issue plan may be a better fit for your family. A licensed agent can still conduct a needs analysis with you.
                        </p>
                      </Card>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">
                      Is anyone on the plan currently enrolled in Medicaid or Medicare?
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {["No", "Yes"].map((opt) => (
                        <Card
                          key={opt}
                          className={`p-4 cursor-pointer border-2 text-center font-semibold transition-all ${
                            answers.govCoverage === opt
                              ? "border-[#D4AF37] bg-[#D4AF37]/10"
                              : "border-border hover:border-[#D4AF37]"
                          }`}
                          onClick={() => updateAnswer("govCoverage", opt)}
                        >
                          {opt}
                        </Card>
                      ))}
                    </div>
                    {answers.govCoverage === "Yes" && (
                      <Card className="p-4 bg-blue-50 border-blue-200">
                        <p className="text-sm text-blue-700">
                          Our private health coverage is designed for households not currently enrolled in Medicaid or Medicare. A licensed agent can still conduct a needs analysis with you on your call.
                        </p>
                      </Card>
                    )}
                  </div>

                  <Button
                    onClick={() => {
                      const age = Number.parseInt(answers.primaryAge)
                      if (age >= 18 && age <= 63 && answers.healthScreen && answers.govCoverage) nextStep()
                    }}
                    disabled={
                      !answers.primaryAge ||
                      Number.parseInt(answers.primaryAge) >= 64 ||
                      Number.parseInt(answers.primaryAge) < 18 ||
                      !answers.healthScreen ||
                      !answers.govCoverage
                    }
                    className="w-full h-12 bg-[#0A1128] text-white hover:bg-[#0A1128]/90"
                  >
                    Continue
                  </Button>
                </div>
              </div>

            ) : currentStep === 4 ? (
              /* ── STEP 4: Current Coverage ─────────────────────── */
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-[#D4AF37] uppercase tracking-wide">Step 4 of {TOTAL_STEPS}</p>
                  <h2 className="text-3xl font-bold text-foreground">What&apos;s your current situation?</h2>
                </div>
                <div className="space-y-3">
                  {coverageOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleAutoAdvance("currentCoverage", opt.value)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 ${
                        answers.currentCoverage === opt.value ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-border"
                      }`}
                    >
                      <span className="font-medium text-foreground">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

            ) : currentStep === 5 ? (
              /* ── STEP 5: Household Income ─────────────────────── */
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-[#D4AF37] uppercase tracking-wide">Step 5 of {TOTAL_STEPS}</p>
                  <h2 className="text-3xl font-bold text-foreground">What&apos;s your estimated household income?</h2>
                  <p className="text-muted-foreground">Helps us match you with the right plan tier</p>
                </div>
                <div className="space-y-3">
                  {incomeOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleAutoAdvance("income", opt)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 ${
                        answers.income === opt ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-border"
                      }`}
                    >
                      <span className="font-medium text-foreground">{opt}</span>
                    </button>
                  ))}
                </div>
              </div>

            ) : currentStep === 6 ? (
              /* ── STEP 6: State ──────────��─────────────────────── */
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-[#D4AF37] uppercase tracking-wide">Step 6 of {TOTAL_STEPS}</p>
                  <h2 className="text-3xl font-bold text-foreground">Which state do you live in?</h2>
                  <p className="text-muted-foreground">Plan availability varies by state</p>
                </div>
                <Input
                  type="text"
                  placeholder="Search states..."
                  value={stateSearch}
                  onChange={(e) => setStateSearch(e.target.value)}
                  className="h-12"
                />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto">
                  {filteredStates.map((state) => (
                    <button
                      key={state}
                      onClick={() => handleAutoAdvance("state", state)}
                      className={`p-3 rounded-lg border-2 text-sm transition-all hover:border-[#D4AF37] ${
                        answers.state === state ? "border-[#D4AF37] bg-[#D4AF37]/5 font-semibold" : "border-border"
                      }`}
                    >
                      {state}
                    </button>
                  ))}
                </div>
              </div>

            ) : currentStep === 7 ? (
              /* ── STEP 7: Contact Info ─────────────────────────── */
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-[#D4AF37] uppercase tracking-wide">Step 7 of {TOTAL_STEPS}</p>
                  <h2 className="text-3xl font-bold text-foreground">Where should we send your family&apos;s plan options?</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="tel"
                        placeholder="(555) 000-0000"
                        value={answers.phone || ""}
                        onChange={(e) => updateAnswer("phone", e.target.value)}
                        className={`h-12 pl-10 ${errors.phone ? "border-red-500" : ""}`}
                      />
                    </div>
                    {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        value={answers.email || ""}
                        onChange={(e) => updateAnswer("email", e.target.value)}
                        className={`h-12 pl-10 ${errors.email ? "border-red-500" : ""}`}
                      />
                    </div>
                    {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={answers.tcpaConsent || false}
                        onChange={(e) => updateAnswer("tcpaConsent", e.target.checked)}
                        className="mt-1 w-4 h-4 accent-[#D4AF37]"
                      />
                      <span className="text-xs text-muted-foreground leading-relaxed">
                        By checking this box and submitting this form, I provide my electronic signature through which I expressly consent to be contacted by Holy Impact Media and its licensed insurance partners, including licensed insurance agents affiliated with Dynasty Insurance Group and USHEALTH Advisors, LLC, at the telephone number I have provided and that such contact shall be made via telephone calls, text messages (including via automated telephone dialing systems or artificial / prerecorded voice message), and email regarding health coverage options. I understand this website is operated by Holy Impact Media, a marketing company, which will route my information to licensed insurance agents. Consent is not required to purchase any goods or services and may be revoked at any time. Reply STOP to opt out of SMS. I also consent under any applicable state telemarketing laws, including the Florida Telephone Solicitation Act. Message and data rates may apply. Message frequency varies. I further agree to the{" "}
                        <a href="/terms" className="text-[#D4AF37] hover:underline">Terms of Service</a>{" "}
                        and{" "}
                        <a href="/privacy" className="text-[#D4AF37] hover:underline">Privacy Policy</a>.
                      </span>
                    </label>
                    {errors.tcpaConsent && <p className="text-sm text-red-500">{errors.tcpaConsent}</p>}
                  </div>
                </div>

                <Button
                  onClick={handleContactSubmit}
                  className="w-full h-12 bg-[#D4AF37] text-[#0A1128] hover:bg-[#c9a430] active:bg-[#b89228] font-semibold"
                >
                  Continue
                </Button>

                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <Lock className="w-3 h-3" />
                  <span>Your information is encrypted and shared only with licensed insurance partners</span>
                </div>
              </div>

            ) : currentStep === 8 ? (
              /* ── STEP 8: Name + Submit ────────────────────────── */
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-[#D4AF37] uppercase tracking-wide">Last Step</p>
                  <h2 className="text-3xl font-bold text-foreground">Almost done. What&apos;s your name?</h2>
                  <p className="text-muted-foreground">Your specialist will greet you personally</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">First Name</label>
                    <Input
                      type="text"
                      placeholder="First name"
                      value={answers.firstName || ""}
                      onChange={(e) => updateAnswer("firstName", e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
                      className={`h-12 ${errors.firstName ? "border-red-500" : ""}`}
                    />
                    {errors.firstName && <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Last Name</label>
                    <Input
                      type="text"
                      placeholder="Last name"
                      value={answers.lastName || ""}
                      onChange={(e) => updateAnswer("lastName", e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
                      className={`h-12 ${errors.lastName ? "border-red-500" : ""}`}
                    />
                    {errors.lastName && <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>}
                  </div>
                </div>

                {submitError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {submitError}
                  </div>
                )}

                <Button
                  onClick={handleNameSubmit}
                  disabled={isSubmitting}
                  className="w-full h-14 text-lg bg-[#D4AF37] text-[#0A1128] hover:bg-[#c9a430] active:bg-[#b89228] font-bold"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Activity className="w-5 h-5 animate-spin" />
                      Finding your family&apos;s plans...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      See My Family&apos;s Plans
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By submitting, you agree to be contacted by licensed insurance agents about coverage options. Consent is not a condition of purchase.
                </p>
              </div>

            ) : null}

          </motion.div>
        </AnimatePresence>
      </div>

      {(currentStep === 0 || showThankYou) && <Footer />}
    </div>
  )
}
