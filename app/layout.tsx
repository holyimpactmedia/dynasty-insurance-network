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
    default: "Dynasty Insurance Group | Real Coverage for the Earners the Marketplace Forgets",
    template: "%s | Dynasty Insurance Group",
  },
  description:
    "Private PPO plans for healthy Americans aged 18 to 63 who earn too much for ACA subsidies. See any doctor, no referrals, nationwide networks. Get matched with a licensed specialist in 90 seconds.",
  keywords: [
    "private health insurance",
    "PPO plans",
    "ACA subsidy alternative",
    "no referral health insurance",
    "COBRA alternative",
    "self-employed health insurance",
    "family PPO plan",
    "small business group health insurance",
    "private health insurance for healthy adults",
    "Dynasty Insurance Group",
  ],
  authors: [{ name: "Dynasty Insurance Group", url: siteUrl }],
  creator: "Dynasty Insurance Group",
  publisher: "Dynasty Insurance Group",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Dynasty Insurance Group",
    title: "Dynasty Insurance Group | Real Coverage for the Earners the Marketplace Forgets",
    description:
      "Private PPO plans for healthy Americans aged 18 to 63 who earn too much for ACA subsidies. See any doctor. No referrals.",
    images: [
      {
        url: "/og/home.jpg",
        width: 1200,
        height: 630,
        alt: "Dynasty Insurance Group: Real Coverage for the Earners the Marketplace Forgets",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@DynastyInsGroup",
    creator: "@DynastyInsGroup",
    title: "Dynasty Insurance Group | Real Coverage for the Earners the Marketplace Forgets",
    description:
      "Private PPO plans for healthy adults priced out of ACA subsidies. See any doctor. No referrals. Match in 90 seconds.",
    images: ["/og/home.jpg"],
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
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
        sizes: "32x32",
        type: "image/png",
      },
    ],
    apple: { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
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
        {/* JSON-LD: Organization + WebSite for richer search results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": `${siteUrl}/#organization`,
                  name: "Dynasty Insurance Group",
                  url: siteUrl,
                  logo: `${siteUrl}/images/logo.avif`,
                  description:
                    "Private PPO health insurance for healthy Americans aged 18 to 63 who earn too much for ACA subsidies.",
                  sameAs: [],
                },
                {
                  "@type": "WebSite",
                  "@id": `${siteUrl}/#website`,
                  url: siteUrl,
                  name: "Dynasty Insurance Group",
                  publisher: { "@id": `${siteUrl}/#organization` },
                  inLanguage: "en-US",
                },
              ],
            }),
          }}
        />
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
