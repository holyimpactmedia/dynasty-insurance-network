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
    default: "Dynasty Insurance Group | Private Health Coverage Plans",
    template: "%s | Dynasty Insurance Group",
  },
  description:
    "Private health coverage that accesses PPO networks, for adults and families under 65. See the doctors you want, often without a referral, with broad network access. Get matched in about 90 seconds.",
  keywords: [
    "private health coverage",
    "health coverage with PPO network access",
    "health coverage with provider choice",
    "self-employed health coverage",
    "private health coverage for healthy adults",
    "Dynasty Insurance Group",
  ],
  authors: [{ name: "Holy Impact Media", url: "https://holyimpactmedia.com" }],
  creator: "Holy Impact Media",
  publisher: "Holy Impact Media",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Dynasty Insurance Group",
    title: "Dynasty Insurance Group | Private Health Coverage Plans",
    description:
      "Private health coverage that accesses PPO networks, for adults and families under 65. See the doctors you want, often without a referral.",
    images: [
      {
        url: "/og/home.jpg",
        width: 1200,
        height: 630,
        alt: "Dynasty Insurance Group: Private Health Coverage Plans",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@DynastyInsGroup",
    creator: "@DynastyInsGroup",
    title: "Dynasty Insurance Group | Private Health Coverage Plans",
    description:
      "Private health coverage with broad PPO network access. See the doctors you want, often without a referral. Get matched in about 90 seconds.",
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
                    "Private health coverage that accesses PPO networks, for adults and families under 65.",
                  sameAs: [],
                },
                {
                  "@type": "Organization",
                  "name": "Holy Impact Media, LLC",
                  "url": "https://holyimpactmedia.com",
                  "description": "Marketing and lead generation services",
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
