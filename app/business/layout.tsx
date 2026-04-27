import type React from "react"
import type { Metadata } from "next"

const TITLE = "Small Business Group Health Insurance"
const DESC =
  "Private PPO group plans for businesses with 2 to 50 employees. Up to 50% federal tax credit, 100% deductible employer premiums, and broader networks than ACA marketplace HMOs."
const SHORT_DESC =
  "Group PPO plans for 2 to 50 employees. Up to 50% federal tax credit. 100% deductible."

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: "/business" },
  openGraph: {
    title: `${TITLE} | Dynasty Insurance Group`,
    description: SHORT_DESC,
    url: "/business",
    images: [
      { url: "/og/business.jpg", width: 1200, height: 630, type: "image/jpeg" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} | Dynasty Insurance Group`,
    description: SHORT_DESC,
    images: ["/og/business.jpg"],
  },
}

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
