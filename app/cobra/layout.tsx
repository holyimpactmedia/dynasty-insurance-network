import type React from "react"
import type { Metadata } from "next"

const TITLE = "Private Health Coverage After Job Loss"
const DESC =
  "Healthy adults under 65 losing job-based coverage can explore private health coverage that accesses a PPO network and may keep their doctors. Review your options with a licensed agent."
const SHORT_DESC =
  "Losing job-based coverage? Explore private health coverage with a licensed agent."

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: "/cobra" },
  openGraph: {
    title: `${TITLE} | Dynasty Insurance Group`,
    description: SHORT_DESC,
    url: "/cobra",
    images: [
      { url: "/og/cobra.jpg", width: 1200, height: 630, type: "image/jpeg" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} | Dynasty Insurance Group`,
    description: SHORT_DESC,
    images: ["/og/cobra.jpg"],
  },
}

export default function COBRALayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
