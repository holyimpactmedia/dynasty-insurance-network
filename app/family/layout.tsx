import type React from "react"
import type { Metadata } from "next"

const TITLE = "Private Family Health Coverage"
const DESC =
  "Private health coverage for working households that can access a PPO network. You may be able to keep your doctors, explore specialist options, and review coverage for your whole family with a licensed agent."
const SHORT_DESC =
  "Private family health coverage that can access a PPO network. You may keep your doctors. Free consultation."

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
