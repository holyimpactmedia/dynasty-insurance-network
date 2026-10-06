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
  Heart,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Award,
  Lock,
  Users,
  AlertCircle,
  DollarSign,
  FileText,
  Stethoscope,
  Baby,
  Briefcase,
  Home,
  XCircle,
  Activity,
  Smile,
  Zap,
  Globe,
  Pill,
  ArrowRight,
  X,
} from "lucide-react"

import { SERVICED_STATES } from "@/lib/serviced-states"
import { INDIVIDUAL_INCOME_BRACKETS } from "@/lib/income-thresholds"
const INDIV_COVERAGE_ITEMS = [
  { icon: <Stethoscope className="w-5 h-5" />, label: "Provider Choice", desc: "See a broad range of physicians and specialists, often without a referral" },
  { icon: <Globe className="w-5 h-5" />, label: "PPO Network", desc: "Access to a PPO network of hospitals and physicians" },
  { icon: <Activity className="w-5 h-5" />, label: "Emergency Care", desc: "Emergency room coverage when you need it" },
  { icon: <Pill className="w-5 h-5" />, label: "Prescriptions", desc: "Broad prescription drug formularies" },
  { icon: <Smile className="w-5 h-5" />, label: "Dental & Vision", desc: "Dental and vision plan options available" },
  { icon: <Zap className="w-5 h-5" />, label: "Telemedicine", desc: "Virtual visits, not available with every plan or in every state" },
]

const INDIV_PROBLEMS = [
  "Your premiums may keep climbing while your plan covers less",
  "Narrow networks can require referrals just to see a specialist",
  "The doctors and hospitals you want may not be in your network",
  "Deductibles can be high enough that you pay out-of-pocket for most care",
  "If you travel or work across state lines, a regional plan may not go with you",
  "You may be paying for benefits you do not use",
]

const INDIV_ADVANTAGES = [
  "Private health coverage for adults who want real choice",
  "You may be able to keep your doctors and see specialists, often without a referral",
  "Access to a PPO network, depending on availability in your state",
  "PPO network coverage at participating hospitals and physicians",
  "Plan options that may offer broader network access, depending on the plan",
  "A licensed insurance agent who conducts a needs analysis of your options",
]

const INCOME_RANGES = INDIVIDUAL_INCOME_BRACKETS

