"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Download, Calendar, CheckCircle2 } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

export default function ProjectionsCalculators() {
  const [pilotLeads, setPilotLeads] = useState(150)
  const [pilotContactRate, setPilotContactRate] = useState(80)
  const [pilotCloseRate, setPilotCloseRate] = useState(15)
  const [pilotAvgCommission, setPilotAvgCommission] = useState(600)
  const [dailyAdSpend, setDailyAdSpend] = useState(2000)
  const [bronzeAgents, setBronzeAgents] = useState(30)
  const [silverAgents, setSilverAgents] = useState(15)
  const [goldAgents, setGoldAgents] = useState(5)

  const pilotAdSpend = 10000
  const pilotCPL = pilotAdSpend / pilotLeads
  const pilotSales = Math.floor(pilotLeads * (pilotCloseRate / 100))
  const pilotRevenue = pilotSales * pilotAvgCommission
  const pilotProfit = pilotRevenue - pilotAdSpend
  const pilotMargin = (pilotProfit / pilotRevenue) * 100

  const monthlyAdSpend = dailyAdSpend * 30
  const monthlyLeads = Math.floor(monthlyAdSpend / pilotCPL)
  const monthlySales = Math.floor(monthlyLeads * (pilotCloseRate / 100))
  const monthlyRevenue = monthlySales * pilotAvgCommission
  const monthlyOperatingCosts = monthlyRevenue * 0.15
  const monthlyProfit = monthlyRevenue - monthlyAdSpend - monthlyOperatingCosts
  const monthlyMargin = (monthlyProfit / monthlyRevenue) * 100

  const bronzeMRR = bronzeAgents * 497
  const silverMRR = silverAgents * 997
  const goldMRR = goldAgents * 1497
  const totalMRR = bronzeMRR + silverMRR + goldMRR
  const annualAgentRevenue = totalMRR * 12

  const year1Data = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    const dailySpend = 300 + ((3000 - 300) / 12) * i
    const monthSpend = dailySpend * 30
    const leads = Math.floor(monthSpend / (pilotCPL * 0.8))
    const sales = Math.floor(leads * (pilotCloseRate / 100))
    const revenue = sales * pilotAvgCommission
    const profit = revenue - monthSpend - revenue * 0.15
    return {
      month: `M${month}`,
      spend: Math.floor(monthSpend),
      revenue: Math.floor(revenue),
      profit: Math.floor(profit),
      leads,
      sales,
    }
  })

  const cumulativeProfit = year1Data.reduce((sum, m) => sum + m.profit, 0)
  const cumulativeRevenue = year1Data.reduce((sum, m) => sum + m.revenue, 0)
  const cumulativeSpend = year1Data.reduce((sum, m) => sum + m.spend, 0)

  return (
    <>
      {/* Pilot Phase Results */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">30-Day Pilot Results</h2>
            <p className="text-gray-600">Test budget: $10,000</p>
          </div>
          <Badge className={pilotProfit > 0 ? "bg-green-100 text-green-800 border-green-200" : "bg-red-100 text-red-800 border-red-200"}>
            {pilotProfit > 0 ? "PROFITABLE" : "LOSS"}
          </Badge>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-6">Adjust Assumptions</h3>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Leads Generated</Label>
                  <span className="text-sm font-semibold text-gray-900">{pilotLeads}</span>
                </div>
                <Slider value={[pilotLeads]} onValueChange={(v) => setPilotLeads(v[0])} min={100} max={200} step={5} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Contact Rate</Label>
                  <span className="text-sm font-semibold text-gray-900">{pilotContactRate}%</span>
                </div>
                <Slider value={[pilotContactRate]} onValueChange={(v) => setPilotContactRate(v[0])} min={60} max={95} step={1} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Close Rate</Label>
                  <span className="text-sm font-semibold text-gray-900">{pilotCloseRate}%</span>
                </div>
                <Slider value={[pilotCloseRate]} onValueChange={(v) => setPilotCloseRate(v[0])} min={8} max={25} step={1} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Avg Commission</Label>
                  <span className="text-sm font-semibold text-gray-900">${pilotAvgCommission}</span>
                </div>
                <Slider value={[pilotAvgCommission]} onValueChange={(v) => setPilotAvgCommission(v[0])} min={400} max={800} step={50} />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-6">Financial Outcome</h3>
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Cost Per Lead</span>
                <span className="font-bold text-gray-900">${pilotCPL.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Sales Closed</span>
                <span className="font-bold text-gray-900">{pilotSales}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-blue-600">Total Revenue</span>
                <span className="font-bold text-blue-900">${pilotRevenue.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="text-red-600">Ad Spend</span>
                <span className="font-bold text-red-900">-${pilotAdSpend.toLocaleString()}</span>
              </div>
            </div>
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-semibold text-green-900">Net Profit</span>
                <span className="text-3xl font-bold text-green-900">${pilotProfit.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-700">Profit Margin</span>
                <span className="font-semibold text-green-900">{pilotMargin.toFixed(1)}%</span>
              </div>
            </div>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="font-semibold text-blue-900 mb-2">Unit Economics:</div>
              <div className="text-sm text-blue-800 space-y-1 font-mono">
                <div>${pilotAdSpend.toLocaleString()} spent ÷ {pilotLeads} leads = ${pilotCPL.toFixed(2)} CPL</div>
                <div>{pilotLeads} leads × {pilotCloseRate}% = {pilotSales} sales</div>
                <div>{pilotSales} sales × ${pilotAvgCommission} = ${pilotRevenue.toLocaleString()} revenue</div>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6 mt-6">
          <h3 className="font-semibold text-gray-900 mb-4">Sensitivity Analysis</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Scenario</th>
                  <th className="text-left py-3 px-4">CPL</th>
                  <th className="text-left py-3 px-4">Close Rate</th>
                  <th className="text-left py-3 px-4">Sales</th>
                  <th className="text-left py-3 px-4">Revenue</th>
                  <th className="text-left py-3 px-4">Profit</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Conservative", cpl: 85, close: 10 },
                  { label: "Expected", cpl: 65, close: 15 },
                  { label: "Optimistic", cpl: 50, close: 20 },
                ].map((scenario) => {
                  const leads = Math.floor(10000 / scenario.cpl)
                  const sales = Math.floor(leads * (scenario.close / 100))
                  const revenue = sales * 600
                  const profit = revenue - 10000
                  return (
                    <tr key={scenario.label} className="border-b">
                      <td className="py-3 px-4 font-medium">{scenario.label}</td>
                      <td className="py-3 px-4">${scenario.cpl}</td>
                      <td className="py-3 px-4">{scenario.close}%</td>
                      <td className="py-3 px-4">{sales}</td>
                      <td className="py-3 px-4">${revenue.toLocaleString()}</td>
                      <td className={`py-3 px-4 font-bold ${profit > 0 ? "text-green-600" : "text-red-600"}`}>
                        ${profit.toLocaleString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Scale Phase */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Months 4-6 Scale Model</h2>
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-6">Daily Ad Spend</h3>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-lg">Spend per Day</Label>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">${dailyAdSpend}</div>
                  <div className="text-sm text-gray-500">${(dailyAdSpend * 30).toLocaleString()}/month</div>
                </div>
              </div>
              <Slider value={[dailyAdSpend]} onValueChange={(v) => setDailyAdSpend(v[0])} min={500} max={5000} step={100} className="mb-2" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>$500</span>
                <span>$5,000</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Monthly Leads</span>
                <span className="font-bold text-gray-900">{monthlyLeads}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Expected Sales</span>
                <span className="font-bold text-gray-900">{monthlySales}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-6">Monthly Projections</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                <div className="text-sm text-blue-600 mb-1">Gross Revenue</div>
                <div className="text-3xl font-bold text-blue-900">${monthlyRevenue.toLocaleString()}</div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-2 bg-red-50 rounded">
                  <span className="text-red-600">Ad Spend</span>
                  <span className="font-semibold text-red-900">-${monthlyAdSpend.toLocaleString()}</span>
                </div>
                <div className="flex justify-between p-2 bg-red-50 rounded">
                  <span className="text-red-600">Operating Costs (15%)</span>
                  <span className="font-semibold text-red-900">-${Math.floor(monthlyOperatingCosts).toLocaleString()}</span>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500 rounded-lg">
                <div className="text-sm text-green-600 mb-1">Net Profit</div>
                <div className="text-3xl font-bold text-green-900">${Math.floor(monthlyProfit).toLocaleString()}</div>
                <div className="text-sm text-green-700 mt-1">{monthlyMargin.toFixed(1)}% margin</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Year 1 Trajectory */}
      <Card className="p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Year 1 Growth Trajectory</h2>
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-600 mb-2">Assumptions:</div>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Ramp from $300/day to $3,000/day over 6 months</li>
            <li>• CPL improves by 20% through optimization</li>
            <li>• Close rate improves from 15% to 18% through agent maturity</li>
          </ul>
        </div>
        <div className="h-80 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={year1Data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                formatter={(value: number) => `$${value.toLocaleString()}`}
              />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Revenue" />
              <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} name="Profit" />
              <Line type="monotone" dataKey="spend" stroke="#ef4444" strokeWidth={2} name="Ad Spend" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Total Investment</div>
            <div className="text-2xl font-bold text-gray-900">${cumulativeSpend.toLocaleString()}</div>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-600 mb-1">Total Revenue</div>
            <div className="text-2xl font-bold text-blue-900">${cumulativeRevenue.toLocaleString()}</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-sm text-green-600 mb-1">Total Profit</div>
            <div className="text-2xl font-bold text-green-900">${cumulativeProfit.toLocaleString()}</div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-sm text-purple-600 mb-1">ROI</div>
            <div className="text-2xl font-bold text-purple-900">
              {((cumulativeProfit / cumulativeSpend) * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </Card>

      {/* Agent-Funded Revenue */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Agent-Funded Revenue Model (Phase 2)</h2>
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-6">Agent Count by Plan</h3>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Bronze ($497/mo)</Label>
                  <span className="text-sm font-semibold text-gray-900">{bronzeAgents} agents</span>
                </div>
                <Slider value={[bronzeAgents]} onValueChange={(v) => setBronzeAgents(v[0])} min={0} max={100} step={5} />
                <div className="text-sm text-gray-600 mt-1">${bronzeMRR.toLocaleString()}/month</div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Silver ($997/mo)</Label>
                  <span className="text-sm font-semibold text-gray-900">{silverAgents} agents</span>
                </div>
                <Slider value={[silverAgents]} onValueChange={(v) => setSilverAgents(v[0])} min={0} max={50} step={5} />
                <div className="text-sm text-gray-600 mt-1">${silverMRR.toLocaleString()}/month</div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Gold ($1,497/mo)</Label>
                  <span className="text-sm font-semibold text-gray-900">{goldAgents} agents</span>
                </div>
                <Slider value={[goldAgents]} onValueChange={(v) => setGoldAgents(v[0])} min={0} max={20} step={1} />
                <div className="text-sm text-gray-600 mt-1">${goldMRR.toLocaleString()}/month</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-6">Recurring Revenue</h3>
            <div className="space-y-4 mb-6">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                <div className="text-sm text-blue-600 mb-1">Total MRR</div>
                <div className="text-4xl font-bold text-blue-900">${totalMRR.toLocaleString()}</div>
                <div className="text-sm text-blue-700 mt-1">per month</div>
              </div>
              <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                <div className="text-sm text-purple-600 mb-1">Annual Agent Revenue</div>
                <div className="text-3xl font-bold text-purple-900">${annualAgentRevenue.toLocaleString()}</div>
              </div>
            </div>
            <div className="p-4 bg-green-50 border-2 border-green-500 rounded-lg">
              <div className="font-semibold text-green-900 mb-2">Combined Year 2 Model:</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700">Corporate Lead Gen</span>
                  <span className="font-bold text-green-900">$1,800,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Agent-Funded MRR</span>
                  <span className="font-bold text-green-900">${annualAgentRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-green-300">
                  <span className="text-green-900 font-semibold">Total Year 2 Revenue</span>
                  <span className="text-lg font-bold text-green-900">${(1800000 + annualAgentRevenue).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Competitive Comparison */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Dynasty vs Alternatives</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4">Approach</th>
                <th className="text-left py-3 px-4">Year 1 Cost</th>
                <th className="text-left py-3 px-4">Year 1 Revenue</th>
                <th className="text-left py-3 px-4">Margin</th>
                <th className="text-left py-3 px-4">Retention</th>
                <th className="text-left py-3 px-4">Scalability</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b bg-green-50">
                <td className="py-4 px-4 font-bold text-gray-900">Internal Lead Gen (Dynasty)</td>
                <td className="py-4 px-4 font-semibold text-gray-900">$650K</td>
                <td className="py-4 px-4 font-semibold text-green-600">$1,400K</td>
                <td className="py-4 px-4 font-semibold text-green-600">54%</td>
                <td className="py-4 px-4"><Badge className="bg-green-500 text-white">High</Badge></td>
                <td className="py-4 px-4"><Badge className="bg-green-500 text-white">Excellent</Badge></td>
              </tr>
              <tr className="border-b">
                <td className="py-4 px-4 text-gray-900">Buy Leads from Vendors</td>
                <td className="py-4 px-4 text-gray-900">$800K</td>
                <td className="py-4 px-4 text-gray-900">$1,200K</td>
                <td className="py-4 px-4 text-amber-600">33%</td>
                <td className="py-4 px-4"><Badge className="bg-red-500 text-white">Low</Badge></td>
                <td className="py-4 px-4"><Badge className="bg-amber-500 text-white">Limited</Badge></td>
              </tr>
              <tr className="border-b">
                <td className="py-4 px-4 text-gray-900">Agents Buy Own Leads</td>
                <td className="py-4 px-4 text-gray-900">$0</td>
                <td className="py-4 px-4 text-gray-900">$400K</td>
                <td className="py-4 px-4 text-gray-600">N/A</td>
                <td className="py-4 px-4"><Badge className="bg-red-500 text-white">Very Low</Badge></td>
                <td className="py-4 px-4"><Badge className="bg-red-500 text-white">None</Badge></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-6 grid md:grid-cols-4 gap-4">
          {[
            { title: "Highest Margin", desc: "Internal lead gen = 54% vs 33% buying leads" },
            { title: "Scalable", desc: "Only model that scales without hitting ceiling" },
            { title: "Retention", desc: "Agents stay for exclusive lead access" },
            { title: "Data Ownership", desc: "Full control over lead quality and data" },
          ].map((item) => (
            <div key={item.title} className="p-4 bg-green-50 rounded-lg border-2 border-green-500">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <div className="font-semibold text-green-900">{item.title}</div>
              </div>
              <div className="text-sm text-green-700">{item.desc}</div>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}
