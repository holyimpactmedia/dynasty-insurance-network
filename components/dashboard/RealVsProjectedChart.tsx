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
        <CartesianGrid strokeDasharray="3 3" stroke="#e7ecf3" />
        <XAxis dataKey="date" stroke="#6b7a8d" tick={{ fontSize: 11 }} />
        <YAxis stroke="#6b7a8d" allowDecimals={false} />
        <Tooltip
          contentStyle={{ backgroundColor: "white", border: "1px solid #e7ecf3", borderRadius: "8px" }}
          formatter={(value, name) => [value as number | string, name === "projected" ? "Projected" : "Actual"]}
        />
        <Legend formatter={(value) => value === "projected" ? "Projected" : "Actual"} />
        {/* Steel, not Union red: red is already load-bearing in this dashboard as
            loss / ad spend / failed, so a red baseline would read as a problem.
            Steel is the only Union token that reads as "reference" without
            semantic collision. The caption on the projections page names this
            color in prose ("Dashed steel = projected baseline"), so the two must
            be changed together. */}
        <Line
          type="monotone"
          dataKey="projected"
          stroke="#8fb9ea"
          strokeWidth={2}
          strokeDasharray="6 3"
          dot={false}
          name="projected"
        />
        <Line
          type="monotone"
          dataKey="actual"
          stroke="#0a2540"
          strokeWidth={2.5}
          dot={{ fill: "#0a2540", r: 3 }}
          name="actual"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
