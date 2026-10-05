import type React from "react"
import type { Metadata } from "next"

const TITLE = "Self-Employed Health Coverage"
const DESC =
  "Private health coverage for healthy 1099 workers, freelancers, and contractors under 65. Coverage that can access a PPO network, with your options explained by a licensed agent."
const SHORT_DESC =
  "Private health coverage for 1099 workers. Coverage that can access a PPO network. A licensed agent walks you through your options."

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
