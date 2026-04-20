import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Health Insurance for the Self-Employed",
  description:
    "Private PPO plans built for freelancers, contractors, and founders. Nationwide coverage, no referrals, and premiums that may be 100% tax deductible.",
  openGraph: {
    title: "Health Insurance for Self-Employed | Dynasty Insurance Group",
    description:
      "Private PPO plans for entrepreneurs. Nationwide coverage, no referrals, 100% potentially tax deductible premiums.",
    url: "/self-employed",
  },
  twitter: {
    title: "Health Insurance for Self-Employed | Dynasty Insurance Group",
    description:
      "Private PPO plans for entrepreneurs. Nationwide coverage, no referrals, potentially 100% tax deductible.",
  },
}

export default function SelfEmployedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
