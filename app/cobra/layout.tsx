import type React from "react"
import type { Metadata } from "next"

const TITLE = "COBRA Alternatives That Can Cost Half"
const DESC =
  "Healthy adults under 65 can replace COBRA with a private PPO and keep their doctors. Many save 30 to 60% per month versus COBRA. Compare options with a licensed specialist."
const SHORT_DESC =
  "Replace COBRA with a private PPO. Keep your doctors. Many save 30 to 60% per month."

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: "/cobra" },
  openGraph: {
    title: `${TITLE} | Union Private Healthcare`,
    description: SHORT_DESC,
    url: "/cobra",
    images: [
      { url: "/og/cobra.jpg", width: 1200, height: 630, type: "image/jpeg" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} | Union Private Healthcare`,
    description: SHORT_DESC,
    images: ["/og/cobra.jpg"],
  },
}

export default function COBRALayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
