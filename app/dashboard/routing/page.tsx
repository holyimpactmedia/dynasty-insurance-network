"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Users,
  Clock,
  Shield,
  Target,
  Zap,
  MapPin,
  Phone,
} from "lucide-react"

const mockAgents = [
  { id: 1, name: "Sarah Johnson", tier: 1, status: "available", leadsToday: 6, contactRate: 92, state: "FL" },
  { id: 2, name: "Michael Chen", tier: 1, status: "busy", leadsToday: 8, contactRate: 88, state: "FL" },
  { id: 3, name: "Jessica Rodriguez", tier: 2, status: "available", leadsToday: 4, contactRate: 78, state: "FL" },
  { id: 4, name: "David Kim", tier: 2, status: "available", leadsToday: 3, contactRate: 81, state: "TX" },
  { id: 5, name: "Amanda Williams", tier: 2, status: "available", leadsToday: 5, contactRate: 75, state: "FL" },
  { id: 6, name: "Kevin Thompson", tier: 3, status: "available", leadsToday: 2, contactRate: 65, state: "FL" },
]

const mockLeads = [
  { name: "Robert Martinez", age: 63, state: "FL", tier: 1, zipCode: "33101" },
  { name: "Maria Garcia", age: 58, state: "FL", tier: 2, zipCode: "32801" },
  { name: "James Wilson", age: 51, state: "TX", tier: 2, zipCode: "78701" },
]

