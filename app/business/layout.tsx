import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Group Health Insurance for Small Businesses",
  description:
    "Offer your team private PPO group health benefits that attract and retain top talent. Fully deductible business expense. Get a quote from a licensed specialist.",
  openGraph: {
    title: "Group Health Benefits for Small Business | Dynasty Insurance Group",
    description:
      "Private PPO group plans for small businesses. Attract great people. Keep them. Fully deductible.",
    url: "/business",
  },
  twitter: {
    title: "Group Health Benefits for Small Business | Dynasty Insurance Group",
    description:
      "Private PPO group plans for small businesses. Attract great people. Keep them. Fully deductible.",
  },
}

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
