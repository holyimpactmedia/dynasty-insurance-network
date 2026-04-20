import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Private PPO Health Plans",
  description:
    "Stop asking permission to see a doctor. Private PPO plans with no referrals, nationwide networks, and doctor freedom. Compare plans with a licensed specialist.",
  openGraph: {
    title: "Private PPO Health Plans | Dynasty Insurance Group",
    description:
      "No referrals. No narrow networks. No restrictions. Private PPO coverage that works anywhere in the US.",
    url: "/ppo",
  },
  twitter: {
    title: "Private PPO Health Plans | Dynasty Insurance Group",
    description:
      "No referrals. No narrow networks. Private PPO coverage that works anywhere in the US.",
  },
}

export default function PPOLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
