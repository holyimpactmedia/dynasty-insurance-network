import type React from "react"
import type { Metadata } from "next"

const TITLE = "Private Individual Health Coverage"
const DESC =
  "Private health coverage for adults under 65 that can access a PPO network. See a broad range of doctors and providers, often without a referral. Get matched in 90 seconds."
const SHORT_DESC =
  "Private health coverage for adults. Access a PPO network and a broad range of providers."

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