export default function RoutingVisualization() {
  const router = useRouter()
  const [isAuthChecked, setIsAuthChecked] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [currentLead, setCurrentLead] = useState(mockLeads[0])
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null)
  const [eliminatedAgents, setEliminatedAgents] = useState<number[]>([])
  const [speed, setSpeed] = useState(1)

  useEffect(() => {
    const check = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace("/auth/login?redirectTo=/dashboard/routing")
        return
      }
      const role = (user.user_metadata as { role?: string } | null)?.role
      if (role !== "admin") {
        router.replace("/dashboard/agent")
        return
      }
      setIsAuthChecked(true)
    }
    check()
  }, [router])

  const routingSteps = [
    { label: "Lead Incoming", icon: Users, check: true },
    { label: "Check State License", icon: MapPin, check: true },
    { label: "Filter by Tier Match", icon: Target, check: true },
    { label: "Check Daily Cap", icon: Clock, check: true },
    { label: "Round-Robin Selection", icon: Zap, check: true },
    { label: "Agent Notification", icon: Phone, check: true },
  ]

  useEffect(() => {
    if (!isPlaying) return

    const timer = setTimeout(() => {
      if (currentStep < routingSteps.length) {
        setCurrentStep((prev) => prev + 1)

        // Simulate agent elimination at different steps
        if (currentStep === 1) {
          // Eliminate agents not licensed in lead's state
          const notLicensed = mockAgents.filter((a) => a.state !== currentLead.state).map((a) => a.id)
          setEliminatedAgents(notLicensed)
        } else if (currentStep === 2) {
          // Eliminate agents not in matching tier
          const wrongTier = mockAgents
            .filter((a) => !eliminatedAgents.includes(a.id) && a.tier !== currentLead.tier)
            .map((a) => a.id)
          setEliminatedAgents([...eliminatedAgents, ...wrongTier])
        } else if (currentStep === 3) {
          // Eliminate busy agents
          const busy = mockAgents
            .filter((a) => !eliminatedAgents.includes(a.id) && a.status === "busy")
            .map((a) => a.id)
          setEliminatedAgents([...eliminatedAgents, ...busy])
        } else if (currentStep === 4) {
          // Select agent
          const available = mockAgents.filter(
            (a) => !eliminatedAgents.includes(a.id) && a.tier === currentLead.tier && a.state === currentLead.state,
          )
          if (available.length > 0) {
            setSelectedAgent(available[0].id)
          }
        }
      } else {
        setIsPlaying(false)
      }
    }, 1000 / speed)

    return () => clearTimeout(timer)
  }, [isPlaying, currentStep, speed])

  const handleReset = () => {
    setIsPlaying(false)
    setCurrentStep(0)
    setSelectedAgent(null)
    setEliminatedAgents([])
  }

  const handleStart = () => {
    if (currentStep >= routingSteps.length) {
      handleReset()
    }
    setIsPlaying(true)
  }

  const getTierColor = (tier: number) => {
    if (tier === 1) return "from-[#D4AF37] to-[#E8C976]"
    if (tier === 2) return "from-blue-500 to-blue-600"
    return "from-gray-500 to-gray-600"
  }

  if (!isAuthChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A1128] via-[#1a2744] to-[#0A1128] flex items-center justify-center">
        <div className="text-white text-sm">Loading routing console...</div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lead Routing Visualization</h1>
          <p className="text-sm text-gray-500">Watch the intelligent routing algorithm in action</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600">Speed:</div>
          <div className="flex gap-2">
            {[1, 2, 5].map((s) => (
              <Button
                key={s}
                variant={speed === s ? "default" : "outline"}
                size="sm"
                onClick={() => setSpeed(s)}
                className={speed === s ? "bg-[#1e3a8a]" : ""}
              >
                {s}x
              </Button>
            ))}
          </div>
          <Button onClick={handleReset} variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleStart} disabled={isPlaying} className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90">
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Demo
              </>
            )}
          </Button>
        </div>
      </div>
        {/* Lead Incoming Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Incoming Lead</h2>
          <AnimatePresence mode="wait">
            {currentStep >= 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="p-6 bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-2xl font-bold text-gray-900">{currentLead.name}</div>
                        <Badge className={`bg-gradient-to-r ${getTierColor(currentLead.tier)} text-white border-none`}>
                          Tier {currentLead.tier} Lead
                        </Badge>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          Age {currentLead.age}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {currentLead.state} · {currentLead.zipCode}
                        </span>
                      </div>
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
                      className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center"
                    >
                      <Users className="w-8 h-8 text-white" />
                    </motion.div>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Routing Algorithm Steps */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Routing Algorithm</h2>
          <Card className="p-6">
            <div className="space-y-3">
              {routingSteps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0.3, x: -20 }}
                  animate={{
                    opacity: currentStep > i ? 1 : 0.3,
                    x: currentStep > i ? 0 : -20,
                    scale: currentStep === i ? 1.02 : 1,
                  }}
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 ${
                    currentStep > i
                      ? "bg-green-50 border-green-500"
                      : currentStep === i
                        ? "bg-blue-50 border-blue-500"
                        : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      currentStep > i ? "bg-green-500" : currentStep === i ? "bg-blue-500" : "bg-gray-300"
                    }`}
                  >
                    {currentStep > i ? (
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    ) : (
                      <step.icon className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{step.label}</div>
                    {currentStep > i && (
                      <div className="text-sm text-green-600">
                        {i === 0 && "Lead received and validated"}
                        {i === 1 &&
                          `${eliminatedAgents.length} agents eliminated (not licensed in ${currentLead.state})`}
                        {i === 2 && `Filtered to Tier ${currentLead.tier} agents only`}
                        {i === 3 && "All agents under daily cap"}
                        {i === 4 && "Best match selected"}
                        {i === 5 && "SMS notification sent"}
                      </div>
                    )}
                  </div>
                  {currentStep === i && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"
                    />
                  )}
                </motion.div>
              ))}
            </div>

            {currentStep >= routingSteps.length && selectedAgent && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-green-50 border-2 border-green-500 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <div>
                    <div className="font-bold text-green-900">Routing Successful!</div>
                    <div className="text-sm text-green-700">
                      Lead assigned to {mockAgents.find((a) => a.id === selectedAgent)?.name} in 0.3 seconds
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </Card>
        </div>

        {/* Agent Tiers */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Agents by Tier</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((tier) => (
              <Card key={tier} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${getTierColor(tier)} text-white font-bold`}>
                    Tier {tier}
                  </div>
                  <Badge className="bg-gray-100 text-gray-800">
                    {mockAgents.filter((a) => a.tier === tier).length} agents
                  </Badge>
                </div>

                <div className="space-y-3">
                  {mockAgents
                    .filter((a) => a.tier === tier)
                    .map((agent) => (
                      <motion.div
                        key={agent.id}
                        animate={{
                          scale: selectedAgent === agent.id ? 1.05 : 1,
                          opacity: eliminatedAgents.includes(agent.id) ? 0.3 : 1,
                        }}
                        className={`p-3 rounded-lg border-2 relative ${
                          selectedAgent === agent.id
                            ? "bg-green-50 border-green-500"
                            : eliminatedAgents.includes(agent.id)
                              ? "bg-gray-100 border-gray-300"
                              : "bg-white border-gray-200"
                        }`}
                      >
                        {selectedAgent === agent.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center"
                          >
                            <CheckCircle2 className="w-5 h-5 text-white" />
                          </motion.div>
                        )}

                        {eliminatedAgents.includes(agent.id) && (
                          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                            <XCircle className="w-5 h-5 text-white" />
                          </div>
                        )}

                        <div className="font-medium text-gray-900 mb-1">{agent.name}</div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Badge
                            className={
                              agent.status === "available"
                                ? "bg-green-100 text-green-800 border-green-200"
                                : "bg-amber-100 text-amber-800 border-amber-200"
                            }
                          >
                            {agent.status}
                          </Badge>
                          <span>{agent.state}</span>
                          <span>{agent.contactRate}% contact</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{agent.leadsToday} leads today</div>
                      </motion.div>
                    ))}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Routing Rules */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Routing Rules</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Fair Distribution</h3>
              <p className="text-sm text-gray-600">
                Round-robin within tier prevents favoritism. All agents get equal opportunity.
              </p>
            </Card>

            <Card className="p-6">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Performance-Based</h3>
              <p className="text-sm text-gray-600">
                Top performers earn access to best leads. Tier adjusts automatically each week.
              </p>
            </Card>

            <Card className="p-6">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">License Compliance</h3>
              <p className="text-sm text-gray-600">
                Leads only routed to licensed agents. Automatic filtering prevents violations.
              </p>
            </Card>

            <Card className="p-6">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Capacity Management</h3>
              <p className="text-sm text-gray-600">
                Daily cap prevents agent overwhelm. Ensures quality over quantity.
              </p>
            </Card>
          </div>
        </div>

        {/* Metrics */}
        <Card className="p-6 mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Routing Performance Metrics</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div>
              <div className="text-sm text-gray-600 mb-1">Avg Assignment Time</div>
              <div className="text-3xl font-bold text-gray-900">0.3s</div>
              <div className="text-sm text-green-600">Target: &lt;1s</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Fair Distribution</div>
              <div className="text-3xl font-bold text-gray-900">98%</div>
              <div className="text-sm text-gray-500">Even spread score</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Compliance Rate</div>
              <div className="text-3xl font-bold text-green-600">100%</div>
              <div className="text-sm text-gray-500">No violations</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Recycled Leads</div>
              <div className="text-3xl font-bold text-gray-900">3</div>
              <div className="text-sm text-gray-500">Today</div>
            </div>
          </div>
        </Card>
    </div>
  )
}
