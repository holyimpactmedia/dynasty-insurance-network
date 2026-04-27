import type React from "react"
import type { Metadata } from "next"

const TITLE = "Family Health Insurance Past the Subsidy Cliff"
const DESC =
  "Private PPO family plans for working households who earn just past the ACA subsidy cliff. Keep your pediatrician, see any specialist, and cover the whole family nationwide."
const SHORT_DESC =
  "Family PPO plans for households who earn too much for ACA help. Keep your pediatrician. Nationwide."

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: "/family" },
  openGraph: {
    title: `${TITLE} | Dynasty Insurance Group`,
    description: SHORT_DESC,
    url: "/family",
    images: [
      { url: "/og/family.jpg", width: 1200, height: 630, type: "image/jpeg" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} | Dynasty Insurance Group`,
    description: SHORT_DESC,
    images: ["/og/family.jpg"],
  },
}

export default function FamilyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
