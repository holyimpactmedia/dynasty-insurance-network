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
  Lock,
  Users,
  Heart,
  DollarSign,
  Baby,
  Home,
  Star,
  ArrowRight,
  Award,
  Activity,
  XCircle,
  AlertCircle,
  Stethoscope,
  Eye,
  Smile,
  Zap,
  Globe,
  FileText,
  X,
} from "lucide-react"

const FAMILY_COVERAGE_ITEMS = [
  { icon: <Baby className="w-5 h-5" />, label: "Pediatric Care", desc: "Routine checkups, vaccines, and specialist visits for kids" },
  { icon: <Heart className="w-5 h-5" />, label: "Mental Health", desc: "Therapy and counseling for all family members" },
  { icon: <Stethoscope className="w-5 h-5" />, label: "Specialist Access", desc: "Referrals to any specialist in the network" },
  { icon: <Globe className="w-5 h-5" />, label: "Nationwide Network", desc: "Coverage wherever your family travels" },
  { icon: <Activity className="w-5 h-5" />, label: "Emergency Care", desc: "ER visits covered at any hospital" },
  { icon: <Smile className="w-5 h-5" />, label: "Dental & Vision", desc: "Add-on plans available for the whole family" },
  { icon: <Eye className="w-5 h-5" />, label: "Preventive Care", desc: "Annual physicals and well-child visits fully covered" },
  { icon: <Zap className="w-5 h-5" />, label: "Telemedicine", desc: "Virtual visits 24/7, no waiting room" },
]

const FAMILY_PROBLEMS = [
  "Employer family coverage can cost $1,500-$2,500/month with limited networks",
  "Narrow HMO networks mean your pediatrician may not be covered",
  "High deductibles leave families exposed to unexpected bills",
  "Kids aging off your plan at 26 with no quality private options",
  "Regional coverage limits leave your family unprotected when traveling",
  "Most plans lack comprehensive dental and vision for the whole family",
]

