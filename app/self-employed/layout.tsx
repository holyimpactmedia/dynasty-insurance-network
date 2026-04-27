import type React from "react"
import type { Metadata } from "next"

const TITLE = "Self-Employed Health Insurance That Deducts"
const DESC =
  "Private PPO plans for 1099 workers, freelancers, and contractors aged 18 to 63. Nationwide coverage, no referrals, and premiums that may be 100% tax deductible."
const SHORT_DESC =
  "Private PPO plans for 1099 workers. Nationwide coverage. Premiums often 100% tax deductible."

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: "/self-employed" },
  openGraph: {
    title: `${TITLE} | Dynasty Insurance Group`,
    description: SHORT_DESC,
    url: "/self-employed",
    images: [
      { url: "/og/self-employed.jpg", width: 1200, height: 630, type: "image/jpeg" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} | Dynasty Insurance Group`,
    description: SHORT_DESC,
    images: ["/og/self-employed.jpg"],
  },
}

export default function SelfEmployedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
