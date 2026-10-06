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
  DollarSign,
  ArrowRight,
  Briefcase,
  TrendingUp,
  Users,
  AlertCircle,
  Award,
  XCircle,
  Lock,
  Stethoscope,
  Smile,
  Zap,
  Globe,
  Activity,
  X,
} from "lucide-react"

import { SERVICED_STATES } from "@/lib/serviced-states"
import { INDIVIDUAL_INCOME_BRACKETS } from "@/lib/income-thresholds"
const SE_COVERAGE_ITEMS = [
  { icon: <Stethoscope className="w-5 h-5" />, label: "Doctor Visits", desc: "Primary care and specialist visits, no employer required" },
  { icon: <Globe className="w-5 h-5" />, label: "Coverage That Travels", desc: "Coverage can follow you across state lines" },
  { icon: <Activity className="w-5 h-5" />, label: "Emergency Care", desc: "ER and urgent care may be covered when you need it" },
  { icon: <Smile className="w-5 h-5" />, label: "Dental & Vision", desc: "Add-on coverage available with some plans" },
  { icon: <Zap className="w-5 h-5" />, label: "Telemedicine", desc: "Virtual visits, not available with every plan or in every state" },
]

const SE_PROBLEMS = [
  "No employer contribution. You pay 100% of premiums alone.",
  "Narrow networks that limit your doctor choices",
  "Referral requirements that slow down your care",
  "Regional plans that do not work when you travel for business",
  "Generic plans not designed for entrepreneurs and contractors",
  "Lack of flexibility to match your actual healthcare needs",
]

const SE_ADVANTAGES = [
  "Private health coverage that can access a PPO network for mobile entrepreneurs",
  "See a wide range of doctors and specialists through a PPO network",
  "Flexible enrollment options for business owners and contractors",
  "Coverage tailored to working entrepreneurs who want access to a PPO network",
]

const US_STATES = SERVICED_STATES

const TOTAL_STEPS = 7

