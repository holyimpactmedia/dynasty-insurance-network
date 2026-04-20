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
  Star,
  Lock,
  ArrowRight,
  Stethoscope,
  Globe,
  Award,
  XCircle,
  Pill,
  Activity,
  Eye,
  Smile,
  Zap,
  FileText,
  X,
} from "lucide-react"

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

const COVERAGE_GAPS = [
  { icon: <Stethoscope className="w-5 h-5" />, label: "Specialist Access", desc: "See any specialist without a referral" },
  { icon: <Globe className="w-5 h-5" />, label: "Nationwide Coverage", desc: "Use any doctor or hospital, anywhere" },
  { icon: <Activity className="w-5 h-5" />, label: "Emergency Care", desc: "Covered at any ER, in or out of network" },
  { icon: <Pill className="w-5 h-5" />, label: "Prescriptions", desc: "Broad formulary with preferred drug tiers" },
  { icon: <Smile className="w-5 h-5" />, label: "Dental & Vision", desc: "Add-on options with most PPO plans" },
  { icon: <Heart className="w-5 h-5" />, label: "Mental Health", desc: "Therapy and counseling fully covered" },
  { icon: <Eye className="w-5 h-5" />, label: "Preventive Care", desc: "Annual physicals, screenings, vaccines" },
  { icon: <Zap className="w-5 h-5" />, label: "Telemedicine", desc: "Virtual doctor visits 24/7" },
]

const ACA_PROBLEMS = [
  "Restricted to narrow networks, your doctor may not be covered",
  "Need referrals just to see a specialist",
  "High deductibles before any benefits kick in",
  "No coverage outside your plan's service area",
  "Limited plan options in rural areas",
  "Pre-authorization delays for procedures",
]

