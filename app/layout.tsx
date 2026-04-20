import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dynastyinsurancegroup.com"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Dynasty Insurance Group | Private PPO Plans. No Referrals.",
    template: "%s | Dynasty Insurance Group",
  },
  description:
    "Dynasty Insurance Group specializes in private PPO health insurance. Nationwide coverage, no referrals required, keep your doctors. Get matched with a licensed specialist in 90 seconds.",
  keywords: [
    "private health insurance",
    "PPO plans",
    "nationwide health coverage",
    "no referral health insurance",
    "COBRA alternative",
    "self-employed health insurance",
    "family PPO plan",
    "Dynasty Insurance Group",
  ],
  authors: [{ name: "Dynasty Insurance Group", url: siteUrl }],
  creator: "Dynasty Insurance Group",
  publisher: "Dynasty Insurance Group",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Dynasty Insurance Group",
    title: "Dynasty Insurance Group | Private PPO Plans. No Referrals.",
    description:
      "Nationwide private PPO coverage. See any doctor. No referrals. No narrow networks. Get matched with a licensed specialist in 90 seconds.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Dynasty Insurance Group - Private PPO Health Insurance",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@DynastyInsGroup",
    creator: "@DynastyInsGroup",
    title: "Dynasty Insurance Group | Private PPO Plans. No Referrals.",
    description:
      "Nationwide private PPO coverage. See any doctor. No referrals. Get matched with a licensed specialist in 90 seconds.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className={`font-sans antialiased overflow-x-hidden`}>
        {children}
        <Analytics />
        {/* TrustedForm Script */}
        <script
          src="https://cert.trustedform.com/trustedform.js"
          type="text/javascript"
          async
        ></script>
      </body>
    </html>
  )
}