export default function SelfEmployedPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [stateSearch, setStateSearch] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showExitIntent, setShowExitIntent] = useState(false)
  const [showThankYou, setShowThankYou] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem("selfEmployedQuizData")
      if (saved) {
        const data = JSON.parse(saved)
        setAnswers(data.answers || {})
        setCurrentStep(data.step || 0)
      }
    } catch (e) {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem("selfEmployedQuizData", JSON.stringify({ answers, step: currentStep }))
    } catch (e) {}
  }, [answers, currentStep])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const script = document.createElement("script")
      script.type = "text/javascript"
      script.text = `tf_form_id = 'self-employed-coverage-finder';`
      document.head.appendChild(script)
    }
  }, [])

  // Exit intent - desktop, one-shot per session, post-landing only.
  useEffect(() => {
    if (showThankYou) return
    if (currentStep <= 0 || currentStep > TOTAL_STEPS) return
    if (typeof window === "undefined") return

    const SESSION_KEY = "exitIntentShown_selfEmployed"
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
          age: answers.age,
          state: answers.state,
          tcpaConsent: answers.tcpaConsent,
          trustedFormCertUrl,
          funnelType: "self_employed",
          quizAnswers: {
            workSituation: answers.workSituation,
            annualIncome: answers.annualIncome,
            incomeConsistency: answers.incomeConsistency,
            topPriority: answers.topPriority,
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
      localStorage.removeItem("selfEmployedQuizData")
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to submit. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const progress = currentStep >= 1 && currentStep <= TOTAL_STEPS ? (currentStep / TOTAL_STEPS) * 100 : 0
  const filteredStates = US_STATES.filter((s) => s.toLowerCase().includes(stateSearch.toLowerCase()))

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

      <ExitIntentDialog
        open={showExitIntent}
        onClose={() => setShowExitIntent(false)}
        onContinue={() => setShowExitIntent(false)}
        progress={progress}
        headline="A licensed agent can walk you through your coverage options before you go."
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

            {/* ── THANK YOU ─────────────────────────────────────────── */}
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
                  <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                    You&apos;re in great hands, {answers.firstName}.
                  </h1>
                  <p className="text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
                    A self-employed coverage specialist will contact you within 5 minutes.
                  </p>
                </div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <Card className="p-8 border border-border">
                    <h2 className="text-2xl font-bold text-foreground mb-6 text-center">What Happens Next?</h2>
                    <div className="space-y-6">
                      {[
                        {
                          icon: <CheckCircle2 className="w-6 h-6 text-green-600" />,
                          bg: "bg-green-100",
                          title: "Right Now",
                          badge: { text: "Complete", cls: "bg-green-100 text-green-700" },
                          desc: "Your information has been securely submitted. We're matching you with self-employed plan specialists in your state.",
                        },
                        {
                          icon: <Clock className="w-6 h-6 text-[#D4AF37]" />,
                          bg: "bg-[#D4AF37]/10 border-2 border-[#D4AF37]",
                          title: "Within 5 Minutes",
                          badge: { text: "In Progress", cls: "bg-blue-100 text-blue-700" },
                          desc: "A self-employed coverage specialist will call or email you with plan options tailored to your income and priorities.",
                          extra: (
                            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg mt-2">
                              <Mail className="w-4 h-4 text-[#D4AF37] mt-0.5 flex-shrink-0" />
                              <span>
                                Check your inbox, reference number:{" "}
                                <span className="font-mono font-semibold">{referenceNumber || "SE-PENDING"}</span>
                              </span>
                            </div>
                          ),
                        },
                        {
                          icon: <Phone className="w-6 h-6 text-gray-400" />,
                          bg: "bg-gray-100",
                          title: "Next Steps",
                          badge: { text: "Upcoming", cls: "bg-gray-100 text-gray-600" },
                          desc: "Your specialist will walk you through private health coverage options and conduct a needs analysis with you.",
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
                            {"extra" in item && item.extra}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              </div>

            ) : currentStep === 0 ? (
              /* ── LANDING PAGE ─────────────────────────────────────── */
              <div className="w-full max-w-none">

                {/* Hero */}
                <section className="relative text-white py-16 px-6 overflow-hidden">
                  <img src="/images/heroes/self-employed.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" aria-hidden="true" />
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0A1128]/95 via-[#0A1128]/85 to-[#0A1128]/95" aria-hidden="true" />
                  <div className="relative max-w-3xl mx-auto text-center space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/20 rounded-full text-[#D4AF37] text-sm font-semibold">
                      <Briefcase className="w-4 h-4" />
                      Self-Employed &amp; Freelance Health Coverage
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold leading-tight text-balance">
                      1099 Income. No Employer Plan. Bad Options. <span className="text-[#D4AF37]">See Your Options.</span>
                    </h1>
                    <p className="text-lg text-gray-300 max-w-xl mx-auto">
                      Private health coverage built for <span className="text-[#D4AF37] font-semibold">healthy</span> self-employed Americans <span className="text-[#D4AF37] font-semibold">under 65</span>, with access to a <span className="text-[#D4AF37] font-semibold">PPO network</span>.
                    </p>
                    <div className="space-y-3 text-left max-w-xl mx-auto">
                      {[
                        "You shop solo. Premiums keep climbing while networks keep shrinking.",
                        "You cross state lines for clients. Your plan stops at the border.",
                        "You want coverage that keeps up with your business. Generic plans do not.",
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
                      Find My Plan - Free
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                    <p className="text-gray-400 text-xs">Takes 90 seconds. No obligation. Licensed agents only.</p>
                  </div>
                </section>

                {/* Stats Bar */}
                <section className="bg-[#D4AF37] py-5 px-6">
                  <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { icon: <Globe className="w-4 h-4 flex-shrink-0" />, text: "Access to a PPO Network" },
                      { icon: <Briefcase className="w-4 h-4 flex-shrink-0" />, text: "Coverage for 1099 Workers" },
                      { icon: <Shield className="w-4 h-4 flex-shrink-0" />, text: "Licensed Agent Guidance" },
                      { icon: <Stethoscope className="w-4 h-4 flex-shrink-0" />, text: "Broad Doctor Access" },
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
                        You Run Your Own Business. Your Health Plan Should Match.
                      </h2>
                      <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Generic narrow-network plans are built for people who sit in one office and see one doctor.
                        You do not. Private health coverage with access to a PPO network can give you broader doctor
                        choice and coverage that travels with your business.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="p-6 border-2 border-red-200 bg-red-50/50">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                              <XCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                              <p className="text-xs text-red-500 font-semibold uppercase tracking-wide">The Problem</p>
                              <h3 className="font-bold text-foreground">Figuring It Out Alone</h3>
                            </div>
                          </div>
                          <ul className="space-y-3">
                            {SE_PROBLEMS.map((item, i) => (
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
                              <h3 className="font-bold text-foreground">Private Coverage With Expert Guidance</h3>
                            </div>
                          </div>
                          <ul className="space-y-3">
                            {SE_ADVANTAGES.map((item, i) => (
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

                {/* Coverage Grid */}
                <section className="py-16 px-6 bg-muted/30">
                  <div className="max-w-4xl mx-auto space-y-10">
                    <div className="text-center space-y-3">
                      <h2 className="text-3xl font-bold text-foreground">Real Coverage Built for Independent Workers</h2>
                      <p className="text-muted-foreground text-lg">
                        No employer needed. Coverage built around your work.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                      {SE_COVERAGE_ITEMS.map((item, i) => (
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
                      <h2 className="text-3xl font-bold text-foreground">Three Steps to Coverage That Fits Your Business</h2>
                      <p className="text-muted-foreground text-lg">Simple. Fast. Built around you.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {[
                        {
                          step: "1",
                          title: "Tell Us Your Setup",
                          desc: "Freelancer, contractor, or founder. 90 seconds. We ask the right questions.",
                        },
                        {
                          step: "2",
                          title: "See Your Options",
                          desc: "A licensed agent walks you through private health coverage options and conducts a needs analysis.",
                        },
                        {
                          step: "3",
                          title: "Enroll and Get Back to Work",
                          desc: "Pick your plan. Enroll fast. Then get back to business.",
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
                        You Built Something. Protect It.
                      </h2>
                      <p className="text-gray-300 leading-relaxed">
                        Dynasty Insurance Group helps self-employed professionals find private health coverage
                        that moves with them, with access to a PPO network.
                        We do the comparison work. You get the coverage.
                      </p>
                      <p className="text-gray-300 leading-relaxed">
                        No cost to you. No pressure. Just answers.
                      </p>
                    </div>
                    <div className="space-y-4">
                      {[
                        { icon: <Shield className="w-5 h-5" />, title: "Licensed in Your State", desc: "Every agent we work with is licensed in your state." },
                        { icon: <DollarSign className="w-5 h-5" />, title: "100% Free to You", desc: "Our service costs you nothing. We are paid per lead by our licensed insurance partners." },
                        { icon: <Clock className="w-5 h-5" />, title: "5-Minute Response", desc: "A real specialist contacts you within 5 minutes on business days." },
                        { icon: <Lock className="w-5 h-5" />, title: "Your Data Is Handled Carefully", desc: "Your details go to our licensed insurance partners so they can contact you about coverage options." },
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
                    <h2 className="text-3xl font-bold text-foreground">You Work Hard. Your Coverage Should Work for You.</h2>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                      90 seconds to find your plan. Free, no obligation. Licensed agents who get 1099 life.
                    </p>
                    <Button
                      onClick={nextStep}
                      size="lg"
                      className="bg-[#D4AF37] text-[#0A1128] hover:bg-[#c9a430] active:bg-[#b89228] font-bold h-14 px-10 text-base w-full sm:w-auto"
                    >
                      Find My Plan - Free
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

            ) : currentStep === 1 ? (
              /* ── STEP 1: Work Situation ───────────────────────────── */
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Step 1 of {TOTAL_STEPS}</p>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
                    How would you describe your work situation?
                  </h2>
                </div>
                <div className="grid gap-3">
                  {[
                    { label: "Full-time freelancer", sub: "Creative, writing, design, consulting, etc." },
                    { label: "1099 contractor/consultant", sub: "Contract work, professional services" },
                    { label: "Gig worker (Uber, DoorDash, etc.)", sub: "Platform-based work" },
                    { label: "Starting a business", sub: "New venture, sole proprietor, LLC" },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => handleAutoAdvance("workSituation", opt.label)}
                      className={`w-full p-5 rounded-xl border-2 text-left transition-all duration-150 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 active:scale-[0.99] active:bg-[#D4AF37]/10 ${
                        answers.workSituation === opt.label
                          ? "border-[#D4AF37] bg-[#D4AF37]/10"
                          : "border-border bg-card"
                      }`}
                    >
                      <div className="font-semibold text-foreground">{opt.label}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">{opt.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

            ) : currentStep === 2 ? (
              /* ── STEP 2: Annual Income ────────────────────────────── */
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Step 2 of {TOTAL_STEPS}</p>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
                    What&apos;s your estimated annual income?
                  </h2>
                  <p className="text-muted-foreground text-sm">Helps us match you with the right plan tier</p>
                </div>
                <div className="grid gap-3">
                  {INDIVIDUAL_INCOME_BRACKETS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleAutoAdvance("annualIncome", opt)}
                      className={`w-full p-5 rounded-xl border-2 text-left transition-all duration-150 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 active:scale-[0.99] active:bg-[#D4AF37]/10 ${
                        answers.annualIncome === opt
                          ? "border-[#D4AF37] bg-[#D4AF37]/10"
                          : "border-border bg-card"
                      }`}
                    >
                      <span className="font-semibold text-foreground text-lg">{opt}</span>
                    </button>
                  ))}
                </div>
              </div>

            ) : currentStep === 3 ? (
              /* ── STEP 3: Income Consistency ──────────────────────── */
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Step 3 of {TOTAL_STEPS}</p>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
                    How consistent is your income?
                  </h2>
                  <p className="text-muted-foreground text-sm">This helps match you with plans flexible for income changes</p>
                </div>
                <div className="grid gap-3">
                  {[
                    { label: "Very consistent", sub: "Same clients, steady monthly revenue" },
                    { label: "Somewhat variable", sub: "Fluctuates month to month but predictable yearly" },
                    { label: "Very unpredictable/seasonal", sub: "Big swings, project-based, or seasonal work" },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => handleAutoAdvance("incomeConsistency", opt.label)}
                      className={`w-full p-5 rounded-xl border-2 text-left transition-all duration-150 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 active:scale-[0.99] active:bg-[#D4AF37]/10 ${
                        answers.incomeConsistency === opt.label
                          ? "border-[#D4AF37] bg-[#D4AF37]/10"
                          : "border-border bg-card"
                      }`}
                    >
                      <div className="font-semibold text-foreground">{opt.label}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">{opt.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

            ) : currentStep === 4 ? (
              /* ── STEP 4: Top Priority ─────────────────────────────── */
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Step 4 of {TOTAL_STEPS}</p>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
                    What&apos;s most important to you in a plan?
                  </h2>
                </div>
                <div className="grid gap-3">
                  {[
                    { label: "Lowest monthly premium", sub: "Keep cash flow high month-to-month", icon: <DollarSign className="w-5 h-5 text-green-600" /> },
                    { label: "Low deductible", sub: "Pay less when you actually use it", icon: <Shield className="w-5 h-5 text-blue-500" /> },
                    { label: "Maximum flexibility", sub: "Access to a broad PPO network", icon: <TrendingUp className="w-5 h-5 text-purple-500" /> },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => handleAutoAdvance("topPriority", opt.label)}
                      className={`w-full p-5 rounded-xl border-2 text-left transition-all duration-150 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 active:scale-[0.99] active:bg-[#D4AF37]/10 ${
                        answers.topPriority === opt.label
                          ? "border-[#D4AF37] bg-[#D4AF37]/10"
                          : "border-border bg-card"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {opt.icon}
                        <div>
                          <div className="font-semibold text-foreground">{opt.label}</div>
                          <div className="text-sm text-muted-foreground">{opt.sub}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

            ) : currentStep === 5 ? (
              /* ── STEP 5: State ────────────────────────────────────── */
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Step 5 of {TOTAL_STEPS}</p>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
                    Which state do you live in?
                  </h2>
                  <p className="text-muted-foreground text-sm">Plan availability and pricing vary by state</p>
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
                          className={`p-3 rounded-xl border-2 text-left text-sm font-medium transition-all duration-150 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 active:scale-[0.98] active:bg-[#D4AF37]/10 ${
                        answers.state === state
                          ? "border-[#D4AF37] bg-[#D4AF37]/10 text-foreground"
                          : "border-border bg-card text-foreground"
                      }`}
                    >
                      {state}
                    </button>
                  ))}
                </div>
              </div>

            ) : currentStep === 6 ? (
              /* ── STEP 6: Contact Info ─────────────────────────────── */
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Step 6 of {TOTAL_STEPS}</p>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
                    Where should we send your plan options?
                  </h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">
                      Age <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      placeholder="Age"
                      value={answers.age || ""}
                      onChange={(e) => updateAnswer("age", e.target.value)}
                      min={18}
                      max={100}
                      className={`h-12 ${errors.age ? "border-red-500" : ""}`}
                    />
                    {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">
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
                      <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded p-2 mt-2">
                        Our private health coverage is designed for self-employed adults not currently enrolled in Medicaid or Medicare. A licensed specialist can still walk you through your options.
                      </p>
                    )}
                    {errors.govCoverage && <p className="text-red-500 text-xs mt-1">{errors.govCoverage}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={answers.email || ""}
                      onChange={(e) => updateAnswer("email", e.target.value)}
                      className={`h-12 ${errors.email ? "border-red-500" : ""}`}
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="tel"
                      placeholder="(555) 000-0000"
                      value={answers.phone || ""}
                      onChange={(e) => updateAnswer("phone", e.target.value)}
                      className={`h-12 ${errors.phone ? "border-red-500" : ""}`}
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl border border-border">
                    <input
                      type="checkbox"
                      id="tcpa-se"
                      checked={answers.tcpaConsent || false}
                      onChange={(e) => updateAnswer("tcpaConsent", e.target.checked)}
                      className="mt-0.5 w-4 h-4 flex-shrink-0 cursor-pointer accent-[#D4AF37]"
                    />
                    <label htmlFor="tcpa-se" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                      By checking this box and submitting this form, I provide my electronic signature through which I expressly consent to be contacted by Holy Impact Media and its licensed insurance partners, including licensed insurance agents affiliated with Dynasty Insurance Group and USHEALTH Advisors, LLC, at the telephone number I have provided and that such contact shall be made via telephone calls, text messages (including via automated telephone dialing systems or artificial / prerecorded voice message), and email regarding health coverage options. I understand this website is operated by Holy Impact Media, a marketing company, which will route my information to licensed insurance agents. Consent is not required to purchase any goods or services and may be revoked at any time. Reply STOP to opt out of SMS. I also consent under any applicable state telemarketing laws, including the Florida Telephone Solicitation Act. Message and data rates may apply. Message frequency varies. I further agree to the{" "}
                      <a href="/terms" className="underline hover:text-foreground">Terms of Service</a> and{" "}
                      <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a>.
                    </label>
                  </div>
                  {errors.tcpaConsent && <p className="text-red-500 text-xs">{errors.tcpaConsent}</p>}
                  <Button
                    onClick={handleContactSubmit}
                    className="w-full h-12 bg-[#D4AF37] text-[#0A1128] hover:bg-[#c9a430] active:bg-[#b89228] font-bold text-base"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>

            ) : currentStep === 7 ? (
              /* ── STEP 7: Name + Submit ────────────────────────────── */
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Step 7 of {TOTAL_STEPS}</p>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
                    Last step: what&apos;s your name?
                  </h2>
                  <p className="text-muted-foreground">So your specialist can greet you personally.</p>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">First Name</label>
                      <Input
                        type="text"
                        placeholder="First"
                        value={answers.firstName || ""}
                        onChange={(e) => updateAnswer("firstName", e.target.value)}
                        className={`h-12 ${errors.firstName ? "border-red-500" : ""}`}
                        onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
                      />
                      {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">Last Name</label>
                      <Input
                        type="text"
                        placeholder="Last"
                        value={answers.lastName || ""}
                        onChange={(e) => updateAnswer("lastName", e.target.value)}
                        className={`h-12 ${errors.lastName ? "border-red-500" : ""}`}
                        onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
                      />
                      {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                    </div>
                  </div>
                  {submitError && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {submitError}
                    </div>
                  )}
                  <Button
                    onClick={handleNameSubmit}
                    disabled={isSubmitting}
                    className="w-full h-14 bg-[#D4AF37] text-[#0A1128] hover:bg-[#c9a430] active:bg-[#b89228] font-bold text-lg shadow-lg"
                  >
                    {isSubmitting ? "Submitting..." : "See My Plan Options →"}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Your information is encrypted and shared only with our licensed insurance partners.
                  </p>
                </div>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      {(currentStep === 0 || showThankYou) && <Footer />}
    </div>
  )
}
