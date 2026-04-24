"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
  DollarSign,
  ArrowRight,
  Users,
  Building2,
  TrendingDown,
  AlertCircle,
  Award,
  Briefcase,
  Star,
  XCircle,
  Lock,
  Stethoscope,
  Eye,
  Smile,
  Zap,
  Globe,
  Heart,
  Activity,
  FileText,
  X,
} from "lucide-react"

const BIZ_COVERAGE_ITEMS = [
  { icon: <Stethoscope className="w-5 h-5" />, label: "Doctor Visits", desc: "Primary care and specialist access for all employees" },
  { icon: <Globe className="w-5 h-5" />, label: "Nationwide Network", desc: "Cover employees in multiple states or locations" },
  { icon: <Activity className="w-5 h-5" />, label: "Emergency Care", desc: "ER and urgent care covered wherever employees are" },
  { icon: <FileText className="w-5 h-5" />, label: "Prescriptions", desc: "Comprehensive drug formularies for your whole team" },
  { icon: <Smile className="w-5 h-5" />, label: "Dental & Vision", desc: "Add-on group plans available for the whole team" },
  { icon: <Heart className="w-5 h-5" />, label: "Mental Health", desc: "EAP and therapy coverage included in most group plans" },
  { icon: <Eye className="w-5 h-5" />, label: "Preventive Care", desc: "Annual physicals and screenings fully covered" },
  { icon: <Zap className="w-5 h-5" />, label: "Telemedicine", desc: "Virtual visits keep employees healthy without missing work" },
]

const BIZ_PROBLEMS = [
  "Top talent will not consider you without executive-tier benefits",
  "Generic group plans damage your employer brand at the offer stage",
  "Your competitors offer concierge medicine and you do not",
  "Renewals jump 15–25% with no broker actively negotiating for you",
  "Benefits are stitched together piecemeal without a unified strategy",
  "No dedicated specialist means C-suite and key hires get treated like everyone else",
]

