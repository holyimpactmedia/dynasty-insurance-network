import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "COBRA Alternative Plans",
  description:
    "COBRA costs too much. Find private PPO alternatives that cover the same benefits for far less. Get compared by a licensed specialist today.",
  openGraph: {
    title: "COBRA Alternative Plans | Dynasty Insurance Group",
    description:
      "Stop overpaying for COBRA. Private PPO alternatives with the same benefits at a fraction of the cost.",
    url: "/cobra",
  },
  twitter: {
    title: "COBRA Alternative Plans | Dynasty Insurance Group",
    description:
      "Stop overpaying for COBRA. Private PPO alternatives at a fraction of the cost.",
  },
}

export default function COBRALayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