const PPO_ADVANTAGES = [
  "See ANY doctor or specialist, no referral needed",
  "Nationwide PPO network, covered anywhere in the US",
  "Lower deductibles and more day-one benefits",
  "Out-of-network coverage included",
  "No gatekeeper, you control your care",
  "Faster approvals and less red tape",
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

  // Exit intent (only during quiz)
  useEffect(() => {
    if (!showQuiz) return
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !showExitIntent && !showThankYou) {
        setShowExitIntent(true)
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
    if (!answers.email || !validateEmail(answers.email)) {
      newErrors.email = "Please enter a valid email address"
    }
    if (answers.phone && !validatePhone(answers.phone)) {
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

          {/* Hero — Pain Points */}
          <section className="bg-[#0A1128] text-white py-16 px-6">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/20 rounded-full text-[#D4AF37] text-sm font-semibold">
                <Shield className="w-4 h-4" />
                Private PPO Health Insurance
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight text-balance">
                Stop Asking Permission to See a Doctor
              </h1>
              <div className="space-y-3 text-left max-w-xl mx-auto">
                {[
                  "Your HMO makes you get a referral just to see a specialist.",
                  "Your network excludes the doctors you actually trust.",
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
                Check My PPO Options - Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <p className="text-gray-400 text-xs">Takes 90 seconds. No obligation. Licensed agents only.</p>
            </div>
          </section>

          {/* Stats Bar */}
          <section className="bg-[#D4AF37] py-5 px-6">
            <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
              { icon: <Globe className="w-4 h-4 flex-shrink-0" />, text: "Nationwide networks. All 50 states." },
              { icon: <Stethoscope className="w-4 h-4 flex-shrink-0" />, text: "No referrals. Ever." },
              { icon: <Shield className="w-4 h-4 flex-shrink-0" />, text: "Keep your doctors" },
              { icon: <DollarSign className="w-4 h-4 flex-shrink-0" />, text: "Free specialist consultation" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-center gap-2 text-[#0A1128] font-semibold text-sm text-center">
                  {item.icon}
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Problem Agitation — ACA Swiss Cheese */}
          <section className="py-16 px-6 bg-background">
            <div className="max-w-4xl mx-auto space-y-12">
              <div className="text-center space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                  HMO Plans Were Built for Insurance Companies. Not for You.
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Every restriction in your HMO plan saves them money. Referrals. Narrow networks.
                  Prior authorizations. Pre-auth delays. A private PPO removes all of it.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* ACA/HMO Problems */}
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
                      {ACA_PROBLEMS.map((item, i) => (
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
                        <h3 className="font-bold text-foreground">Private PPO Coverage</h3>
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
                <h2 className="text-3xl font-bold text-foreground">What a Real PPO Plan Covers From Day One</h2>
                <p className="text-muted-foreground text-lg">
                  No waiting. No referrals. No narrow networks.
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
                        desc: "A licensed agent reviews your situation to identify what you actually need and what you&apos;re currently missing.",
                  },
                  {
                    step: "2",
                    title: "Choose Your Plan",
                    desc: "We compare top-rated private PPO plans nationwide and present your best options with clear, side-by-side pricing.",
                  },
                  {
                    step: "3",
                    title: "Rest Easy",
                    desc: "Enroll in minutes and get real coverage that lets you see any doctor, anywhere, without asking permission.",
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
                  Dynasty Insurance Group is a team of licensed specialists. We do not push a plan on you.
                  We look at your doctors, your budget, and your life. Then we find what fits.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  No pressure. No hidden fees. No surprises. Just a plan that works.
                </p>
              </div>
              <div className="space-y-4">
                {[
                  { icon: <Shield className="w-5 h-5" />, title: "Licensed in Your State", desc: "Every agent we work with is state-licensed and compliant." },
                  { icon: <DollarSign className="w-5 h-5" />, title: "100% Free to You", desc: "Our service costs you nothing. We're compensated by the carriers." },
                  { icon: <Clock className="w-5 h-5" />, title: "10-Minute Response", desc: "A real specialist contacts you within 10 minutes on business days." },
                  { icon: <Lock className="w-5 h-5" />, title: "Your Data Is Secure", desc: "We never sell your information to third parties." },
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

          {/* Social Proof */}
          <section className="py-16 px-6 bg-muted/30">
            <div className="max-w-4xl mx-auto space-y-10">
              <h2 className="text-3xl font-bold text-center text-foreground">What Our Clients Say</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    name: "Marcus T.",
                    location: "Dallas, TX",
                    text: "I was paying $900/month for an HMO that wouldn't let me see my cardiologist. Switched to a PPO and now I see whoever I want for $620/month. Wish I did this years ago.",
                    stars: 5,
                  },
                  {
                    name: "Jennifer R.",
                    location: "Phoenix, AZ",
                    text: "My old plan had a $7,000 deductible. My new PPO has a $2,500 deductible and I can go out of network. The specialist found it in 20 minutes.",
                    stars: 5,
                  },
                  {
                    name: "David & Lisa K.",
                    location: "Atlanta, GA",
                    text: "We needed a plan that covered our daughter's pediatric specialist out of state. The agent found us a nationwide PPO at a price we could afford. Amazing service.",
                    stars: 5,
                  },
                ].map((review, i) => (
                  <Card key={i} className="p-6 space-y-4 border-2 border-[#D4AF37]/20">
                    <div className="flex gap-1">
                      {Array.from({ length: review.stars }).map((_, j) => (
                        <Star key={j} className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed italic">&ldquo;{review.text}&rdquo;</p>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{review.name}</p>
                      <p className="text-xs text-muted-foreground">{review.location}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Final CTA */}
          <section className="py-16 px-6 bg-[#0A1128] text-white">
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-balance">
                See What PPO Plans You Qualify For Right Now
              </h2>
              <p className="text-gray-300 leading-relaxed">
                Takes 90 seconds. No obligation. A licensed specialist will contact you within 10 minutes
                with your best private PPO options.
              </p>
              <Button
                onClick={() => setShowQuiz(true)}
                size="lg"
              className="bg-[#D4AF37] text-[#0A1128] hover:bg-[#c9a430] active:bg-[#b89228] font-bold h-14 px-10 text-base w-full sm:w-auto"
            >
              Check My PPO Options - Free
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
          className="fixed bottom-4 left-4 z-50 flex items-center gap-2 bg-background/90 backdrop-blur-sm border border-border shadow-sm rounded-full px-4"
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
            className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl relative"
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
                <Stethoscope className="w-8 h-8 text-[#D4AF37]" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Don&apos;t Leave Without Your PPO Options</h3>
              <p className="text-muted-foreground">
                Enter your email and we&apos;ll send you a comparison of top PPO plans available in your area.
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
                  className="flex-1 bg-[#D4AF37] text-[#0A1128] hover:bg-[#c9a430] active:bg-[#b89228]"
                >
                  Send My Options
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

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
                      A licensed PPO specialist is reviewing your information right now and will contact you
                      within 10 minutes with your best plan options.
                    </p>
                  </div>
                </div>

                {/* PPO Advantage Card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <Card className="p-8 bg-gradient-to-br from-[#0A1128] to-[#1a2744] text-white shadow-xl border-0">
                    <div className="text-center space-y-5">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/20 rounded-full text-[#D4AF37] text-sm font-semibold">
                        <Stethoscope className="w-4 h-4" />
                        What a PPO Gives You
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                        {[
                          { label: "Network", hmo: "Narrow, limited doctors", ppo: "Any doctor, nationwide" },
                          { label: "Referrals", hmo: "Required for specialists", ppo: "Never needed" },
                          { label: "Out-of-Network", hmo: "Not covered", ppo: "Covered (higher cost share)" },
                          { label: "Deductible", hmo: "Often $5,000–$8,000", ppo: "Often $1,500–$3,500" },
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
                        <h2 className="text-2xl font-bold text-foreground mb-1">What Happens Next</h2>
                        <p className="text-muted-foreground text-sm">Your reference number:{" "}
                          <span className="font-mono font-semibold text-foreground">{referenceNumber || "PPO-PENDING"}</span>
                        </p>
                      </div>
                      <div className="space-y-5">
                        {[
                          { icon: <CheckCircle2 className="w-6 h-6 text-green-600" />, bg: "bg-green-100", title: "Right Now: Complete", desc: "Your information is submitted and a specialist has been notified.", badge: "Done", badgeColor: "bg-green-100 text-green-700" },
                          { icon: <Clock className="w-6 h-6 text-[#D4AF37]" />, bg: "bg-[#D4AF37]/10 border-2 border-[#D4AF37]", title: "Within 10 Minutes", desc: "A licensed PPO specialist reviews your answers and prepares a personalized plan comparison.", badge: "In Progress", badgeColor: "bg-blue-100 text-blue-700" },
                          { icon: <Phone className="w-6 h-6 text-gray-400" />, bg: "bg-gray-100", title: "Enrollment Call", desc: "Your specialist walks you through your options and can enroll you same-day if you're ready.", badge: "Upcoming", badgeColor: "bg-gray-100 text-gray-600" },
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

                {/* Step 1 — Coverage For */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="text-center space-y-3">
                      <h2 className="text-3xl font-bold text-foreground">Who needs PPO coverage?</h2>
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

                {/* Step 2 — Current Situation */}
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
                        { label: "I'm on COBRA and looking for a cheaper option", value: "cobra" },
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

                {/* Step 3 — Top Priority */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="text-center space-y-3">
                      <h2 className="text-3xl font-bold text-foreground">What matters most to you in a plan?</h2>
                      <p className="text-muted-foreground">We&apos;ll prioritize this when finding your options.</p>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: "Choosing my own doctors and specialists", value: "doctor_choice", icon: <Stethoscope className="w-5 h-5" /> },
                        { label: "Nationwide coverage, I travel or work remotely", value: "nationwide", icon: <Globe className="w-5 h-5" /> },
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

                {/* Step 4 — Budget */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="text-center space-y-3">
                      <h2 className="text-3xl font-bold text-foreground">What&apos;s your monthly budget for coverage?</h2>
                      <p className="text-muted-foreground">PPO plans range widely. This helps narrow your options.</p>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: "Under $300/month", value: "under_300" },
                        { label: "$300 – $500/month", value: "300_500" },
                        { label: "$500 – $800/month", value: "500_800" },
                        { label: "$800 – $1,200/month", value: "800_1200" },
                        { label: "Over $1,200/month", value: "over_1200" },
                      ].map((opt) => (
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

                {/* Step 5 — State */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <div className="text-center space-y-3">
                      <h2 className="text-3xl font-bold text-foreground">What state do you need coverage in?</h2>
                      <p className="text-muted-foreground">PPO availability varies by state. We&apos;ll check your area.</p>
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

                {/* Step 6 — Contact */}
                {currentStep === 6 && (
                  <div className="space-y-6">
                    <div className="text-center space-y-3">
                      <h2 className="text-3xl font-bold text-foreground">Where should we send your PPO options?</h2>
                      <p className="text-muted-foreground">A licensed specialist will reach out within 10 minutes.</p>
                    </div>
                    <div className="space-y-4">
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
                          placeholder="Phone number (optional)"
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
                            By checking this box and submitting this form, I provide my express written consent to be
                            contacted by Dynasty Insurance Group via phone calls, text messages (including via autodialer
                            or prerecorded message), and email regarding health insurance options. Consent is not
                            required to purchase any product or service. Message and data rates may apply. Reply STOP to
                            opt out. See our{" "}
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
                        See My PPO Options
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <Lock className="w-3 h-3" />
                        Your information is secure and never sold
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 7 �� Name */}
                {currentStep === 7 && (
                  <div className="space-y-6">
                    <div className="text-center space-y-3">
                      <h2 className="text-3xl font-bold text-foreground">Last step: what&apos;s your name?</h2>
                      <p className="text-muted-foreground">So your specialist can personalize your plan options.</p>
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
                        {isSubmitting ? "Submitting..." : "Get My PPO Plans"}
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

      {!showThankYou && <Footer />}
    </div>
  )
}
