"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface DataPoint {
  date: string
  projected: number
  actual: number
}

export default function RealVsProjectedChart({ data }: { data: DataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 11 }} />
        <YAxis stroke="#6b7280" allowDecimals={false} />
        <Tooltip
          contentStyle={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px" }}
          formatter={(value: number, name: string) => [value, name === "projected" ? "Projected" : "Actual"]}
        />
        <Legend formatter={(value) => value === "projected" ? "Projected" : "Actual"} />
        <Line
          type="monotone"
          dataKey="projected"
          stroke="#D4AF37"
          strokeWidth={2}
          strokeDasharray="6 3"
          dot={false}
          name="projected"
        />
        <Line
          type="monotone"
          dataKey="actual"
          stroke="#1e3a8a"
          strokeWidth={2.5}
          dot={{ fill: "#1e3a8a", r: 3 }}
          name="actual"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
