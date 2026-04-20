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
  Heart,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Award,
  Lock,
  Users,
  Star,
  AlertCircle,
  DollarSign,
  FileText,
  Stethoscope,
  Baby,
  Briefcase,
  Home,
  XCircle,
  Activity,
  Eye,
  Smile,
  Zap,
  Globe,
  Pill,
  ArrowRight,
  X,
} from "lucide-react"

const INDIV_COVERAGE_ITEMS = [
  { icon: <Stethoscope className="w-5 h-5" />, label: "Any Doctor", desc: "See any physician or specialist without referrals" },
  { icon: <Globe className="w-5 h-5" />, label: "Nationwide PPO", desc: "Premium networks accepted at top hospitals across the US" },
  { icon: <Activity className="w-5 h-5" />, label: "Emergency Care", desc: "Full ER coverage with no surprise billing" },
  { icon: <Pill className="w-5 h-5" />, label: "Prescriptions", desc: "Comprehensive formularies including brand-name medications" },
  { icon: <Smile className="w-5 h-5" />, label: "Dental & Vision", desc: "Bundled or standalone plans for complete coverage" },
  { icon: <Heart className="w-5 h-5" />, label: "Mental Health", desc: "Therapy, counseling, and psychiatric care included" },
  { icon: <Eye className="w-5 h-5" />, label: "Preventive Care", desc: "Annual physicals, screenings, and wellness visits" },
  { icon: <Zap className="w-5 h-5" />, label: "Telemedicine", desc: "24/7 virtual visits with board-certified physicians" },
]

const INDIV_PROBLEMS = [
  "Your HMO forces you to get referrals for every specialist visit",
  "Narrow networks exclude the doctors and hospitals you actually want",
  "You travel for work or own multiple homes but your plan only works locally",
  "Your employer plan costs a fortune and still has massive deductibles",
  "You earn too much for marketplace assistance but still deserve quality coverage",
  "You are tired of fighting insurance companies for basic coverage",
]

const INDIV_ADVANTAGES = [
  "Private PPO plans with nationwide coverage and zero referrals",
  "Keep your doctors and see any specialist directly",
  "Premium networks: Blue Cross, Cigna, Aetna, United Healthcare",
  "Coverage that travels with you across all 50 states",
  "Plans designed for high earners, entrepreneurs, and families",
  "Free consultation with a licensed specialist who knows private options",
]

const INCOME_RANGES = [
  "Under $20,000",
  "$20,000 - $35,000",
  "$35,000 - $50,000",
  "$50,000 - $75,000",
  "$75,000 - $100,000",
  "Over $100,000",
]

// US States
const US_STATES = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
]

