"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Footer } from "@/components/Footer"
import {
  CheckCircle2,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Shield,
  ChevronRight,
  Star,
  Phone,
  Mail,
  MapPin,
} from "lucide-react"

export default function AgentRecruitingPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    state: "",
    experience: "",
    licensed: "",
    reason: "",
    income: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null)

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const nextStep = () => {
    if (currentStep < 7) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1)
  }

  const submitApplication = async (incomeGoal: string) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const response = await fetch('/api/agent-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          licensedStates: [formData.state],
          licenseStatus: formData.licensed,
          experienceLevel: formData.experience,
          whyJoining: [formData.reason],
          incomeGoal: incomeGoal,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit application')
      }

      setReferenceNumber(data.referenceNumber)
      setCurrentStep(8)
    } catch (error) {
      console.error('Error submitting application:', error)
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Landing Page (Step 0)
  if (currentStep === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0A1128] via-[#1e3a8a] to-[#0A1128]">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <img src="/images/logo.avif" alt="Dynasty" className="h-12" />
            <div className="flex gap-4">
              <Button variant="outline" className="hidden md:flex bg-transparent">
                <Phone className="w-4 h-4 mr-2" />
                (888) 555-0123
              </Button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="pt-20 pb-32 px-6">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Badge className="mb-6 bg-gradient-to-r from-[#D4AF37] to-[#E8C976] text-[#0A1128] px-6 py-2 text-sm font-semibold">
                NOW HIRING: Licensed Insurance Agents
              </Badge>

              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                Stop Chasing Leads.
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#E8C976]">
                  Start Closing Them.
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto leading-relaxed">
                Join Dynasty and receive{" "}
                <span className="text-[#D4AF37] font-semibold">exclusive, high-quality healthcare leads</span> delivered
                to your phone within seconds. No more cold calling. No more buying junk leads.
              </p>

              <p className="text-lg text-gray-400 mb-10">
                Our top agents average $12,500/month with{" "}
                <span className="text-white font-semibold">80%+ contact rates</span>
              </p>

              <Button
                onClick={() => setCurrentStep(1)}
                size="lg"
                className="bg-gradient-to-r from-[#D4AF37] to-[#E8C976] hover:from-[#E8C976] hover:to-[#D4AF37] text-[#0A1128] font-bold text-lg px-12 py-6 h-auto rounded-full shadow-2xl transform hover:scale-105 transition-all"
              >
                Apply to Join Dynasty
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>

              <p className="text-sm text-gray-400 mt-4">
                Takes 2 minutes · No credit card required · Immediate response
              </p>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-white/5 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: "$8.2M", label: "Paid to Agents in 2025", icon: DollarSign },
                { value: "127", label: "Active Producing Agents", icon: Users },
                { value: "85%", label: "Average Contact Rate", icon: TrendingUp },
                { value: "<3 min", label: "Lead Response Time", icon: Clock },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <stat.icon className="w-12 h-12 mx-auto mb-4 text-[#D4AF37]" />
                  <div className="text-4xl font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-4">Why Dynasty Agents Earn More</h2>
            <p className="text-xl text-gray-400 text-center mb-16 max-w-3xl mx-auto">
              We provide everything you need to succeed: exclusive leads, advanced training, and a proven system
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "Exclusive Healthcare Leads",
                  description:
                    "Pre-qualified ACA leads sent directly to your phone. TCPA compliant. No competition. 80%+ answer rate.",
                  icon: Phone,
                  highlight: "Top Benefit",
                },
                {
                  title: "Performance-Based Tiers",
                  description:
                    "Our top performers (Tier 1) get first access to the highest quality leads. Earn your way to the top.",
                  icon: TrendingUp,
                  highlight: "Fair System",
                },
                {
                  title: "Weekly Training & Support",
                  description: "Live enrollment training, objection handling, and CRM support. Never feel alone.",
                  icon: Users,
                  highlight: "Full Support",
                },
                {
                  title: "Real-Time Lead Delivery",
                  description: "Leads hit your phone within 30 seconds of submission. Strike while the iron is hot.",
                  icon: Clock,
                  highlight: "Speed Wins",
                },
                {
                  title: "Residual Income Opportunity",
                  description: "Build a book of business with renewal commissions. Earn while you sleep.",
                  icon: DollarSign,
                  highlight: "Long-Term",
                },
                {
                  title: "Full Compliance & Protection",
                  description: "E&O insurance included. TCPA compliant leads. State license support.",
                  icon: Shield,
                  highlight: "Protected",
                },
              ].map((benefit, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="p-8 bg-white/5 backdrop-blur-sm border-white/10 hover:border-[#D4AF37]/50 transition-all h-full">
                    <Badge className="mb-4 bg-[#D4AF37]/20 text-[#E8C976] border-[#D4AF37]">{benefit.highlight}</Badge>
                    <benefit.icon className="w-12 h-12 text-[#D4AF37] mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-3">{benefit.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{benefit.description}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Income Potential Section */}
        <section className="py-20 px-6 bg-white/5 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-4">Real Income From Real Agents</h2>
            <p className="text-xl text-gray-400 text-center mb-16">
              These are actual results from agents in the Dynasty system*
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {[
                {
                  name: "Sarah Johnson",
                  tier: "Tier 1",
                  time: "8 months",
                  leads: "47/month",
                  income: "$12,800/month",
                  quote:
                    "I was buying leads for $125 each and getting 30% contact rates. With Dynasty, I get exclusive leads and 92% contact. Game changer.",
                },
                {
                  name: "Michael Chen",
                  tier: "Tier 1",
                  time: "11 months",
                  leads: "52/month",
                  income: "$14,200/month",
                  quote:
                    "The tier system motivated me to improve. Now I am top performer and get first dibs on the best leads.",
                },
                {
                  name: "Jessica Rodriguez",
                  tier: "Tier 2",
                  time: "4 months",
                  leads: "34/month",
                  income: "$6,400/month",
                  quote:
                    "I am new to insurance and Dynasty gave me everything I needed: leads, training, and support. Making more than my teaching job.",
                },
              ].map((agent, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15 }}
                >
                  <Card className="p-8 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border-white/10 h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#E8C976] flex items-center justify-center text-[#0A1128] font-bold text-xl">
                        {agent.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <div className="font-bold text-white">{agent.name}</div>
                        <div className="text-sm text-gray-400">
                          {agent.tier} · {agent.time}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
                      ))}
                    </div>
                    <p className="text-gray-300 italic mb-6 leading-relaxed">&ldquo;{agent.quote}&rdquo;</p>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                      <div>
                        <div className="text-sm text-gray-400">Leads/Month</div>
                        <div className="text-lg font-bold text-white">{agent.leads}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Income</div>
                        <div className="text-lg font-bold text-[#D4AF37]">{agent.income}</div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            <p className="text-sm text-gray-500 text-center">
              *Income results vary by agent performance, hours worked, and close rates. Past results do not guarantee
              future earnings. Average agent income: $6,200/month (2025). Individual results may be higher or lower
              based on skill, effort, and market conditions. All agents are independent contractors responsible for
              their own taxes.
            </p>
          </div>
        </section>

        {/* Tier System Section */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-4">The Dynasty Tier System</h2>
            <p className="text-xl text-gray-400 text-center mb-16 max-w-3xl mx-auto">
              Fair, transparent, and performance-based. Top performers get rewarded with first access to premium leads.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  tier: "Tier 3",
                  badge: "Learning & Developing",
                  color: "from-gray-500 to-gray-600",
                  requirements: "New agents or below Tier 2 thresholds",
                  benefits: [
                    "20-30 leads/month",
                    "Standard lead quality",
                    "Full training access",
                    "Weekly coaching calls",
                  ],
                  avgIncome: "$3,500/month",
                },
                {
                  tier: "Tier 2",
                  badge: "Solid Performers",
                  color: "from-blue-500 to-blue-600",
                  requirements: "70%+ contact rate, 12%+ close rate",
                  benefits: ["30-45 leads/month", "Higher quality leads", "Priority support", "Advanced training"],
                  avgIncome: "$6,800/month",
                },
                {
                  tier: "Tier 1",
                  badge: "Top Performers",
                  color: "from-[#D4AF37] to-[#E8C976]",
                  requirements: "85%+ contact rate, 18%+ close rate",
                  benefits: ["45-60 leads/month", "Premium exclusive leads", "VIP support", "Leadership opportunities"],
                  avgIncome: "$12,500/month",
                  featured: true,
                },
              ].map((tierInfo, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card
                    className={`p-8 ${tierInfo.featured ? "ring-2 ring-[#D4AF37] scale-105" : ""} bg-white/5 backdrop-blur-sm border-white/10 h-full relative`}
                  >
                    {tierInfo.featured && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#D4AF37] to-[#E8C976] text-[#0A1128] font-bold">
                        Most Popular
                      </Badge>
                    )}
                    <div
                      className={`inline-block px-4 py-1 rounded-full bg-gradient-to-r ${tierInfo.color} text-white text-sm font-bold mb-4`}
                    >
                      {tierInfo.badge}
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-2">{tierInfo.tier}</h3>
                    <p className="text-gray-400 mb-6">{tierInfo.requirements}</p>
                    <div className="space-y-3 mb-6">
                      {tierInfo.benefits.map((benefit, j) => (
                        <div key={j} className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                          <span className="text-gray-300">{benefit}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-6 border-t border-white/10">
                      <div className="text-sm text-gray-400">Average Income</div>
                      <div className="text-2xl font-bold text-[#D4AF37]">{tierInfo.avgIncome}</div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-12">
              <p className="text-gray-400 mb-6">
                Start at any tier and work your way up. Tiers are evaluated weekly based on performance.
              </p>
              <Button
                onClick={() => setCurrentStep(1)}
                size="lg"
                className="bg-gradient-to-r from-[#D4AF37] to-[#E8C976] hover:from-[#E8C976] hover:to-[#D4AF37] text-[#0A1128] font-bold text-lg px-12 py-6 h-auto rounded-full"
              >
                Start Your Application
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 px-6 bg-white/5 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-center text-white mb-12">Frequently Asked Questions</h2>

            <div className="space-y-6">
              {[
                {
                  q: "Do I need to be licensed?",
                  a: "Yes, you must have an active health/life insurance license in at least one state. We provide licensing support if you need to expand to additional states.",
                },
                {
                  q: "How much does it cost to join?",
                  a: "Zero. There are no upfront fees, monthly fees, or lead costs. Dynasty covers all lead generation expenses. You keep 100% of your commissions.",
                },
                {
                  q: "Do I need insurance experience?",
                  a: "Not required, but helpful. We provide comprehensive training for new agents. Our top performers include former teachers, real estate agents, and career changers.",
                },
                {
                  q: "How are leads delivered?",
                  a: "Leads are sent via SMS to your phone within 30 seconds of submission. You also get email notification and CRM access with full lead details.",
                },
                {
                  q: "What if I miss the 10-minute contact window?",
                  a: "The lead stays assigned to you, but it counts against your contact rate. Consistently missing the window affects your tier placement.",
                },
                {
                  q: "Can I work part-time?",
                  a: "Yes, many agents start part-time. You set your own schedule and availability. Part-time agents typically receive 15-25 leads/month based on tier.",
                },
                {
                  q: "What carriers do you work with?",
                  a: "We are contracted with all major ACA marketplace carriers, plus supplemental products. You will receive full contracting support upon acceptance.",
                },
              ].map((faq, i) => (
                <Card key={i} className="p-6 bg-white/5 backdrop-blur-sm border-white/10">
                  <h3 className="text-lg font-bold text-white mb-2">{faq.q}</h3>
                  <p className="text-gray-400">{faq.a}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Stop Chasing and Start Closing?</h2>
            <p className="text-xl text-gray-400 mb-10">
              Join 127 agents who are earning more with exclusive leads and proven support
            </p>
            <Button
              onClick={() => setCurrentStep(1)}
              size="lg"
              className="bg-gradient-to-r from-[#D4AF37] to-[#E8C976] hover:from-[#E8C976] hover:to-[#D4AF37] text-[#0A1128] font-bold text-lg px-12 py-6 h-auto rounded-full shadow-2xl"
            >
              Apply Now - Takes 2 Minutes
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-sm text-gray-400 mt-4">
              Applications reviewed within 24 hours · Start receiving leads within 48 hours of approval
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-[#0A1128] border-t border-white/10 py-12 px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <img src="/images/logo.avif" alt="Dynasty Insurance Group" className="h-10 mb-4" />
              <p className="text-gray-400 text-sm">
                Dynasty Insurance Group provides exclusive healthcare leads to licensed insurance agents nationwide.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">Contact</h3>
              <div className="space-y-3 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  (888) 555-0123
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  recruiting@dynasty.com
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Licensed in all 50 states
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">Legal</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <div>Privacy Policy</div>
                <div>Terms of Service</div>
                <div>Income Disclosure</div>
                <div>Licensing Info</div>
              </div>
            </div>
          </div>
          <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-white/10 text-center text-sm text-gray-500">
            © 2026 Dynasty Insurance Group. All rights reserved. Licensed insurance agents.
          </div>
        </footer>
      </div>
    )
  }

  // Multi-step application form (Steps 1-7)
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A1128] via-[#1e3a8a] to-[#0A1128] py-12 px-6">
      {/* Header */}
      <header className="max-w-4xl mx-auto mb-12">
        <img src="/images/logo.avif" alt="Dynasty Insurance Group" className="h-10 mx-auto mb-8" />
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={prevStep} className="text-white hover:text-[#D4AF37]">
            ← Back
          </Button>
          <div className="text-sm text-gray-400">Step {currentStep} of 7</div>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#D4AF37] to-[#E8C976] transition-all duration-300"
            style={{ width: `${(currentStep / 7) * 100}%` }}
          />
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="max-w-2xl mx-auto"
        >
          <Card className="p-8 md:p-12 bg-white/5 backdrop-blur-sm border-white/10">
            {/* Step 1: Name */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">What's your name?</h2>
                  <p className="text-gray-400">Let's get started with the basics</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white mb-2">First Name</Label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => updateField("firstName", e.target.value)}
                      placeholder="John"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 h-12"
                    />
                  </div>
                  <div>
                    <Label className="text-white mb-2">Last Name</Label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => updateField("lastName", e.target.value)}
                      placeholder="Smith"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 h-12"
                    />
                  </div>
                </div>

                <Button
                  onClick={nextStep}
                  disabled={!formData.firstName || !formData.lastName}
                  className="w-full bg-gradient-to-r from-[#D4AF37] to-[#E8C976] hover:from-[#E8C976] hover:to-[#D4AF37] text-[#0A1128] font-bold h-12"
                >
                  Continue
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            )}

            {/* Step 2: Contact */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">How can we reach you?</h2>
                  <p className="text-gray-400">We'll send your application status here</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-white mb-2">Email Address</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      placeholder="john@example.com"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 h-12"
                    />
                  </div>
                  <div>
                    <Label className="text-white mb-2">Phone Number</Label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      placeholder="(555) 123-4567"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 h-12"
                    />
                  </div>
                </div>

                <Button
                  onClick={nextStep}
                  disabled={!formData.email || !formData.phone}
                  className="w-full bg-gradient-to-r from-[#D4AF37] to-[#E8C976] hover:from-[#E8C976] hover:to-[#D4AF37] text-[#0A1128] font-bold h-12"
                >
                  Continue
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            )}

            {/* Step 3: State */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">Which state are you licensed in?</h2>
                  <p className="text-gray-400">Select your primary license state</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {["FL", "TX", "CA", "GA", "NC", "AZ", "TN", "SC", "AL", "Other"].map((state) => (
                    <Button
                      key={state}
                      onClick={() => {
                        updateField("state", state)
                        setTimeout(nextStep, 300)
                      }}
                      variant={formData.state === state ? "default" : "outline"}
                      className={`h-14 ${
                        formData.state === state
                          ? "bg-gradient-to-r from-[#D4AF37] to-[#E8C976] text-[#0A1128] border-none"
                          : "bg-white/5 border-white/20 text-white hover:bg-white/10"
                      }`}
                    >
                      {state}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Experience */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">Insurance sales experience?</h2>
                  <p className="text-gray-400">Honest answer: we train all levels</p>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      value: "none",
                      label: "Brand New - Just Got Licensed",
                      desc: "Perfect! We love training new agents",
                    },
                    { value: "1year", label: "Less Than 1 Year", desc: "Great foundation to build on" },
                    { value: "1-3years", label: "1-3 Years", desc: "Solid experience level" },
                    { value: "3+years", label: "3+ Years", desc: "Experienced pro" },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      onClick={() => {
                        updateField("experience", option.value)
                        setTimeout(nextStep, 300)
                      }}
                      variant="outline"
                      className={`w-full h-auto py-4 px-6 text-left justify-start ${
                        formData.experience === option.value
                          ? "bg-gradient-to-r from-[#D4AF37]/20 to-[#E8C976]/20 border-[#D4AF37] text-white"
                          : "bg-white/5 border-white/20 text-white hover:bg-white/10"
                      }`}
                    >
                      <div>
                        <div className="font-bold mb-1">{option.label}</div>
                        <div className="text-sm text-gray-400">{option.desc}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Licensed */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">Current license status?</h2>
                  <p className="text-gray-400">We need active licenses to provide leads</p>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      value: "active",
                      label: "Active & Current",
                      desc: "Ready to receive leads immediately",
                      icon: CheckCircle2,
                      color: "text-green-400",
                    },
                    {
                      value: "pending",
                      label: "Pending Approval",
                      desc: "Applied but waiting for state approval",
                      icon: Clock,
                      color: "text-yellow-400",
                    },
                    {
                      value: "expired",
                      label: "Expired - Need Renewal",
                      desc: "We can help with renewal process",
                      icon: Shield,
                      color: "text-orange-400",
                    },
                    {
                      value: "none",
                      label: "Not Yet Licensed",
                      desc: "We provide licensing guidance",
                      icon: Users,
                      color: "text-blue-400",
                    },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      onClick={() => {
                        updateField("licensed", option.value)
                        setTimeout(nextStep, 300)
                      }}
                      variant="outline"
                      className={`w-full h-auto py-4 px-6 text-left justify-start ${
                        formData.licensed === option.value
                          ? "bg-gradient-to-r from-[#D4AF37]/20 to-[#E8C976]/20 border-[#D4AF37] text-white"
                          : "bg-white/5 border-white/20 text-white hover:bg-white/10"
                      }`}
                    >
                      <option.icon className={`w-6 h-6 mr-4 ${option.color}`} />
                      <div>
                        <div className="font-bold mb-1">{option.label}</div>
                        <div className="text-sm text-gray-400">{option.desc}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 6: Reason */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">Why join Dynasty?</h2>
                  <p className="text-gray-400">What matters most to you?</p>
                </div>

                <div className="space-y-3">
                  {[
                    { value: "leads", label: "Need Quality Leads", desc: "Tired of buying junk leads or cold calling" },
                    { value: "income", label: "Increase Income", desc: "Want to earn more than current situation" },
                    { value: "training", label: "Training & Support", desc: "Need help getting to the next level" },
                    { value: "flexibility", label: "Flexible Schedule", desc: "Work part-time or set own hours" },
                    { value: "system", label: "Proven System", desc: "Want a system that actually works" },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      onClick={() => {
                        updateField("reason", option.value)
                        setTimeout(nextStep, 300)
                      }}
                      variant="outline"
                      className={`w-full h-auto py-4 px-6 text-left justify-start ${
                        formData.reason === option.value
                          ? "bg-gradient-to-r from-[#D4AF37]/20 to-[#E8C976]/20 border-[#D4AF37] text-white"
                          : "bg-white/5 border-white/20 text-white hover:bg-white/10"
                      }`}
                    >
                      <div>
                        <div className="font-bold mb-1">{option.label}</div>
                        <div className="text-sm text-gray-400">{option.desc}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 7: Income Goal */}
            {currentStep === 7 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">Income goal for 2026?</h2>
                  <p className="text-gray-400">Be ambitious. Our top agents earn $150K+</p>
                </div>

                {submitError && (
                  <div className="text-sm text-red-400 bg-red-900/30 p-3 rounded-lg border border-red-500/30">
                    {submitError}
                  </div>
                )}

                <div className="space-y-3">
                  {[
                    { value: "50k", label: "$50,000/year", desc: "$4,200/month - Part-time pace" },
                    { value: "75k", label: "$75,000/year", desc: "$6,250/month - Strong part-time" },
                    { value: "100k", label: "$100,000/year", desc: "$8,300/month - Full-time goal" },
                    { value: "150k", label: "$150,000/year", desc: "$12,500/month - Top performer" },
                    { value: "200k+", label: "$200,000+/year", desc: "$16,600+/month - Elite earner" },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      onClick={() => {
                        updateField("income", option.value)
                        submitApplication(option.value)
                      }}
                      disabled={isSubmitting}
                      variant="outline"
                      className={`w-full h-auto py-4 px-6 text-left justify-start ${
                        formData.income === option.value
                          ? "bg-gradient-to-r from-[#D4AF37]/20 to-[#E8C976]/20 border-[#D4AF37] text-white"
                          : "bg-white/5 border-white/20 text-white hover:bg-white/10"
                      } disabled:opacity-50`}
                    >
                      <div>
                        <div className="font-bold mb-1">{isSubmitting && formData.income === option.value ? "Submitting..." : option.label}</div>
                        <div className="text-sm text-gray-400">{option.desc}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Thank You Page */}
      {currentStep === 8 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-3xl mx-auto"
        >
          <Card className="p-12 bg-white/5 backdrop-blur-sm border-white/10 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#E8C976] flex items-center justify-center"
            >
              <CheckCircle2 className="w-12 h-12 text-[#0A1128]" />
            </motion.div>

            <h2 className="text-4xl font-bold text-white mb-4">Application Submitted, {formData.firstName}!</h2>
            <p className="text-xl text-gray-400 mb-8">Your application is being reviewed by our recruiting team</p>

            <div className="bg-gradient-to-r from-[#D4AF37]/10 to-[#E8C976]/10 border border-[#D4AF37]/30 rounded-lg p-6 mb-8">
              <h3 className="font-bold text-white mb-4 text-lg">What Happens Next:</h3>
              <div className="space-y-4 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#D4AF37] font-bold">1</span>
                  </div>
                  <div>
                    <div className="font-semibold text-white">Within 2 Hours</div>
                    <div className="text-sm text-gray-400">Application review and background check initiated</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#D4AF37] font-bold">2</span>
                  </div>
                  <div>
                    <div className="font-semibold text-white">Within 24 Hours</div>
                    <div className="text-sm text-gray-400">Recruiting manager will call/email with decision</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#D4AF37] font-bold">3</span>
                  </div>
                  <div>
                    <div className="font-semibold text-white">If Approved</div>
                    <div className="text-sm text-gray-400">Onboarding, contracting, and CRM setup (48 hours)</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#D4AF37] font-bold">4</span>
                  </div>
                  <div>
                    <div className="font-semibold text-white">Start Receiving Leads</div>
                    <div className="text-sm text-gray-400">First leads delivered within 48 hours of approval</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-6 mb-8">
              <div className="text-sm text-gray-400 mb-2">Reference Number</div>
              <div className="text-2xl font-bold text-[#D4AF37] mb-4">{referenceNumber || 'AA-PENDING'}</div>
              <div className="text-sm text-gray-400">Save this for your records</div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="outline"
                className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                onClick={() => (window.location.href = "tel:8885550123")}
              >
                <Phone className="w-4 h-4 mr-2" />
                Call Us: (888) 555-0123
              </Button>
              <Button
                variant="outline"
                className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                onClick={() => (window.location.href = "mailto:recruiting@dynasty.com")}
              >
                <Mail className="w-4 h-4 mr-2" />
                recruiting@dynasty.com
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      <Footer />
    </div>
  )
}
