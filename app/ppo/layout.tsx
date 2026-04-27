import type React from "react"
import type { Metadata } from "next"

const TITLE = "Private PPO Plans Without Asking Permission"
const DESC =
  "Stop asking your HMO for permission to see a doctor. Private PPO plans for healthy adults under 64. See any specialist, skip the referrals, and pay less than COBRA."
const SHORT_DESC =
  "Private PPO plans. See any specialist. No referrals. Pay less than COBRA."

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