const FAMILY_ADVANTAGES = [
  "Private PPO plans with nationwide coverage for your entire family",
  "Pediatric specialists accessible without referrals or waiting",
  "Keep your family's doctors, including pediatricians and OB-GYNs",
  "Coverage that travels with you across all 50 states",
  "Comprehensive dental and vision add-ons available",
  "Flexible enrollment options for growing families",
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
    { value: "Concierge access to specialists with no referrals", icon: <Stethoscope className="w-6 h-6" />, label: "Concierge access to specialists with no referrals" },
    { value: "Low deductibles and predictable family budget", icon: <Shield className="w-6 h-6" />, label: "Low deductibles and predictable family budget" },
    { value: "Mental health, therapy, and wellness coverage", icon: <Heart className="w-6 h-6" />, label: "Mental health, therapy, and wellness coverage" },
  ]

  const coverageOptions = [
    { value: "No coverage right now", label: "No coverage right now" },
    { value: "Employer plan is too restrictive", label: "Employer plan is too restrictive" },
    { value: "Currently on an HMO and want a private PPO", label: "Currently on an HMO and want a private PPO" },
    { value: "Child aging off my plan soon", label: "Child aging off my plan soon" },
  ]

  const incomeOptions = [
    "Under $30,000",
    "$30,000 - $50,000",
    "$50,000 - $75,000",
    "$75,000 - $125,000",
    "$125,000+",
  ]

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
                <Heart className="w-8 h-8 text-[#D4AF37]" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Your Family Deserves Better Coverage</h3>
              <p className="text-muted-foreground">
                Enter your email and we&apos;ll send you our private guide to family PPO plans with nationwide coverage.
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
                    A family specialist will contact you within 5 minutes.
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
                        <p className="text-xl font-bold">Nationwide</p>
                        <p className="text-xs text-gray-400 mt-1">All 50 states</p>
                      </div>
                      <div className="bg-[#D4AF37]/20 rounded-xl p-4 border border-[#D4AF37]/40">
                        <p className="text-xs text-[#D4AF37] mb-1">Referrals</p>
                        <p className="text-xl font-bold text-[#D4AF37]">None</p>
                        <p className="text-xs text-[#D4AF37]/70 mt-1">See any specialist</p>
                      </div>
                      <div className="bg-white/10 rounded-xl p-4">
                        <p className="text-xs text-gray-300 mb-1">Pediatric</p>
                        <p className="text-xl font-bold">Included</p>
                        <p className="text-xs text-gray-400 mt-1">From day one</p>
                      </div>
                    </div>
                    <p className="text-center text-sm text-gray-300">
                      Your specialist will present private PPO family plans tailored to your household.
                    </p>
                    <p className="text-center text-xs text-gray-500 mt-2">
                      Rates depend on age, location, and plan selection. Your specialist shows you exact pricing.
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
                          desc: "A licensed family health specialist will review your situation and prepare personalized plan comparisons including pediatric benefits.",
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
                          desc: "Your specialist will walk you through family plan options, comparing monthly premiums, deductibles, and pediatric networks side by side.",
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
                      Family Health Insurance - Free Consultation
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold leading-tight text-balance">
                      A Family Plan for Earners the <span className="text-[#D4AF37]">Marketplace Forgets</span>
                    </h1>
                    <p className="text-lg text-gray-300 max-w-xl mx-auto">
                      Built for working families who earn just past the <span className="text-[#D4AF37] font-semibold">subsidy cliff</span> and still need real coverage.
                    </p>
                    <div className="space-y-3 text-left max-w-xl mx-auto">
                      {[
                        "Your household income is too high for an ACA subsidy but the marketplace is still unaffordable.",
                        "Your pediatrician is not in your network and your HMO requires a referral for everything.",
                        "Your employer plan barely covers the family and the deductible swallows your savings.",
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
                      { icon: <Globe className="w-4 h-4 flex-shrink-0" />, text: "Nationwide PPO networks" },
                      { icon: <Stethoscope className="w-4 h-4 flex-shrink-0" />, text: "Keep your pediatrician" },
                      { icon: <Shield className="w-4 h-4 flex-shrink-0" />, text: "No referrals for specialists" },
                      { icon: <DollarSign className="w-4 h-4 flex-shrink-0" />, text: "Free family plan consultation" },
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
                        Your Family Deserves Better Than HMO Restrictions
                      </h2>
                      <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Most family plans lock you into narrow networks with mandatory referrals for every specialist.
                        Private PPO coverage gives your family the freedom to see any doctor, anywhere, without asking permission.
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
                              <h3 className="font-bold text-foreground">Private PPO Family Plans</h3>
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
                      <h2 className="text-3xl font-bold text-foreground">Everything Your Family Needs. All in One Plan.</h2>
                      <p className="text-muted-foreground text-lg">
                        Private PPO family plans include every benefit. No asterisks.
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
                          desc: "A specialist shows you private PPO family plans with real pricing. Side by side.",
                        },
                        {
                          step: "3",
                          title: "Enroll and Relax",
                          desc: "Pick your plan. Enroll in minutes. The whole family is covered starting the 1st.",
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
                        Your Family Should Never Have to Fight for Good Care
                      </h2>
                      <p className="text-gray-300 leading-relaxed">
                        Dynasty Insurance Group finds private PPO family plans that let your kids see their
                        pediatrician without a referral. Plans where you can travel anywhere and still
                        be covered. Plans that say yes.
                      </p>
                      <p className="text-gray-300 leading-relaxed">
                        One call. No pressure. We handle the comparison work for you.
                      </p>
                    </div>
                    <div className="space-y-4">
                      {[
                        { icon: <Shield className="w-5 h-5" />, title: "Licensed in Your State", desc: "Every agent we work with is state-licensed and compliant." },
                        { icon: <DollarSign className="w-5 h-5" />, title: "100% Free to You", desc: "Our service costs you nothing. Carriers compensate us." },
                        { icon: <Clock className="w-5 h-5" />, title: "5-Minute Response", desc: "A real specialist contacts you within 5 minutes on business days." },
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
                          Age 64+ qualifies for Medicare options. We focus on private PPO plans for ages 18–63. A licensed Medicare specialist can still help.
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
                          Our private PPO family plans are designed for healthy households. With a significant medical history, an ACA marketplace plan with guaranteed-issue protections is usually the better fit. A licensed specialist can still walk you through your options.
                        </p>
                      </Card>
                    )}
                  </div>

                  <Button
                    onClick={() => {
                      const age = Number.parseInt(answers.primaryAge)
                      if (age >= 18 && age <= 63 && answers.healthScreen) nextStep()
                    }}
                    disabled={
                      !answers.primaryAge ||
                      Number.parseInt(answers.primaryAge) >= 64 ||
                      Number.parseInt(answers.primaryAge) < 18 ||
                      !answers.healthScreen
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
                        By checking this box and submitting this form, I provide my express written consent to be
                        contacted by Dynasty Insurance Group via phone calls, text messages (including via autodialer or
                        prerecorded message), and email regarding health insurance options. Consent is not required to
                        purchase any product or service. Message and data rates may apply. Reply STOP to opt out. I
                        have read and agree to the{" "}
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
                  <span>Your information is encrypted and never sold</span>
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
                  By submitting, you confirm your agreement to be contacted. No purchase necessary.
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