const BIZ_ADVANTAGES = [
  "Executive-tier PPO and concierge medicine plans built for high-growth teams",
  "Carrier-direct relationships with Blue Cross, Cigna, Aetna, and United Healthcare",
  "Tiered benefit structures: founder/C-suite, key employees, and full team",
  "Employer-paid premiums remain fully tax deductible as a business expense",
  "Retain top talent: premium benefits are the #1 retention lever after equity",
  "One dedicated benefits strategist manages renewal, compliance, and design",
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

export default function BusinessPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [stateSearch, setStateSearch] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showExitIntent, setShowExitIntent] = useState(false)
  const [showThankYou, setShowThankYou] = useState(false)
  const [showRedirect, setShowRedirect] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem("businessQuizData")
      if (saved) {
        const data = JSON.parse(saved)
        setAnswers(data.answers || {})
        setCurrentStep(data.step || 0)
      }
    } catch (e) {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem("businessQuizData", JSON.stringify({ answers, step: currentStep }))
    } catch (e) {}
  }, [answers, currentStep])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const script = document.createElement("script")
      script.type = "text/javascript"
      script.text = `tf_form_id = 'small-business-group-plans';`
      document.head.appendChild(script)
    }
  }, [])

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

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const validatePhone = (phone: string) => phone.replace(/\D/g, "").length === 10
  const validateName = (name: string) => name.trim().length >= 2

  const handleBusinessSizeSelect = (value: string) => {
    updateAnswer("businessSize", value)
    if (value === "Just me (sole proprietor)") {
      setShowRedirect(true)
      setTimeout(() => router.push("/self-employed"), 3000)
    } else {
      setTimeout(() => nextStep(), 400)
    }
  }

  const handleContactSubmit = async () => {
    const newErrors: Record<string, string> = {}
    if (!answers.businessName || answers.businessName.trim().length < 2) {
      newErrors.businessName = "Please enter your business name"
    }
    if (!answers.firstName || !validateName(answers.firstName)) {
      newErrors.firstName = "Please enter your first name"
    }
    if (!answers.lastName || !validateName(answers.lastName)) {
      newErrors.lastName = "Please enter your last name"
    }
    if (!answers.email || !validateEmail(answers.email)) {
      newErrors.email = "Please enter a valid email address"
    }
    if (!answers.phone || !validatePhone(answers.phone)) {
      newErrors.phone = "Please enter a valid 10-digit phone number"
    }
    if (!answers.tcpaConsent) {
      newErrors.tcpaConsent = "You must agree to be contacted to proceed"
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
          funnelType: "small_business",
          quizAnswers: {
            businessName: answers.businessName,
            businessSize: answers.businessSize,
            currentSituation: answers.currentSituation,
            employerContribution: answers.employerContribution,
            employeeAgeRange: answers.employeeAgeRange,
            industry: answers.industry,
            timeline: answers.timeline,
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
      localStorage.removeItem("businessQuizData")
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
      {!showThankYou && currentStep >= 1 && currentStep <= TOTAL_STEPS && !showRedirect && (
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
                <Building2 className="w-8 h-8 text-[#D4AF37]" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Before You Go</h3>
              <p className="text-muted-foreground">
                Premium group plans give you a recruiting and retention edge. Enter your email for our executive
                benefits playbook.
              </p>
              <Input
                type="email"
                placeholder="your@business.com"
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
                  className="flex-1 bg-[#D4AF37] text-[#0A1128] hover:bg-[#c9a430] active:bg-[#b89228]"
                >
                  Send Guide
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Step content */}
      <div className={currentStep === 0 && !showThankYou && !showRedirect ? "flex-1" : "flex-1 flex items-start justify-center px-4 py-6 sm:px-6 sm:items-center"}>
        <AnimatePresence mode="wait">
          <motion.div
            key={showThankYou ? "thank-you" : showRedirect ? "redirect" : currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className={currentStep === 0 && !showThankYou && !showRedirect ? "w-full" : "w-full max-w-2xl"}
          >

            {/* ── REDIRECT MESSAGE ──────────────────────────────────── */}
            {showRedirect ? (
              <div className="text-center space-y-6 py-12">
                <div className="w-20 h-20 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto">
                  <ArrowRight className="w-10 h-10 text-[#D4AF37]" />
                </div>
                <h2 className="text-3xl font-bold text-foreground">
                  Looks like individual coverage is the right fit for you.
                </h2>
                <p className="text-muted-foreground text-lg">
                  Redirecting you to our self-employed coverage finder in a moment...
                </p>
                <Button onClick={() => router.push("/self-employed")} className="bg-[#D4AF37] text-[#0A1128] hover:bg-[#c9a430] active:bg-[#b89228] font-bold">
                  Go Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

            ) : showThankYou ? (
              /* ── THANK YOU ─────────────────────────────────────────── */
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
                    Your group plan options are being prepared, {answers.firstName}.
                  </h1>
                  <p className="text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
                    A small business specialist will contact you within 10 minutes.
                  </p>
                </div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <Card className="p-8 border-2 border-[#D4AF37] bg-gradient-to-br from-[#0A1128] to-[#1a2744] text-white">
                    <div className="text-center mb-6">
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/20 rounded-full text-[#D4AF37] text-sm font-semibold">
                        <Award className="w-4 h-4" />
                        Executive Benefits Advantages
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      {[
                        { label: "Talent Retention", value: "3x", sub: "longer tenure" },
                        { label: "Carrier Networks", value: "Top 4", sub: "nationwide PPOs" },
                        { label: "Premium Deduction", value: "100%", sub: "business expense" },
                      ].map((item, i) => (
                        <div key={i} className="bg-white/10 rounded-xl p-4">
                          <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                          <p className="text-lg font-bold text-[#D4AF37]">{item.value}</p>
                          <p className="text-xs text-gray-400 mt-1">{item.sub}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-center text-xs text-gray-400 mt-4">
                      Plan availability and benefit design vary by carrier, state, and team profile.
                    </p>
                  </Card>
                </motion.div>

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
                          desc: `Your information for ${answers.businessName || "your business"} has been securely submitted and matched with small group plan specialists in your state.`,
                          extra: null,
                        },
                        {
                          icon: <Clock className="w-6 h-6 text-[#D4AF37]" />,
                          bg: "bg-[#D4AF37]/10 border-2 border-[#D4AF37]",
                          title: "Within 10 Minutes",
                          badge: { text: "In Progress", cls: "bg-blue-100 text-blue-700" },
                          desc: "A licensed executive benefits strategist will call you with group plan options tailored to your team profile, industry, and growth stage.",
                          extra: (
                            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg mt-2">
                              <Mail className="w-4 h-4 text-[#D4AF37] mt-0.5 flex-shrink-0" />
                              <span>
                                Confirmation sent to {answers.email}. Reference:{" "}
                                <span className="font-mono font-semibold">{referenceNumber || "BIZ-PENDING"}</span>
                              </span>
                            </div>
                          ),
                        },
                        {
                          icon: <Phone className="w-6 h-6 text-gray-400" />,
                          bg: "bg-gray-100",
                          title: "Next Steps",
                          badge: { text: "Upcoming", cls: "bg-gray-100 text-gray-600" },
                          desc: "Your strategist will walk you through multiple carrier options, tiered contribution strategies, and benefit design for executives and key hires.",
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
                  By submitting, you agree to be contacted by licensed insurance agents. Plan and pricing examples are
                  illustrative. Final benefit design depends on team profile, carrier underwriting, and state.
                </p>
              </div>

            ) : currentStep === 0 ? (
              /* ── LANDING PAGE ─────────────────────────────────────── */
              <div className="w-full max-w-none">

                {/* Hero */}
                <section className="bg-[#0A1128] text-white py-16 px-6">
                  <div className="max-w-3xl mx-auto text-center space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/20 rounded-full text-[#D4AF37] text-sm font-semibold">
                      <Building2 className="w-4 h-4" />
                      Small Business Group Health Benefits
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold leading-tight text-balance">
                      Your Best People Deserve Benefits. So Does Your Bottom Line.
                    </h1>
                    <div className="space-y-3 text-left max-w-xl mx-auto">
                      {[
                        "Your team members are buying individual plans that cost 30 to 50% more than a group plan would.",
                        "Every dollar you spend on group premiums is a deductible business expense.",
                        "Your competitors offer benefits. Do you?",
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
                      Get Group Plan Options - Free
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                    <p className="text-gray-400 text-xs">Takes 90 seconds. No obligation. Licensed agents only.</p>
                  </div>
                </section>

                {/* Stats Bar */}
                <section className="bg-[#D4AF37] py-5 px-6">
                  <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { icon: <Users className="w-4 h-4 flex-shrink-0" />, text: "Turnover is 3x higher without executive benefits" },
                      { icon: <Award className="w-4 h-4 flex-shrink-0" />, text: "Top talent expects executive-tier coverage" },
                      { icon: <Stethoscope className="w-4 h-4 flex-shrink-0" />, text: "Concierge medicine attracts senior hires" },
                      { icon: <Shield className="w-4 h-4 flex-shrink-0" />, text: "100% of employer premiums are deductible" },
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
                        Not Offering Benefits Is Costing You More Than Benefits Would
                      </h2>
                      <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Replacing a senior hire costs 50–200% of annual salary. Executive-tier benefits are one of the
                        highest ROI retention investments you can make, and most founders dramatically underestimate the
                        leverage of a well-designed plan.
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
                              <h3 className="font-bold text-foreground">No Group Plan</h3>
                            </div>
                          </div>
                          <ul className="space-y-3">
                            {BIZ_PROBLEMS.map((item, i) => (
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
                              <h3 className="font-bold text-foreground">Executive Group Plan</h3>
                            </div>
                          </div>
                          <ul className="space-y-3">
                            {BIZ_ADVANTAGES.map((item, i) => (
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
                      <h2 className="text-3xl font-bold text-foreground">What Group Plans Cover for Your Entire Team</h2>
                      <p className="text-muted-foreground text-lg">
                        Comprehensive coverage that attracts talent and keeps people healthy.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                      {BIZ_COVERAGE_ITEMS.map((item, i) => (
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
                      <h2 className="text-3xl font-bold text-foreground">Setting Up Group Benefits Is Easier Than You Think</h2>
                      <p className="text-muted-foreground text-lg">Three steps to protecting your team.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {[
                        {
                          step: "1",
                          title: "Strategy Review",
                          desc: "An executive benefits strategist reviews your team profile, growth stage, and talent goals to design the right plan structure.",
                        },
                        {
                          step: "2",
                          title: "Curated Plan Selection",
                          desc: "We compare top carriers, design tiered benefits for executives and key hires, and present a clear total compensation picture.",
                        },
                        {
                          step: "3",
                          title: "Rest Easy",
                          desc: "We handle enrollment for your team and stay on as your dedicated benefits strategist for renewals, claims, and design changes.",
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
                        High-Growth Companies Deserve Fortune 500-Caliber Benefits
                      </h2>
                      <p className="text-gray-300 leading-relaxed">
                        Most founders assume executive-tier benefits are reserved for billion-dollar enterprises.
                        We exist to prove otherwise. With the right design, your company can offer concierge medicine
                        and premium PPO networks that rival any Fortune 500 package.
                      </p>
                      <p className="text-gray-300 leading-relaxed">
                        Our licensed strategists act as your dedicated benefits team, compensated by carriers, never
                        by you, handling everything from carrier selection to annual renewals.
                      </p>
                    </div>
                    <div className="space-y-4">
                      {[
                        { icon: <Shield className="w-5 h-5" />, title: "Licensed in Your State", desc: "Every agent we work with is state-licensed and compliant." },
                        { icon: <DollarSign className="w-5 h-5" />, title: "Carrier-Compensated", desc: "Premiums are identical whether you work with us or buy direct. Carriers compensate us." },
                        { icon: <Clock className="w-5 h-5" />, title: "10-Minute Response", desc: "A dedicated benefits strategist contacts you within 10 minutes." },
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
                    <h2 className="text-3xl font-bold text-foreground">Your Team Deserves Real Benefits. Let&apos;s Build a Plan.</h2>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                      90 seconds to get started. Free, no obligation. Licensed small business specialists.
                    </p>
                    <Button
                      onClick={nextStep}
                      size="lg"
                      className="bg-[#D4AF37] text-[#0A1128] hover:bg-[#c9a430] active:bg-[#b89228] font-bold h-14 px-10 text-base w-full sm:w-auto"
                    >
                      Get Group Plan Options - Free
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
              /* ── STEP 1: Business Size ────────────────────────────── */
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Step 1 of {TOTAL_STEPS}</p>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
                    How many people does your business employ?
                  </h2>
                  <p className="text-muted-foreground text-sm">Include yourself and any full-time employees</p>
                </div>
                <div className="grid gap-3">
                  {[
                    { label: "Just me (sole proprietor)", sub: "No W-2 employees" },
                    { label: "2–5 employees", sub: "Small but mighty team" },
                    { label: "6–15 employees", sub: "Growing business" },
                    { label: "16–50 employees", sub: "Established company" },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => handleBusinessSizeSelect(opt.label)}
                      className={`w-full p-5 rounded-xl border-2 text-left transition-all duration-150 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 active:scale-[0.99] active:bg-[#D4AF37]/10 ${
                        answers.businessSize === opt.label
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
              /* ── STEP 2: Current Situation ───────────────────────── */
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Step 2 of {TOTAL_STEPS}</p>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
                    What&apos;s your current situation?
                  </h2>
                </div>
                <div className="grid gap-3">
                  {[
                    { label: "No coverage offered yet", sub: "Starting fresh with executive benefits" },
                    { label: "Current plan needs upgrading", sub: "Want richer benefits for executives and key hires" },
                    { label: "Top hires are asking for premium coverage", sub: "Need executive-tier benefits to compete for talent" },
                    { label: "Just exploring options", sub: "Comparing carriers and plan design" },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => { updateAnswer("currentSituation", opt.label); setTimeout(() => nextStep(), 400) }}
                      className={`w-full p-5 rounded-xl border-2 text-left transition-all duration-150 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 active:scale-[0.99] active:bg-[#D4AF37]/10 ${
                        answers.currentSituation === opt.label
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

            ) : currentStep === 3 ? (
              /* ── STEP 3: Employer Contribution ───────────────────── */
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Step 3 of {TOTAL_STEPS}</p>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
                    How much will you contribute toward employee premiums?
                  </h2>
                  <p className="text-muted-foreground text-sm">This shapes your benefit design and total comp positioning</p>
                </div>
                <div className="grid gap-3">
                  {[
                    { label: "I'll cover 100%", sub: "Premier offering, fully employer-paid for executive teams" },
                    { label: "I'll cover 50–75%", sub: "Shared cost, common for high-growth companies" },
                    { label: "I'll cover 25–50%", sub: "Employee-majority contribution" },
                    { label: "Employees pay all (voluntary)", sub: "Group rates without employer contribution" },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => { updateAnswer("employerContribution", opt.label); setTimeout(() => nextStep(), 400) }}
                      className={`w-full p-5 rounded-xl border-2 text-left transition-all duration-150 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 active:scale-[0.99] active:bg-[#D4AF37]/10 ${
                        answers.employerContribution === opt.label
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
              /* ── STEP 4: Employee Age Range ──────────────────────── */
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Step 4 of {TOTAL_STEPS}</p>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
                    What best describes your team&apos;s age range?
                  </h2>
                  <p className="text-muted-foreground text-sm">Age mix affects group premium estimates</p>
                </div>
                <div className="grid gap-3">
                  {[
                    { label: "Mostly under 35", sub: "Young team, typically lower premiums" },
                    { label: "Mixed ages", sub: "Wide range of ages across the team" },
                    { label: "Mostly 45+", sub: "More experienced workforce" },
                    { label: "Families with children", sub: "Team members have dependents to cover" },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => { updateAnswer("employeeAgeRange", opt.label); setTimeout(() => nextStep(), 400) }}
                      className={`w-full p-5 rounded-xl border-2 text-left transition-all duration-150 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 active:scale-[0.99] active:bg-[#D4AF37]/10 ${
                        answers.employeeAgeRange === opt.label
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

            ) : currentStep === 5 ? (
              /* ── STEP 5: Industry ─────────────────────────────────── */
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Step 5 of {TOTAL_STEPS}</p>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
                    What industry is your business in?
                  </h2>
                </div>
                <div className="grid gap-3">
                  {[
                    { label: "Office/Professional services", sub: "Law, accounting, consulting, marketing" },
                    { label: "Retail or service", sub: "Restaurants, shops, hospitality" },
                    { label: "Construction/trades", sub: "Building, plumbing, electrical, HVAC" },
                    { label: "Healthcare/medical", sub: "Clinics, dental, therapy, wellness" },
                    { label: "Technology/startup", sub: "Software, SaaS, tech services" },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => { updateAnswer("industry", opt.label); setTimeout(() => nextStep(), 400) }}
                      className={`w-full p-5 rounded-xl border-2 text-left transition-all duration-150 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 active:scale-[0.99] active:bg-[#D4AF37]/10 ${
                        answers.industry === opt.label
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

            ) : currentStep === 6 ? (
              /* ── STEP 6: Timeline ─────────────────────────────────── */
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Step 6 of {TOTAL_STEPS}</p>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
                    When do you want coverage to start?
                  </h2>
                </div>
                <div className="grid gap-3">
                  {[
                    { label: "Need coverage ASAP", sub: "Urgent, enrollment as fast as possible" },
                    { label: "Next 30 days", sub: "Planning ahead for near-term start" },
                    { label: "Next quarter", sub: "Building the plan over the next few months" },
                    { label: "Just exploring", sub: "No firm timeline, gathering information" },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => { updateAnswer("timeline", opt.label); setTimeout(() => nextStep(), 400) }}
                      className={`w-full p-5 rounded-xl border-2 text-left transition-all duration-150 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 active:scale-[0.99] active:bg-[#D4AF37]/10 ${
                        answers.timeline === opt.label
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

            ) : currentStep === 7 ? (
              /* ── STEP 7: State ────────────────────────────────────── */
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Step 7 of {TOTAL_STEPS}</p>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
                    Which state is your business located in?
                  </h2>
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
                      onClick={() => { updateAnswer("state", state); setTimeout(() => nextStep(), 400) }}
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

            ) : currentStep === 8 ? (
              /* ── STEP 8: Business Contact ─────────────────────────── */
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Step 8 of {TOTAL_STEPS}</p>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
                    Almost done. Tell us about your business
                  </h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">
                      Business Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="Acme LLC"
                      value={answers.businessName || ""}
                      onChange={(e) => updateAnswer("businessName", e.target.value)}
                      className={`h-12 ${errors.businessName ? "border-red-500" : ""}`}
                    />
                    {errors.businessName && <p className="text-red-500 text-xs mt-1">{errors.businessName}</p>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        placeholder="First"
                        value={answers.firstName || ""}
                        onChange={(e) => updateAnswer("firstName", e.target.value)}
                        className={`h-12 ${errors.firstName ? "border-red-500" : ""}`}
                      />
                      {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        placeholder="Last"
                        value={answers.lastName || ""}
                        onChange={(e) => updateAnswer("lastName", e.target.value)}
                        className={`h-12 ${errors.lastName ? "border-red-500" : ""}`}
                      />
                      {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">
                      Business Email <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      placeholder="you@yourbusiness.com"
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
                      id="tcpa-biz"
                      checked={answers.tcpaConsent || false}
                      onChange={(e) => updateAnswer("tcpaConsent", e.target.checked)}
                      className="mt-0.5 w-4 h-4 flex-shrink-0 cursor-pointer accent-[#D4AF37]"
                    />
                    <label htmlFor="tcpa-biz" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                      By checking this box and submitting this form, I provide my express written consent to be contacted
                      by Dynasty Insurance Group via phone calls, text messages (including via autodialer or prerecorded
                      message), and email regarding group health insurance options. Consent is not required to purchase
                      any product or service. Message and data rates may apply. Reply STOP to opt out. See our{" "}
                      <a href="/terms" className="underline hover:text-foreground">Terms of Service</a> and{" "}
                      <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a>.
                    </label>
                  </div>
                  {errors.tcpaConsent && <p className="text-red-500 text-xs">{errors.tcpaConsent}</p>}
                  {submitError && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {submitError}
                    </div>
                  )}
                  <Button
                    onClick={handleContactSubmit}
                    disabled={isSubmitting}
                    className="w-full h-14 bg-[#D4AF37] text-[#0A1128] hover:bg-[#c9a430] active:bg-[#b89228] font-bold text-lg shadow-lg"
                  >
                    {isSubmitting ? "Submitting..." : "Get Group Plan Options →"}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Your information is encrypted and never sold to third parties.
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
