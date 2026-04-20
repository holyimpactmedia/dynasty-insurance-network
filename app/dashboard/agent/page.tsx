"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Phone,
  Mail,
  Clock,
  TrendingUp,
  Users,
  CheckCircle2,
  Search,
  Calendar,
  DollarSign,
  Award,
  Target,
  Activity,
  ChevronDown,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AIScoreBadge } from "@/components/dashboard/AIScoreBadge"

interface Lead {
  id: string
  reference_number: string
  first_name: string
  last_name: string
  age: number | null
  phone: string | null
  email: string
  state: string | null
  household_size: string | null
  income_range: string | null
  created_at: string
  status: string
  ai_score: number | null
  ai_score_reasons: string[] | null
}

export default function AgentDashboard() {
  const [activeTab, setActiveTab] = useState<"leads" | "performance" | "activity">("leads")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchLeads = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50)

      if (data && !error) {
        setLeads(data)
      }
      setIsLoading(false)
    }

    fetchLeads()
  }, [])

  const agentStats = {
    tier: 1,
    contactRate: 92,
    closeRate: 23,
    leadsToday: leads.filter(l => {
      const today = new Date()
      const leadDate = new Date(l.created_at)
      return leadDate.toDateString() === today.toDateString()
    }).length,
    leadsThisMonth: leads.length,
    salesThisMonth: leads.filter(l => l.status === "sold").length,
    revenueThisMonth: leads.filter(l => l.status === "sold").length * 600,
  }

  const getTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
    if (minutes < 60) return `${minutes} min ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`
    const days = Math.floor(hours / 24)
    return `${days} day${days > 1 ? "s" : ""} ago`
  }

  const getStatusColor = (status: string) => {
    const colors = {
      new: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      contacted: "bg-green-500/10 text-green-500 border-green-500/20",
      appointment: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      "follow-up": "bg-amber-500/10 text-amber-500 border-amber-500/20",
      sold: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      lost: "bg-red-500/10 text-red-500 border-red-500/20",
    }
    return colors[status as keyof typeof colors] || colors.new
  }

  const getTierColor = (tier: number) => {
    if (tier === 1) return "from-[#D4AF37] to-[#E8C976]"
    if (tier === 2) return "from-blue-500 to-blue-600"
    return "from-gray-500 to-gray-600"
  }

  const mockActivities = [
    { type: "assigned", lead: "New Lead", time: "3 min ago", icon: Users },
    { type: "contacted", lead: "John Doe", time: "15 min ago", icon: Phone },
    { type: "appointment", lead: "Jane Smith", time: "45 min ago", icon: Calendar },
    { type: "status", lead: "Lead → Follow-up", time: "2 hours ago", icon: Activity },
  ]

  const handleStatusChange = async (leadId: string, newStatus: string, oldStatus: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, oldStatus }),
      })

      if (response.ok) {
        setLeads(leads.map(lead => 
          lead.id === leadId ? { ...lead, status: newStatus } : lead
        ))
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const handleCall = async (lead: Lead) => {
    if (!lead.phone) return
    
    // Log the call attempt
    try {
      await fetch(`/api/leads/${lead.id}/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome: 'attempted' }),
      })
    } catch (error) {
      console.error('Error logging call:', error)
    }

    // Open phone dialer
    window.location.href = `tel:${lead.phone}`
  }

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.state?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    const matchesStatus = selectedStatus === "all" || lead.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Tab Navigation */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant={activeTab === "leads" ? "default" : "ghost"}
          onClick={() => setActiveTab("leads")}
          className={activeTab === "leads" ? "bg-[#1e3a8a] hover:bg-[#1e3a8a]/90" : ""}
        >
          My Leads
        </Button>
        <Button
          variant={activeTab === "performance" ? "default" : "ghost"}
          onClick={() => setActiveTab("performance")}
          className={activeTab === "performance" ? "bg-[#1e3a8a] hover:bg-[#1e3a8a]/90" : ""}
        >
          Performance
        </Button>
        <Button
          variant={activeTab === "activity" ? "default" : "ghost"}
          onClick={() => setActiveTab("activity")}
          className={activeTab === "activity" ? "bg-[#1e3a8a] hover:bg-[#1e3a8a]/90" : ""}
        >
          Activity
        </Button>
      </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium text-gray-600">Leads Today</div>
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{agentStats.leadsToday}</div>
            <div className="text-sm text-gray-500">+2 from yesterday</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium text-gray-600">Contact Rate</div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{agentStats.contactRate}%</div>
            <div className="flex items-center gap-1">
              <Badge className="bg-green-100 text-green-800 border-green-200">Tier 1</Badge>
              <span className="text-sm text-gray-500">Target: 85%</span>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium text-gray-600">Close Rate</div>
              <Target className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{agentStats.closeRate}%</div>
            <div className="flex items-center gap-1">
              <Badge className="bg-green-100 text-green-800 border-green-200">Above Target</Badge>
              <span className="text-sm text-gray-500">Target: 18%</span>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium text-gray-600">Revenue MTD</div>
              <DollarSign className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">${agentStats.revenueThisMonth.toLocaleString()}</div>
            <div className="text-sm text-gray-500">{agentStats.salesThisMonth} sales this month</div>
          </Card>
        </div>

        {/* Leads Tab */}
        {activeTab === "leads" && (
          <Card className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">My Leads</h2>

              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Search leads by name or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="appointment">Appointment</option>
                    <option value="follow-up">Follow-up</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>AI Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        Loading leads...
                      </TableCell>
                    </TableRow>
                  ) : filteredLeads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        No leads found
                      </TableCell>
                    </TableRow>
                  ) : filteredLeads.map((lead) => (
                    <TableRow key={lead.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="font-medium text-gray-900">
                          {lead.first_name} {lead.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {lead.age ? `Age ${lead.age} · ` : ""}ID: {lead.reference_number}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {lead.phone && (
                            <a
                              href={`tel:${lead.phone}`}
                              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3" />
                              {lead.phone}
                            </a>
                          )}
                          <a
                            href={`mailto:${lead.email}`}
                            className="text-sm text-gray-500 hover:underline flex items-center gap-1"
                          >
                            <Mail className="w-3 h-3" />
                            {lead.email}
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900">
                          {lead.state || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900">HH Size: {lead.household_size || "N/A"}</div>
                        <div className="text-sm text-gray-500">Income: {lead.income_range || "N/A"}</div>
                      </TableCell>
                      <TableCell>
                        <AIScoreBadge score={lead.ai_score} reasons={lead.ai_score_reasons} />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className={`${getStatusColor(lead.status)} border`}>
                              {lead.status === "new" && "New"}
                              {lead.status === "contacted" && "Contacted"}
                              {lead.status === "appointment" && "Appointment"}
                              {lead.status === "follow-up" && "Follow-up"}
                              {lead.status === "sold" && "Sold"}
                              {lead.status === "lost" && "Lost"}
                              {!["new", "contacted", "appointment", "follow-up", "sold", "lost"].includes(lead.status) && lead.status}
                              <ChevronDown className="w-3 h-3 ml-1" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleStatusChange(lead.id, 'new', lead.status)}>
                              New
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(lead.id, 'contacted', lead.status)}>
                              Contacted
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(lead.id, 'appointment', lead.status)}>
                              Appointment
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(lead.id, 'follow-up', lead.status)}>
                              Follow-up
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(lead.id, 'sold', lead.status)}>
                              Sold
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(lead.id, 'lost', lead.status)}>
                              Lost
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock className="w-3 h-3" />
                          {getTimeAgo(new Date(lead.created_at))}
                        </div>
                        {lead.status === "new" && Date.now() - new Date(lead.created_at).getTime() > 10 * 60000 && (
                          <Badge className="bg-red-100 text-red-800 border-red-200 mt-1">Overdue</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700" 
                            disabled={!lead.phone}
                            onClick={() => handleCall(lead)}
                          >
                            <Phone className="w-4 h-4 mr-1" />
                            Call
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <a href={`mailto:${lead.email}`}>
                              <Mail className="w-4 h-4" />
                            </a>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        {/* Performance Tab */}
        {activeTab === "performance" && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Performance Metrics</h2>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Contact Rate</h3>
                    <Badge className={`bg-gradient-to-r ${getTierColor(agentStats.tier)} text-white border-none`}>
                      Tier {agentStats.tier}
                    </Badge>
                  </div>
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-3xl font-bold text-gray-900">{agentStats.contactRate}%</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-gray-500">Target: 85%</span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-4 mb-4 text-xs flex rounded-full bg-gray-200">
                      <div
                        style={{ width: `${agentStats.contactRate}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>7% above Tier 1 requirement</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Close Rate</h3>
                    <Badge className="bg-green-100 text-green-800 border-green-200">Above Target</Badge>
                  </div>
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-3xl font-bold text-gray-900">{agentStats.closeRate}%</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-gray-500">Target: 18%</span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-4 mb-4 text-xs flex rounded-full bg-gray-200">
                      <div
                        style={{ width: `${(agentStats.closeRate / 30) * 100}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>5% above Tier 1 requirement</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6 pt-6 border-t">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Total Leads MTD</div>
                  <div className="text-2xl font-bold text-gray-900">{agentStats.leadsThisMonth}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Sales MTD</div>
                  <div className="text-2xl font-bold text-gray-900">{agentStats.salesThisMonth}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Revenue MTD</div>
                  <div className="text-2xl font-bold text-gray-900">
                    ${agentStats.revenueThisMonth.toLocaleString()}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Tier Requirements</h3>

              <div className="space-y-4">
                {[
                  { tier: 1, contact: 85, close: 18, leads: "45-60", color: getTierColor(1) },
                  { tier: 2, contact: 70, close: 12, leads: "30-45", color: getTierColor(2) },
                  { tier: 3, contact: 0, close: 0, leads: "20-30", color: getTierColor(3) },
                ].map((tierInfo) => (
                  <div
                    key={tierInfo.tier}
                    className={`p-4 rounded-lg border-2 ${
                      tierInfo.tier === agentStats.tier ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`px-3 py-1 rounded-full bg-gradient-to-r ${tierInfo.color} text-white text-sm font-bold`}
                        >
                          Tier {tierInfo.tier}
                        </div>
                        {tierInfo.tier === agentStats.tier && (
                          <Badge className="bg-green-100 text-green-800 border-green-200">Current</Badge>
                        )}
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-gray-600">
                          Contact: {tierInfo.contact}%+ | Close: {tierInfo.close}%+
                        </div>
                        <div className="text-gray-500">Leads/month: {tierInfo.leads}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <div className="font-semibold mb-1">You're performing great!</div>
                    <div>
                      Keep your contact rate above 85% and close rate above 18% to maintain Tier 1 status. Tiers are
                      evaluated weekly.
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === "activity" && (
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>

            <div className="space-y-4">
              {mockActivities.map((activity, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      activity.type === "assigned"
                        ? "bg-blue-100"
                        : activity.type === "contacted"
                          ? "bg-green-100"
                          : activity.type === "appointment"
                            ? "bg-purple-100"
                            : "bg-gray-100"
                    }`}
                  >
                    <activity.icon
                      className={`w-5 h-5 ${
                        activity.type === "assigned"
                          ? "text-blue-600"
                          : activity.type === "contacted"
                            ? "text-green-600"
                            : activity.type === "appointment"
                              ? "text-purple-600"
                              : "text-gray-600"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {activity.type === "assigned" && "Lead assigned: "}
                      {activity.type === "contacted" && "You contacted "}
                      {activity.type === "appointment" && "Appointment set with "}
                      {activity.type === "status" && "Status changed: "}
                      {activity.lead}
                    </div>
                    <div className="text-sm text-gray-500">{activity.time}</div>
                  </div>
                  {activity.type === "contacted" && (
                    <Badge className="bg-green-100 text-green-800 border-green-200">On Time</Badge>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Daily Summary</h3>
              <div className="grid md:grid-cols-4 gap-4">
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <div className="text-sm text-blue-600 mb-1">Calls Made</div>
                  <div className="text-2xl font-bold text-blue-900">12</div>
                </Card>
                <Card className="p-4 bg-purple-50 border-purple-200">
                  <div className="text-sm text-purple-600 mb-1">Appointments Set</div>
                  <div className="text-2xl font-bold text-purple-900">3</div>
                </Card>
                <Card className="p-4 bg-amber-50 border-amber-200">
                  <div className="text-sm text-amber-600 mb-1">Follow-ups</div>
                  <div className="text-2xl font-bold text-amber-900">5</div>
                </Card>
                <Card className="p-4 bg-green-50 border-green-200">
                  <div className="text-sm text-green-600 mb-1">Sales Closed</div>
                  <div className="text-2xl font-bold text-green-900">2</div>
                </Card>
              </div>
            </div>
          </Card>
        )}
    </div>
  )
}
