import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Join the Dynasty Agent Network",
  description:
    "No agent left behind. Join Dynasty Insurance Group and build a career selling private PPO plans with full training, support, and competitive compensation.",
  openGraph: {
    title: "Join the Dynasty Agent Network | Dynasty Insurance Group",
    description:
      "No agent left behind. Build your career with Dynasty. Full training, top compensation, and a team that supports your success.",
    url: "/recruit",
  },
  twitter: {
    title: "Join the Dynasty Agent Network | Dynasty Insurance Group",
    description:
      "No agent left behind. Build your career with Dynasty. Full training and top compensation.",
  },
}

export default function RecruitLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
