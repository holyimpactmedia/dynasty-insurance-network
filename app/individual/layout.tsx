import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Individual Health Coverage",
  description:
    "Compare private PPO plans with nationwide coverage and no referrals. Keep your doctors. Get matched with a licensed specialist in 90 seconds.",
  openGraph: {
    title: "Individual Health Coverage | Dynasty Insurance Group",
    description:
      "Private PPO plans with nationwide networks. See any doctor without a referral. Get matched in 90 seconds.",
    url: "/individual",
  },
  twitter: {
    title: "Individual Health Coverage | Dynasty Insurance Group",
    description:
      "Private PPO plans with nationwide networks. See any doctor without a referral.",
  },
}

export default function IndividualLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
