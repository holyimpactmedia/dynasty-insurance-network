import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Family Health Insurance Plans",
  description:
    "Private PPO family plans that say yes. Keep your pediatrician, see any specialist without a referral, and get nationwide coverage for the whole family.",
  openGraph: {
    title: "Family Health Insurance Plans | Dynasty Insurance Group",
    description:
      "Private PPO family plans. Keep your pediatrician. No referrals for specialists. Nationwide coverage for the whole family.",
    url: "/family",
  },
  twitter: {
    title: "Family Health Insurance Plans | Dynasty Insurance Group",
    description:
      "Private PPO family plans. Keep your pediatrician. No referrals. Nationwide coverage.",
  },
}

export default function FamilyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
