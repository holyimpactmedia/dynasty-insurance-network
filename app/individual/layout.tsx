import type React from "react"
import type { Metadata } from "next"

const TITLE = "Individual Health Insurance Without ACA Help"
const DESC =
  "Private PPO plans for healthy adults aged 18 to 63 who earn too much for ACA subsidies. See any doctor, no referrals, nationwide networks. Get matched in 90 seconds."
const SHORT_DESC =
  "Private PPO plans for healthy adults priced out of ACA subsidies. See any doctor, no referrals."

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
