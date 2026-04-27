import type React from "react"
import type { Metadata } from "next"

const TITLE = "COBRA Alternatives at Half the Cost"
const DESC =
  "Healthy adults under 64 can replace COBRA with a private PPO and keep their doctors. Often 30 to 60% less per month than COBRA. Compare options with a licensed specialist."
const SHORT_DESC =
  "Replace COBRA with a private PPO. Keep your doctors. Often 30 to 60% less per month."

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