const US_STATES = SERVICED_STATES

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

  // Exit intent - desktop, one-shot per session, post-landing only.
  useEffect(() => {
    if (showThankYou) return
    if (currentStep <= 0 || currentStep >= 8) return
    if (typeof window === "undefined") return

    const SESSION_KEY = "exitIntentShown_individual"
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

    if (!answers.email || !validateEmail(answers.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!answers.phone) {
      newErrors.phone = "Phone number is required"
    } else if (!validatePhone(answers.phone)) {
      newErrors.phone = "Please enter a valid 10-digit phone number"
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
          quizAnswers: {
            healthScreen: answers.healthScreen,
            govCoverage: answers.govCoverage,
          },
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
        headline="You're 60 seconds from your coverage options. Don't walk away."
      />

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
                          A licensed agent is reviewing your profile right now. They will reach out
                          within 5 minutes with private health coverage options built for your situation.
                        </p>
                      </div>
                    </div>

                    {/* Plan Options Ready */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Card className="p-8 bg-gradient-to-br from-[#0A1128] to-[#1a2547] text-white shadow-xl border border-[#D4AF37]/30">
                        <div className="text-center space-y-4">
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/20 rounded-full text-sm font-medium text-[#D4AF37]">
                            <Award className="w-4 h-4" />
                            Your Private Coverage Options Are Ready
                          </div>
                          <p className="text-lg leading-relaxed">
                            Your licensed agent is curating private health coverage options tailored to your coverage needs, preferred
                            physicians, and lifestyle, with network details explained.
                          </p>
                          <p className="text-xs opacity-80">
                            A licensed agent will walk you through your options on your call.
                          </p>
                        </div>
                      </Card>
                    </motion.div>

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
                                  <h3 className="font-semibold text-foreground">Within 5 Minutes</h3>
                                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                                    In Progress
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  A licensed insurance agent will review your application and prepare personalized
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
                                    <p className="font-medium text-blue-900">📱 Watch for our call</p>
                                    <p className="text-blue-700">
                                      Your licensed agent will call from a US number within 5 minutes. Answer the phone or save the call to keep your spot in line.
                                    </p>
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
                                  Complete a simple enrollment form. Your licensed agent explains when coverage can begin.
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
                                Side-by-side comparison of your available plan options
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
                              Start dates vary by plan and carrier. Your licensed agent explains when coverage can begin.
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
                              <span>How is your licensed agent compensated?</span>
                            </h4>
                            <p className="text-sm text-muted-foreground pl-6">
                              Your licensed agent is paid by our licensed insurance partners, never by you. Premiums are
                              identical whether you work with us or not, you simply gain a private advisor.
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
                            <p className="text-blue-700 text-xs">
                              Final premium rates are confirmed during your consultation with a licensed insurance agent. Holy Impact Media
                              may be compensated by its licensed insurance partners for referrals. See our{" "}
                              <a href="/terms" className="underline">Terms</a> and{" "}
                              <a href="/privacy" className="underline">Privacy Policy</a> for details.
                            </p>
                          </div>
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
                    <section className="relative text-white py-16 px-6 overflow-hidden">
                      <img src="/images/heroes/individual.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" aria-hidden="true" />
                      <div className="absolute inset-0 bg-gradient-to-br from-[#0A1128]/95 via-[#0A1128]/85 to-[#0A1128]/95" aria-hidden="true" />
                      <div className="relative max-w-3xl mx-auto text-center space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/20 rounded-full text-[#D4AF37] text-sm font-semibold">
                          <Award className="w-4 h-4" />
                          Licensed Independent Insurance Agents
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold leading-tight text-balance">
                          Private Health Coverage Built for <span className="text-[#D4AF37]">Working Adults</span>
                        </h1>
                        <p className="text-lg text-gray-300 max-w-xl mx-auto">
                          Private health coverage that can access a PPO network, with the doctors you trust and the freedom to often skip referrals, built for working adults who travel and work hard.
                        </p>
                        <div className="space-y-3 text-left max-w-xl mx-auto">
                          {[
                            "Premiums that may climb year after year on a plan that covers less.",
                            "Narrow networks that can require a referral just to see a specialist.",
                            "Deductibles that can be high enough to leave you paying out-of-pocket for most care.",
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
                        <p className="text-gray-400 text-xs">90 seconds. No cost. Real licensed agents.</p>
                      </div>
                    </section>

                    {/* Stats Bar */}
                    <section className="bg-[#D4AF37] py-5 px-6">
                      <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {[
                          { icon: <Globe className="w-4 h-4 flex-shrink-0" />, text: "PPO network access" },
                          { icon: <Stethoscope className="w-4 h-4 flex-shrink-0" />, text: "Often no referrals" },
                          { icon: <Shield className="w-4 h-4 flex-shrink-0" />, text: "You may keep your doctors" },
                          { icon: <DollarSign className="w-4 h-4 flex-shrink-0" />, text: "Free licensed agent consultation" },
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
                            Many Plans Look Good on Paper. Then You Try to Use Them.
                          </h2>
                          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                            Narrow networks. Mandatory referrals. Deductibles you may never hit. Many people do not realize
                            how limited their coverage is until they need it most. Private health coverage can help with many of these issues.
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
                                  <h3 className="font-bold text-foreground">What Many People Face</h3>
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
                                  <h3 className="font-bold text-foreground">Private Health Coverage, Done Right</h3>
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
                            These benefits may be available depending on the plan you choose.
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
                              desc: "A licensed agent calls you within 5 minutes with private health coverage options that fit your life.",
                            },
                            {
                              step: "3",
                              title: "Pick and Enroll",
                              desc: "Choose the plan you want and enroll. Your licensed agent explains when coverage can begin.",
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
                            Dynasty Insurance Group is a team of licensed insurance agents. We do not sell you a plan.
                            We help you find the right one. We look at your doctors, your budget, and your life. Then
                            we show you what may fit.
                          </p>
                          <p className="text-gray-300 leading-relaxed">
                            No pressure. No hidden fees. Just coverage that works
                            the way it should.
                          </p>
                        </div>
                        <div className="space-y-4">
                          {[
                            { icon: <Shield className="w-5 h-5" />, title: "Licensed in Your State", desc: "Every agent we work with is state-licensed and compliant." },
                            { icon: <DollarSign className="w-5 h-5" />, title: "100% Free to You", desc: "Our service costs you nothing. We are paid by our licensed insurance partners." },
                            { icon: <Clock className="w-5 h-5" />, title: "5-Minute Response", desc: "A licensed agent contacts you within 5 minutes on business days." },
                            { icon: <Lock className="w-5 h-5" />, title: "Your Data Is Protected", desc: "Your information is shared with our licensed insurance partners so they can contact you about coverage options." },
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
                          90 seconds. Free. No obligation. A real licensed agent calls you.
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
                          Dynasty Insurance Group specializes in private health coverage solutions.
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
                        { label: "Lost job coverage", icon: Briefcase, desc: "Your workplace coverage ended" },
                        { label: "Moving states", icon: Home, desc: "Relocated to a new area" },
                        { label: "Having a baby", icon: Baby, desc: "New addition to the family" },
                        { label: "Shopping for coverage", icon: Calendar, desc: "Comparing your options" },
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
                      <h2 className="text-3xl md:text-4xl font-bold text-foreground">A Couple Quick Qualifying Questions</h2>
                      <p className="text-muted-foreground">This makes sure we route you to the right licensed agent</p>
                    </div>

                    <div className="space-y-6 max-w-md mx-auto">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">Your age</label>
                        <Input
                          type="number"
                          placeholder="Enter your age"
                          value={answers.age || ""}
                          onChange={(e) => {
                            const age = Number.parseInt(e.target.value)
                            updateAnswer("age", e.target.value)
                            if (age >= 64) {
                              setErrors({
                                ...errors,
                                age: "At 64+, you may qualify for Medicare options. Our private health coverage is designed for adults under 65. We can refer you to a licensed Medicare agent.",
                              })
                            } else {
                              setErrors({ ...errors, age: "" })
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
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">
                          In the last 5 years, have you been treated for cancer, diabetes, heart disease, or any other significant condition?
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
                            <div className="flex items-start gap-3">
                              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-amber-700">
                                Our private health coverage is designed for adults under 65. With a significant medical history, a guaranteed-issue plan may be a better fit. A licensed agent can review your options with you.
                              </p>
                            </div>
                          </Card>
                        )}
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-foreground">
                          Are you currently enrolled in Medicaid or Medicare?
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
                            <div className="flex items-start gap-3">
                              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-blue-700">
                                Our private health coverage is designed for adults not currently enrolled in Medicaid or Medicare. A licensed agent can review your options with you on your call.
                              </p>
                            </div>
                          </Card>
                        )}
                      </div>

                      <Button
                        onClick={() => {
                          const age = Number.parseInt(answers.age)
                          if (age >= 18 && age <= 63 && answers.healthScreen && answers.govCoverage) {
                            nextStep()
                          } else if (!age) {
                            setErrors({ ...errors, age: "Please enter your age" })
                          }
                        }}
                        disabled={
                          !answers.age ||
                          Number.parseInt(answers.age) >= 64 ||
                          Number.parseInt(answers.age) < 18 ||
                          !answers.healthScreen ||
                          !answers.govCoverage
                        }
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
                        What is your household income tier?
                      </p>
                      <Card className="p-4 bg-yellow-50 border-yellow-300 max-w-md mx-auto">
                        <p className="text-sm text-foreground font-medium">
                          This helps your licensed agent match you to the right coverage tier and service level.
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Best estimate is fine. Your licensed agent will walk you through the details on your call.
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
                          label: "Access to top specialists & hospitals",
                          icon: Stethoscope,
                          desc: "PPO network access and concierge-tier facilities",
                        },
                        {
                          label: "Strong benefits coverage",
                          icon: Shield,
                          desc: "Plans with a robust set of benefits",
                        },
                        {
                          label: "Coverage that travels with me",
                          icon: Globe,
                          desc: "PPO network access at participating hospitals and physicians",
                        },
                        {
                          label: "Prescription coverage",
                          icon: FileText,
                          desc: "Broad prescription drug formularies",
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
                        We'll connect you with a licensed agent who knows your plan options inside and out
                      </p>
                      <div className="flex items-center justify-center gap-2 text-sm text-green-600 font-medium">
                        <Lock className="w-4 h-4" />
                        <span>Secure & Private - Shared Only With Our Licensed Insurance Partners</span>
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
                          Phone Number <span className="text-red-500">*</span>
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
                            <strong className="text-foreground">Consent to Contact (Required):</strong> By checking this box and submitting this form, I provide my electronic signature through which I expressly consent to be contacted by Holy Impact Media and its licensed insurance partners, including licensed insurance agents affiliated with Dynasty Insurance Group and USHEALTH Advisors, LLC, at the telephone number I have provided and that such contact shall be made via telephone calls, text messages (including via automated telephone dialing systems or artificial / prerecorded voice message), and email regarding health coverage options. I understand this website is operated by Holy Impact Media, a marketing company, which will route my information to licensed insurance agents. Consent is not required to purchase any goods or services and may be revoked at any time. Reply STOP to opt out of SMS. I also consent under any applicable state telemarketing laws, including the Florida Telephone Solicitation Act. Message and data rates may apply. Message frequency varies. I further agree to the{" "}
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

                      {submitError && (
                        <div className="text-sm text-red-500 bg-red-50 p-3 rounded-lg mt-4">
                          {submitError}
                        </div>
                      )}

                      <Button
                        onClick={handleNameSubmit}
                        disabled={isSubmitting}
                        className="w-full h-12 bg-[#D4AF37] text-[#0A1128] hover:bg-[#D4AF37]/90 mt-6 disabled:opacity-50"
                      >
                        {isSubmitting ? "Submitting..." : "Match Me With a Licensed Agent"}
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        Your licensed agent will walk you through real plan options on your call. Final premiums are quoted
                        by the carrier.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {(currentStep === 0 || showThankYou) && <Footer />}
    </div>
  )
}
