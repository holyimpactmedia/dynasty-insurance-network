import type React from "react"
import type { Metadata } from "next"

const TITLE = "Private Health Coverage Without Asking Permission"
const DESC =
  "Stop asking your HMO for permission to see a doctor. Private health coverage for healthy adults under 65. Coverage that can access a PPO network so you may see the specialists you want without referrals."
const SHORT_DESC =
  "Private health coverage that can access a PPO network. See specialists, often without referrals."

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: "/ppo" },
  openGraph: {
    title: `${TITLE} | Dynasty Insurance Group`,
    description: SHORT_DESC,
    url: "/ppo",
    images: [
      { url: "/og/ppo.jpg", width: 1200, height: 630, type: "image/jpeg" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} | Dynasty Insurance Group`,
    description: SHORT_DESC,
    images: ["/og/ppo.jpg"],
  },
}

export default function PPOLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