export default function HealthcareQuizPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<any>({})
  const [stateSearch, setStateSearch] = useState("")
  const [errors, setErrors] = useState<any>({})
  const [showExitIntent, setShowExitIntent] = useState(false)
  const [showThankYou, setShowThankYou] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null)
  const [daysUntilDeadline] = useState(() => {
    const deadline = new Date("2026-01-15")
    const today = new Date()
    const diffTime = deadline.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  })

  // LocalStorage persistence
  useEffect(() => {
    try {
      const saved = localStorage.getItem("healthcareQuizData")
      if (saved) {
        const data = JSON.parse(saved)
        setAnswers(data.answers || {})
        setCurrentStep(data.step || 0)
      }
    } catch (e) {
      console.error("Failed to load saved data")
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(
        "healthcareQuizData",
        JSON.stringify({
          answers,
          step: currentStep,
        }),
      )
    } catch (e) {
      console.error("Failed to save data")
    }
  }, [answers, currentStep])

  // Inject TrustedForm form ID for healthcare quiz
  useEffect(() => {
    if (typeof window !== "undefined") {
      const script = document.createElement("script")
      script.type = "text/javascript"
      script.text = `tf_form_id = 'healthcare-quote-quiz';`
      document.head.appendChild(script)
    }
  }, [])

  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && currentStep > 0 && currentStep < 8 && !showExitIntent) {
        setShowExitIntent(true)
      }
    }

    document.addEventListener("mouseleave", handleMouseLeave)
    return () => document.removeEventListener("mouseleave", handleMouseLeave)
  }, [currentStep, showExitIntent])

  const updateAnswer = (key: string, value: any) => {
    setAnswers({ ...answers, [key]: value })
    setErrors({ ...errors, [key]: "" })
  }

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 8))
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const handleAutoAdvance = (key: string, value: any, delay = 400) => {
    updateAnswer(key, value)
    setTimeout(() => nextStep(), delay)
  }

  // Validation functions
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const validatePhone = (phone: string) => {
    return phone.replace(/\D/g, "").length === 10
  }

  const validateName = (name: string) => {
    return name.trim().length >= 2
  }

  const handleContactSubmit = () => {
    const newErrors: any = {}

    // Require at least one contact method
    const hasPhone = answers.phone && validatePhone(answers.phone)
    const hasEmail = answers.email && validateEmail(answers.email)

    if (!hasPhone && !hasEmail) {
      newErrors.contact = "Please provide either a valid phone number or email address"
    }

    if (answers.phone && !validatePhone(answers.phone)) {
      newErrors.phone = "Please enter a valid 10-digit phone number"
    }

    if (answers.email && !validateEmail(answers.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    // TCPA consent required by law
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
    const newErrors: any = {}

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
      // Get TrustedForm certificate URL if available
      const trustedFormCertUrl = (document.getElementById('xxTrustedFormCertUrl') as HTMLInputElement)?.value || null

      // Get UTM parameters from URL
      const urlParams = new URLSearchParams(window.location.search)

      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: answers.firstName,
          lastName: answers.lastName,
          email: answers.email,
          phone: answers.phone,
          age: answers.age,
          state: answers.state,
          incomeRange: answers.income,
          householdSize: answers.householdSize,
          qualifyingEvent: answers.qualifyingEvent,
          priorities: answers.priorities,
          tcpaConsent: answers.tcpaConsent,
          trustedFormCertUrl,
          utmSource: urlParams.get('utm_source'),
          utmMedium: urlParams.get('utm_medium'),
          utmCampaign: urlParams.get('utm_campaign'),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit')
      }

      setReferenceNumber(data.referenceNumber)
      setShowThankYou(true)
      
      // Clear localStorage after successful submission
      localStorage.removeItem("healthcareQuizData")
    } catch (error) {
      console.error('Error submitting lead:', error)
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const progress = currentStep >= 1 && currentStep <= 8 ? (currentStep / 8) * 100 : 0

  const filteredStates = US_STATES.filter((state) => state.toLowerCase().includes(stateSearch.toLowerCase()))

  const calculateHealthcareRate = () => {
    let baseRate = 450 // Average private PPO rate

    // Age adjustments (healthcare is heavily age-dependent)
    const age = Number.parseInt(answers.age) || 30
    if (age >= 18 && age <= 29) baseRate = 250
    else if (age >= 30 && age <= 39) baseRate = 300
    else if (age >= 40 && age <= 49) baseRate = 400
    else if (age >= 50 && age <= 59) baseRate = 650
    else if (age >= 60 && age <= 64) baseRate = 850

    // Household size multiplier
    const householdMultiplier =
      {
        "Just me": 1,
        "Me + spouse": 2,
        "Me + children": 1.8,
        "Family (3+ people)": 2.5,
      }[answers.householdSize] || 1

    baseRate *= householdMultiplier

    // Income-based plan tier adjustment
    let subsidy = 0
    if (answers.income === "Under $20,000") subsidy = baseRate * 0.85
    else if (answers.income === "$20,000 - $35,000") subsidy = baseRate * 0.7
    else if (answers.income === "$35,000 - $50,000") subsidy = baseRate * 0.5
    else if (answers.income === "$50,000 - $75,000") subsidy = baseRate * 0.3
    else if (answers.income === "$75,000 - $100,000") subsidy = baseRate * 0.15

    const afterSubsidy = Math.max(0, baseRate - subsidy)

    return {
      fullPrice: Math.round(baseRate),
      subsidy: Math.round(subsidy),
      afterSubsidy: Math.round(afterSubsidy),
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="w-full py-4 px-6 flex items-center justify-center border-b bg-primary">
        <img src="/images/logo.avif" alt="Dynasty" className="h-16 w-auto" />
      </header>

      {!showThankYou && currentStep >= 1 && currentStep <= 8 && (
        <div className="w-full h-1 bg-muted">
          <motion.div
            className="h-full bg-[#D4AF37]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}

      {!showThankYou && currentStep >= 1 && currentStep <= 8 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={prevStep}
          className="fixed bottom-4 left-4 z-50 flex items-center gap-2 bg-background/90 backdrop-blur-sm border border-border shadow-sm rounded-full px-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>
      )}

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
                <Mail className="w-8 h-8 text-[#D4AF37]" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Wait! Don&apos;t Miss Your Options</h3>
              <p className="text-muted-foreground">
                Enter your email and we&apos;ll send you information about private PPO plans tailored to your needs.
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
                  Continue
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
                  Send Info
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Step Content */}
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
            {showThankYou ? (
              (() => {
                const rates = calculateHealthcareRate()
                return (
                  <div className="space-y-8 pb-12">
                    {/* Hero Section */}
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
                        <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                          {"You're all set, "}{answers.firstName}{"."}
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
                          A licensed specialist is reviewing your profile right now. They will reach out
                          within 10 minutes with private PPO plans built for your situation.
                        </p>
                      </div>
                    </div>

                    {/* Potential Subsidy Info */}
                    {rates.subsidy > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Card className="p-8 bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-xl">
                          <div className="text-center space-y-4">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-sm font-medium">
                              <Award className="w-4 h-4" />
                              Your Plan Options Are Ready
                            </div>
                            <p className="text-lg leading-relaxed">
                              Based on your profile, your specialist will present private PPO options that match your
                              coverage needs and budget, with full network details and no surprises.
                            </p>
                            <p className="text-xs opacity-80">
                              A licensed specialist will walk you through all available options on your call.
                            </p>
                          </div>
                        </Card>
                      </motion.div>
                    )}

                    {/* Timeline Section */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Card className="p-8 border-2 border-[#D4AF37]">
                        <div className="space-y-6">
                          <div className="text-center">
                            <h2 className="text-2xl font-bold text-foreground mb-2">What Happens Next?</h2>
                            <p className="text-muted-foreground">Here is what happens next</p>
                          </div>

                          <div className="space-y-6">
                            {/* Step 1 */}
                            <div className="flex gap-4">
                              <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                                </div>
                                <div className="w-0.5 h-full bg-gray-200 mt-2" />
                              </div>
                              <div className="pb-6">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-foreground">Right Now</h3>
                                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                                    Complete
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Your information has been securely submitted and our system is matching you with the
                                  best plans.
                                </p>
                              </div>
                            </div>

                            {/* Step 2 */}
                            <div className="flex gap-4">
                              <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0 border-2 border-[#D4AF37]">
                                  <Clock className="w-6 h-6 text-[#D4AF37]" />
                                </div>
                                <div className="w-0.5 h-full bg-gray-200 mt-2" />
                              </div>
                              <div className="pb-6">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-foreground">Within 10 Minutes</h3>
                                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                                    In Progress
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  A licensed healthcare specialist will review your application and prepare personalized
                                  plan options.
                                </p>
                                <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                                  <Mail className="w-4 h-4 text-[#D4AF37] mt-0.5 flex-shrink-0" />
                                  <span>
                                    Check your email for confirmation with your reference number:{" "}
                                    <span className="font-mono font-semibold">
                                      {referenceNumber || 'HL-PENDING'}
                                    </span>
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Step 3 */}
                            <div className="flex gap-4">
                              <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                  <Phone className="w-6 h-6 text-gray-400" />
                                </div>
                                <div className="w-0.5 h-full bg-gray-200 mt-2" />
                              </div>
                              <div className="pb-6">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-foreground">Within 24 Hours</h3>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">
                                  {answers.phone
                                    ? "Your dedicated agent will call you to discuss plan options and answer questions."
                                    : "You'll receive a detailed email with plan comparisons and enrollment options."}
                                </p>
                                {answers.phone && (
                                  <div className="space-y-2 text-xs bg-blue-50 p-3 rounded-lg border border-blue-200">
                                    <p className="font-medium text-blue-900">📱 Save This Number</p>
                                    <p className="text-blue-700">
                                      We'll call from: <span className="font-semibold">(800) 555-0123</span>
                                    </p>
                                    <p className="text-blue-600">Add to contacts so you don't miss our call!</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Step 4 */}
                            <div className="flex gap-4">
                              <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                  <FileText className="w-6 h-6 text-gray-400" />
                                </div>
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-foreground">After Your Call</h3>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Complete a simple enrollment form and your coverage can start as soon as the 1st of
                                  next month.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>

                    {/* What You'll Receive Section */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Card className="p-6 bg-muted/50">
                        <h3 className="font-semibold text-foreground mb-4 text-center">
                          What You'll Receive From Your Agent
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <FileText className="w-5 h-5 text-[#D4AF37]" />
                            </div>
                            <div>
                              <h4 className="font-medium text-foreground text-sm">Plan Comparisons</h4>
                              <p className="text-xs text-muted-foreground">
                                Side-by-side comparison of Bronze, Silver, Gold & Platinum options
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <Stethoscope className="w-5 h-5 text-[#D4AF37]" />
                            </div>
                            <div>
                              <h4 className="font-medium text-foreground text-sm">Doctor Network Check</h4>
                              <p className="text-xs text-muted-foreground">
                                Verify your current doctors accept the plan
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <DollarSign className="w-5 h-5 text-[#D4AF37]" />
                            </div>
                            <div>
                              <h4 className="font-medium text-foreground text-sm">Network Review</h4>
                              <p className="text-xs text-muted-foreground">Confirm your doctors are in-network</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <Heart className="w-5 h-5 text-[#D4AF37]" />
                            </div>
                            <div>
                              <h4 className="font-medium text-foreground text-sm">Prescription Review</h4>
                              <p className="text-xs text-muted-foreground">Ensure your medications are covered</p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>

                    {/* FAQ Section */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <Card className="p-6">
                        <h3 className="font-semibold text-foreground mb-4 text-center">Common Questions</h3>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <h4 className="font-medium text-foreground text-sm flex items-start gap-2">
                              <span className="text-[#D4AF37]">Q:</span>
                              <span>When does coverage actually start?</span>
                            </h4>
                            <p className="text-sm text-muted-foreground pl-6">
                              Coverage begins on the 1st of the month following your enrollment. If you enroll before
                              the 15th, coverage can start the next month.
                            </p>
                          </div>

                          <div className="border-t pt-4 space-y-2">
                            <h4 className="font-medium text-foreground text-sm flex items-start gap-2">
                              <span className="text-[#D4AF37]">Q:</span>
                              <span>What information do I need for my call?</span>
                            </h4>
                            <p className="text-sm text-muted-foreground pl-6">
                              Have ready: List of current medications, preferred doctors/hospitals, and any current plan details.
                            </p>
                          </div>

                          <div className="border-t pt-4 space-y-2">
                            <h4 className="font-medium text-foreground text-sm flex items-start gap-2">
                              <span className="text-[#D4AF37]">Q:</span>
                              <span>Is there any cost to speak with an agent?</span>
                            </h4>
                            <p className="text-sm text-muted-foreground pl-6">
                              No! Our service is 100% free. We're compensated by insurance carriers, not you. Your rates
                              are the same whether you use an agent or not.
                            </p>
                          </div>

                          <div className="border-t pt-4 space-y-2">
                            <h4 className="font-medium text-foreground text-sm flex items-start gap-2">
                              <span className="text-[#D4AF37]">Q:</span>
                              <span>What if I miss the call?</span>
                            </h4>
                            <p className="text-sm text-muted-foreground pl-6">
                              No worries! We'll leave a voicemail with a callback number. You can also reply to your
                              confirmation email to schedule a time that works better.
                            </p>
                          </div>
                        </div>
                      </Card>
                    </motion.div>

                    {/* Important Reminders */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                    >
                      <Card className="p-6 bg-blue-50 border-blue-200">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div className="space-y-2 text-sm">
                            <p className="font-medium text-blue-900">Important Disclaimers</p>
                            <ul className="text-blue-700 space-y-1 text-xs">
                              <li>
                                • <strong>Rates:</strong> Final premium rates are subject to change based on plan
                                selection, exact age, location, household size, tobacco use, and income verification
                              </li>
                              <li>
                                • <strong>Estimates:</strong> Plan pricing estimates are based on national averages.
                                Actual rates are confirmed during your specialist consultation.
                              </li>
                              <li>• <strong>Coverage:</strong> Private PPO plans include comprehensive in- and out-of-network benefits</li>
                              <li>
                                • <strong>Agent Compensation:</strong> Our licensed agents may receive compensation from
                                insurance carriers. This does not affect your rates
                              </li>
                              {daysUntilDeadline > 0 && daysUntilDeadline <= 30 && (
                                <li className="font-semibold">
                                  • <strong>Deadline:</strong> Open Enrollment ends in {daysUntilDeadline} days
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </Card>
                    </motion.div>

                    {/* Social Proof */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                    >
                      <div className="space-y-4">
                        <h3 className="font-semibold text-foreground text-center">What Others Are Saying</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          <Card className="p-5 bg-muted/50">
                            <div className="flex gap-1 mb-2">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
                              ))}
                            </div>
                            <p className="text-sm text-muted-foreground italic mb-3">
                              "The agent walked me through every option and found a plan that covers all my
                              prescriptions for $65/month. Life-changing!"
                            </p>
                            <p className="text-xs font-medium text-foreground">- Maria G., Florida</p>
                          </Card>

                          <Card className="p-5 bg-muted/50">
                            <div className="flex gap-1 mb-2">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
                              ))}
                            </div>
                            <p className="text-sm text-muted-foreground italic mb-3">
                              "I was paying $450/month. After working with them, I'm now at $89/month with better
                              coverage. Wish I'd done this sooner."
                            </p>
                            <p className="text-xs font-medium text-foreground">- Robert K., Texas</p>
                          </Card>
                        </div>
                      </div>
                    </motion.div>

                    {/* Download Resources */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9 }}
                    >
                      <Card className="p-6 bg-gradient-to-r from-[#D4AF37]/10 to-[#E8C976]/10 border-2 border-[#D4AF37]/30">
                        <div className="text-center space-y-4">
                          <div className="w-12 h-12 bg-[#D4AF37]/20 rounded-full flex items-center justify-center mx-auto">
                            <FileText className="w-6 h-6 text-[#D4AF37]" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground mb-2">Free Healthcare Guide</h3>
                            <p className="text-sm text-muted-foreground">
                              While you wait, download our free guide: "7 Ways to Reduce Healthcare Costs in 2026"
                            </p>
                          </div>
                          <Button className="bg-[#D4AF37] text-[#0A1128] hover:bg-[#D4AF37]/90">
                            Download Free Guide
                          </Button>
                        </div>
                      </Card>
                    </motion.div>

                    {/* Contact Information */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.0 }}
                      className="text-center space-y-4"
                    >
                      <div className="border-t pt-6">
                        <p className="text-sm text-muted-foreground mb-3">Need immediate assistance?</p>
                          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                          <a
                            href="tel:8005550123"
                            className="flex items-center gap-2 text-foreground hover:text-[#D4AF37] transition-colors"
                          >
                            <Phone className="w-4 h-4" />
                            <span className="font-semibold">(800) 555-0123</span>
                          </a>
                          <span className="hidden sm:inline text-muted-foreground">•</span>
                          <a
                            href={`mailto:${answers.email || "support@example.com"}`}
                            className="flex items-center gap-2 text-foreground hover:text-[#D4AF37] transition-colors"
                          >
                            <Mail className="w-4 h-4" />
                            <span className="font-semibold">Reply to your email</span>
                          </a>
                        </div>
                      </div>

                      <div className="pt-4">
                        <Button
                          onClick={() => {
                            setShowThankYou(false)
                            setCurrentStep(0)
                            setAnswers({})
                            localStorage.removeItem("healthcareQuizData")
                          }}
                          variant="outline"
                          size="sm"
                        >
                          Start a New Application
                        </Button>
                      </div>

                      <div className="pt-2">
                        <p className="text-xs text-muted-foreground">
                          Reference Number: {referenceNumber || 'HL-PENDING'} • Submitted{" "}
                          {new Date().toLocaleDateString()}
                        </p>
                      </div>
                    </motion.div>
                  </div>
                )
              })()
            ) : (
              <>
                {currentStep === 0 && (
                  <div className="w-full max-w-none">

                    {/* Hero */}
                    <section className="bg-[#0A1128] text-white py-16 px-6">
                      <div className="max-w-3xl mx-auto text-center space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/20 rounded-full text-[#D4AF37] text-sm font-semibold">
                          <Award className="w-4 h-4" />
                          Licensed Independent Insurance Specialists
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold leading-tight text-balance">
                          See Any Doctor. No Referrals. No Narrow Networks.
                        </h1>
                        <div className="space-y-3 text-left max-w-xl mx-auto">
                          {[
                            "Your HMO makes you beg for a referral just to see a specialist.",
                            "Your network excludes the doctors and hospitals you actually trust.",
                            "Your plan stops working the moment you cross state lines.",
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
                        <p className="text-gray-400 text-xs">90 seconds. No cost. Real licensed specialists.</p>
                      </div>
                    </section>

                    {/* Stats Bar */}
                    <section className="bg-[#D4AF37] py-5 px-6">
                      <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {[
                          { icon: <Globe className="w-4 h-4 flex-shrink-0" />, text: "Nationwide PPO networks" },
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

                    {/* Problem Agitation */}
                    <section className="py-16 px-6 bg-background">
                      <div className="max-w-4xl mx-auto space-y-12">
                        <div className="text-center space-y-4">
                          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                            Most Plans Look Good on Paper. Then You Try to Use Them.
                          </h2>
                          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                            Narrow networks. Mandatory referrals. Deductibles you never hit. Most people do not realize
                            how bad their coverage is until they need it most. Private PPO plans fix all of that.
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
                                  <p className="text-xs text-red-500 font-semibold uppercase tracking-wide">The Reality</p>
                                  <h3 className="font-bold text-foreground">What Most Americans Face</h3>
                                </div>
                              </div>
                              <ul className="space-y-3">
                                {INDIV_PROBLEMS.map((item, i) => (
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
                                  <h3 className="font-bold text-foreground">Private PPO Coverage, Done Right</h3>
                                </div>
                              </div>
                              <ul className="space-y-3">
                                {INDIV_ADVANTAGES.map((item, i) => (
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
                          <h2 className="text-3xl font-bold text-foreground">What Real Coverage Looks Like</h2>
                          <p className="text-muted-foreground text-lg">
                            Every private PPO plan covers these benefits from day one. No waiting periods.
                          </p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                          {INDIV_COVERAGE_ITEMS.map((item, i) => (
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
                          <h2 className="text-3xl font-bold text-foreground">Getting the Right Plan Takes 3 Steps</h2>
                          <p className="text-muted-foreground text-lg">Simple. Fast. No pressure.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          {[
                            {
                              step: "1",
                              title: "Tell Us Your Situation",
                              desc: "Answer a few quick questions. Takes 90 seconds. No jargon.",
                            },
                            {
                              step: "2",
                              title: "Get Your Options",
                              desc: "A licensed specialist calls you within 10 minutes with real private PPO plans that fit your life.",
                            },
                            {
                              step: "3",
                              title: "Pick and Enroll",
                              desc: "Choose the plan you want. Enroll in minutes. Coverage starts the 1st of next month.",
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
                            Real People. Real Coverage. No Runaround.
                          </h2>
                          <p className="text-gray-300 leading-relaxed">
                            Dynasty Insurance Group is a team of licensed specialists. We do not sell you a plan.
                            We find the right one. We look at your doctors, your budget, and your life. Then
                            we show you what actually fits.
                          </p>
                          <p className="text-gray-300 leading-relaxed">
                            No pressure. No hidden fees. No surprise bills later. Just coverage that works
                            the way it should.
                          </p>
                        </div>
                        <div className="space-y-4">
                          {[
                            { icon: <Shield className="w-5 h-5" />, title: "Licensed in Your State", desc: "Every agent we work with is state-licensed and compliant." },
                            { icon: <DollarSign className="w-5 h-5" />, title: "100% Free to You", desc: "Our service costs you nothing. We're compensated by the carriers." },
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
                        <h2 className="text-3xl font-bold text-foreground">Stop Settling. Get Coverage That Actually Works.</h2>
                        <p className="text-muted-foreground text-lg leading-relaxed">
                          90 seconds. Free. No obligation. A real licensed specialist calls you.
                        </p>
                        <Button
                          onClick={nextStep}
                          size="lg"
                          className="bg-[#D4AF37] text-[#0A1128] hover:bg-[#c9a430] active:bg-[#b89228] font-bold h-14 px-10 text-base w-full sm:w-auto"
                        >
                          Check If You Qualify - Free
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5"><Lock className="w-4 h-4 flex-shrink-0" /> Secure &amp; Private</span>
                          <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 flex-shrink-0" /> Free, No Obligation</span>
                          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Licensed Agents</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Dynasty Insurance Group specializes in private health insurance solutions.
                        </p>
                      </div>
                    </section>
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="space-y-8">
                    <div className="text-center space-y-4">
                      <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                        What Brought You Here Today?
                      </h2>
                      <p className="text-muted-foreground">
                        This helps us find the right plan for your situation
                      </p>
                    </div>

                    <div className="grid gap-3">
                      {[
                        { label: "Lost job coverage", icon: Briefcase, desc: "COBRA ended or became too expensive" },
                        { label: "Moving states", icon: Home, desc: "Relocated to a new area" },
                        { label: "Having a baby", icon: Baby, desc: "New addition to the family" },
                        { label: "Open enrollment", icon: Calendar, desc: "Annual enrollment period" },
                        { label: "Currently uninsured", icon: Shield, desc: "Need coverage as soon as possible" },
                      ].map((option) => (
                        <Card
                          key={option.label}
                          className="p-5 cursor-pointer border-2 border-border hover:border-[#D4AF37] hover:shadow-md active:border-[#D4AF37] active:bg-[#D4AF37]/10 active:scale-[0.99] transition-all duration-150"
                          onClick={() => handleAutoAdvance("qualifyingEvent", option.label)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 bg-[#D4AF37]/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <option.icon className="w-5 h-5 text-[#D4AF37]" />
                            </div>
                            <div>
                              <h3 className="text-base font-semibold text-foreground">{option.label}</h3>
                              <p className="text-sm text-muted-foreground">{option.desc}</p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-8">
                    <div className="text-center space-y-4">
                      <h2 className="text-3xl md:text-4xl font-bold text-foreground">Who needs to be covered?</h2>
                      <p className="text-muted-foreground">This affects your plan options and pricing</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { label: "Just me", icon: Users, desc: "Individual coverage" },
                        { label: "Me + spouse", icon: Heart, desc: "Coverage for two adults" },
                        { label: "Me + children", icon: Baby, desc: "Parent(s) and dependents" },
                        { label: "Family (3+ people)", icon: Users, desc: "Full family coverage" },
                      ].map((option) => (
                        <Card
                          key={option.label}
                          className="p-6 cursor-pointer border-2 border-border hover:border-[#D4AF37] hover:shadow-md active:border-[#D4AF37] active:bg-[#D4AF37]/10 active:scale-[0.99] transition-all duration-150"
                          onClick={() => handleAutoAdvance("householdSize", option.label)}
                        >
                          <div className="text-center space-y-3">
                            <div className="w-14 h-14 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto">
                              <option.icon className="w-8 h-8 text-[#D4AF37]" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground">{option.label}</h3>
                            <p className="text-sm text-muted-foreground">{option.desc}</p>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-8">
                    <div className="text-center space-y-4">
                      <h2 className="text-3xl md:text-4xl font-bold text-foreground">What is your age?</h2>
                      <p className="text-muted-foreground">Age affects your premium rate</p>
                    </div>

                    <div className="space-y-4 max-w-md mx-auto">
                      <Input
                        type="number"
                        placeholder="Enter your age"
                        value={answers.age || ""}
                        onChange={(e) => {
                          const age = Number.parseInt(e.target.value)
                          updateAnswer("age", e.target.value)

                          if (age >= 65) {
                            setErrors({
                              age: "You may qualify for Medicare! We'll connect you with a Medicare specialist.",
                            })
                          } else {
                            setErrors({ age: "" })
                          }
                        }}
                        className="h-14 text-lg text-center"
                        min="18"
                        max="100"
                      />
                      {errors.age && (
                        <Card className="p-4 bg-blue-50 border-blue-200">
                          <div className="flex items-start gap-3">
                            <Stethoscope className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-blue-600">{errors.age}</p>
                          </div>
                        </Card>
                      )}

                      <Button
                        onClick={() => {
                          const age = Number.parseInt(answers.age)
                          if (age >= 18 && age < 65) {
                            nextStep()
                          } else if (!age) {
                            setErrors({ age: "Please enter your age" })
                          }
                        }}
                        disabled={!answers.age || Number.parseInt(answers.age) >= 65}
                        className="w-full h-12 bg-[#0A1128] text-white hover:bg-[#0A1128]/90"
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-8">
                    <div className="text-center space-y-4">
                      <h2 className="text-3xl md:text-4xl font-bold text-foreground">What's your ZIP code?</h2>
                      <p className="text-muted-foreground">Healthcare rates vary by county</p>
                    </div>

                    <div className="space-y-4 max-w-md mx-auto">
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Enter ZIP code"
                          value={answers.zipCode || ""}
                          onChange={(e) => {
                            const zip = e.target.value.replace(/\D/g, "").slice(0, 5)
                            updateAnswer("zipCode", zip)
                          }}
                          className="pl-10 h-14 text-lg text-center"
                          maxLength={5}
                        />
                      </div>

                      <Button
                        onClick={() => {
                          if (answers.zipCode && answers.zipCode.length === 5) {
                            nextStep()
                          } else {
                            setErrors({ zipCode: "Please enter a valid 5-digit ZIP code" })
                          }
                        }}
                        className="w-full h-12 bg-[#0A1128] text-white hover:bg-[#0A1128]/90"
                      >
                        Continue
                      </Button>
                      {errors.zipCode && <p className="text-sm text-red-500 text-center">{errors.zipCode}</p>}
                    </div>
                  </div>
                )}

                {currentStep === 5 && (
                  <div className="space-y-8">
                    <div className="text-center space-y-4">
                      <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                        One Last Question
                      </h2>
                      <p className="text-xl text-muted-foreground">
                        What is your household income range?
                      </p>
                      <Card className="p-4 bg-yellow-50 border-yellow-300 max-w-md mx-auto">
                        <p className="text-sm text-foreground font-medium">
                          This helps your specialist match you to the right plan tier and coverage level.
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Best estimate is fine. Your specialist will go over every detail on your call.
                        </p>
                      </Card>
                    </div>

                    <div className="grid gap-2.5">
                      {INCOME_RANGES.map((income) => (
                        <Card
                          key={income}
                          className="p-4 cursor-pointer border-2 border-border hover:border-[#D4AF37] hover:shadow-md active:border-[#D4AF37] active:bg-[#D4AF37]/10 active:scale-[0.99] transition-all duration-150"
                          onClick={() => handleAutoAdvance("income", income)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <DollarSign className="w-5 h-5 text-[#D4AF37]" />
                            </div>
                            <p className="text-base font-semibold text-foreground">{income}</p>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {currentStep === 6 && (
                  <div className="space-y-8">
                    <div className="text-center space-y-4">
                      <h2 className="text-3xl md:text-4xl font-bold text-foreground">What matters most to you?</h2>
                      <p className="text-muted-foreground">This helps us recommend the right plan tier</p>
                    </div>

                    <div className="grid gap-3">
                      {[
                        {
                          label: "Lowest monthly payment",
                          icon: DollarSign,
                          desc: "Bronze/Silver plans with higher deductibles",
                        },
                        {
                          label: "Best doctors & hospitals",
                          icon: Stethoscope,
                          desc: "Wide network access and top facilities",
                        },
                        {
                          label: "Lowest out-of-pocket costs",
                          icon: Shield,
                          desc: "Gold/Platinum plans with lower deductibles",
                        },
                        {
                          label: "Prescription coverage",
                          icon: FileText,
                          desc: "Plans with comprehensive drug coverage",
                        },
                      ].map((option) => (
                        <Card
                          key={option.label}
                          className="p-5 cursor-pointer border-2 border-border hover:border-[#D4AF37] hover:shadow-md active:border-[#D4AF37] active:bg-[#D4AF37]/10 active:scale-[0.99] transition-all duration-150"
                          onClick={() => handleAutoAdvance("priority", option.label)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 bg-[#D4AF37]/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <option.icon className="w-5 h-5 text-[#D4AF37]" />
                            </div>
                            <div>
                              <h3 className="text-base font-semibold text-foreground">{option.label}</h3>
                              <p className="text-sm text-muted-foreground">{option.desc}</p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {currentStep === 7 && (
                  <div className="space-y-8">
                    <div className="text-center space-y-4">
                      <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                        Last Step: How Should We Get You Your Results?
                      </h2>
                      <p className="text-lg text-muted-foreground">
                        We'll connect you with a licensed agent who knows your state's plans inside and out
                      </p>
                      <div className="flex items-center justify-center gap-2 text-sm text-green-600 font-medium">
                        <Lock className="w-4 h-4" />
                        <span>Secure & Private - We Never Sell Your Info</span>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                          <Mail className="w-4 h-4 text-[#D4AF37]" />
                          Email Address (Recommended)
                        </label>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          value={answers.email || ""}
                          onChange={(e) => updateAnswer("email", e.target.value)}
                          className={`h-12 ${errors.email ? "border-red-500" : ""}`}
                        />
                        {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                        <p className="text-xs text-muted-foreground">Browse plans at your own pace via email</p>
                      </div>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">Or speak with an agent</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                          <Phone className="w-4 h-4 text-[#D4AF37]" />
                          Phone Number (Optional)
                        </label>
                        <Input
                          type="tel"
                          placeholder="(555) 123-4567"
                          value={answers.phone || ""}
                          onChange={(e) => updateAnswer("phone", e.target.value)}
                          className={`h-12 ${errors.phone ? "border-red-500" : ""}`}
                        />
                        {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                        <p className="text-xs text-muted-foreground">Get personal assistance from a licensed agent</p>
                      </div>

                      {errors.contact && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-sm text-red-600">{errors.contact}</p>
                        </div>
                      )}

                      {/* Consumer Consent and Disclosures */}
                      <div className="space-y-4 border-t pt-6">
                        <h3 className="text-sm font-semibold text-foreground">Consumer Consent & Disclosures</h3>

                        {/* Primary TCPA Consent */}
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            id="tcpa-consent"
                            checked={answers.tcpaConsent || false}
                            onChange={(e) => updateAnswer("tcpaConsent", e.target.checked)}
                            className="mt-1 w-4 h-4 text-[#D4AF37] border-gray-300 rounded focus:ring-[#D4AF37]"
                          />
                          <label htmlFor="tcpa-consent" className="text-xs text-muted-foreground leading-relaxed">
                            <strong className="text-foreground">Consent to Contact (Required):</strong> By checking this
                            box and submitting this form, I provide my express written consent to be contacted by
                            Dynasty Insurance Group via phone calls, text messages (including via autodialer or
                            prerecorded message){answers.phone && " at the number I provided"}, and email, regarding
                            health insurance options. Consent is not required to purchase any product or service.
                            Message and data rates may apply. Reply STOP to opt out. I agree to the{" "}
                            <a href="/terms" target="_blank" className="text-[#D4AF37] underline hover:text-[#E8C976]">
                              Terms of Service
                            </a>{" "}
                            and{" "}
                            <a href="/privacy" target="_blank" className="text-[#D4AF37] underline hover:text-[#E8C976]">
                              Privacy Policy
                            </a>
                            .
                          </label>
                        </div>
                        {errors.tcpaConsent && <p className="text-sm text-red-500 pl-7">{errors.tcpaConsent}</p>}

                        {/* Additional Disclosures */}
                        <Card className="p-4 bg-muted/50 border-muted-foreground/20">
                          <div className="space-y-3 text-xs text-muted-foreground">
                            <p>
                              <strong className="text-foreground">Recording Notice:</strong> Calls may be monitored or
                              recorded for quality assurance and training purposes.
                            </p>
                            <p>
                              <strong className="text-foreground">Opt-Out:</strong> To opt-out of communications, reply
                              STOP to text messages, use unsubscribe links in emails, or contact us at
                              support@dynastyinsurancegroup.com.
                            </p>
                            <p>
                              <strong className="text-foreground">No Guarantee:</strong> Submitting this form does not
                              guarantee coverage or specific rates. All quotes are estimates subject to underwriting
                              approval and income verification.
                            </p>
                          </div>
                        </Card>
                      </div>

                      <Button
                        onClick={handleContactSubmit}
                        className="w-full h-14 text-lg font-semibold bg-[#D4AF37] text-[#0A1128] hover:bg-[#c9a430] active:bg-[#b89228]"
                      >
                        Yes, Show Me What I Qualify For
                      </Button>

                      <p className="text-xs text-center text-muted-foreground">
                        No pressure. No spam. Just real information to help you make the best choice.
                      </p>
                    </div>
                  </div>
                )}

                {currentStep === 8 && (
                  <div className="space-y-8">
                    <div className="text-center space-y-4">
                      <h2 className="text-3xl md:text-4xl font-bold text-foreground">What is your name?</h2>
                      <p className="text-muted-foreground">We'll personalize your healthcare options</p>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">First Name</label>
                          <Input
                            type="text"
                            placeholder="John"
                            value={answers.firstName || ""}
                            onChange={(e) => updateAnswer("firstName", e.target.value)}
                            className={`h-12 ${errors.firstName ? "border-red-500" : ""}`}
                          />
                          {errors.firstName && <p className="text-sm text-red-500">{errors.firstName}</p>}
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Last Name</label>
                          <Input
                            type="text"
                            placeholder="Doe"
                            value={answers.lastName || ""}
                            onChange={(e) => updateAnswer("lastName", e.target.value)}
                            className={`h-12 ${errors.lastName ? "border-red-500" : ""}`}
                          />
                          {errors.lastName && <p className="text-sm text-red-500">{errors.lastName}</p>}
                        </div>
                      </div>

                      <Card className="p-4 bg-muted/50">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            id="tcpaConsent"
                            checked={answers.tcpaConsent || false}
                            onChange={(e) => updateAnswer("tcpaConsent", e.target.checked)}
                            className="mt-1 w-5 h-5 rounded border-gray-300 flex-shrink-0"
                          />
                          <label htmlFor="tcpaConsent" className="text-sm text-muted-foreground leading-relaxed">
                            I agree to receive my personalized healthcare rates. If I provided a phone number, I consent
                            to be contacted by licensed insurance agents via phone, email, or text. I understand I can
                            opt out anytime by replying STOP.
                          </label>
                        </div>
                        {errors.tcpaConsent && <p className="text-sm text-red-500 mt-2">{errors.tcpaConsent}</p>}
                      </Card>

                      {submitError && (
                        <div className="text-sm text-red-500 bg-red-50 p-3 rounded-lg mt-4">
                          {submitError}
                        </div>
                      )}

                      <Button
                        onClick={() => {
                          if (!answers.tcpaConsent) {
                            setErrors({ tcpaConsent: "Please consent to receive your rates" })
                            return
                          }
                          handleNameSubmit()
                        }}
                        disabled={isSubmitting}
                        className="w-full h-12 bg-[#D4AF37] text-[#0A1128] hover:bg-[#D4AF37]/90 mt-6 disabled:opacity-50"
                      >
                        {isSubmitting ? "Submitting..." : "Get My Healthcare Rates"}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <Footer />
    </div>
  )
}
