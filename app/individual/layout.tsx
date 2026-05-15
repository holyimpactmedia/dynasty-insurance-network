import type React from "react"
import type { Metadata } from "next"

const TITLE = "Private Individual Health Insurance Plans"
const DESC =
  "Private PPO health insurance plans for healthy adults under 65. See any doctor, skip referrals, and get nationwide network coverage. Get matched in 90 seconds."
const SHORT_DESC =
  "Private PPO plans for healthy adults. See any doctor, no referrals, nationwide coverage."

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: "/individual" },
  openGraph: {
    title: `${TITLE} | Dynasty Insurance Group`,
    description: SHORT_DESC,
    url: "/individual",
    images: [
      { url: "/og/individual.jpg", width: 1200, height: 630, type: "image/jpeg" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} | Dynasty Insurance Group`,
    description: SHORT_DESC,
    images: ["/og/individual.jpg"],
  },
}

export default function IndividualLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
