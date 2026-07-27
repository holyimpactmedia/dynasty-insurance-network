import type React from "react"
import type { Metadata } from "next"
import { Space_Grotesk, Public_Sans } from "next/font/google"
import Script from "next/script"
import { Analytics } from "@vercel/analytics/next"
import { MetaPixel } from "@/components/meta/MetaPixel"
import "./globals.css"

// Union · Modern civic type system: Space Grotesk (display) + Public Sans (body).
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
})
const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-public-sans",
  display: "swap",
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://unionprivatehealthcare.com"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Union Private Healthcare | Private PPO Coverage, Matched Free",
    template: "%s | Union Private Healthcare",
  },
  description:
    "Union Private Healthcare is a free service that connects working Americans with the right private PPO plans, see any doctor, skip referrals, keep nationwide coverage. Get matched with a licensed agent in about 2 minutes.",
  keywords: [
    "private health insurance",
    "PPO plans",
    "private PPO health insurance",
    "no referral health insurance",
    "COBRA alternative",
    "self-employed health insurance",
    "family PPO plan",
    "small business group health insurance",
    "private health insurance for healthy adults",
    "Union Private Healthcare",
  ],
  authors: [{ name: "Holy Impact Media", url: "https://holyimpactmedia.com" }],
  creator: "Holy Impact Media",
  publisher: "Holy Impact Media",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Union Private Healthcare",
    title: "Union Private Healthcare | Private PPO Coverage, Matched Free",
    description:
      "A free service that connects working Americans with the right private PPO plans. See any doctor. No referrals. Nationwide coverage.",
    images: [
      {
        url: "/og/home.jpg",
        width: 1200,
        height: 630,
        alt: "Union Private Healthcare: private PPO coverage, matched free",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Union Private Healthcare | Private PPO Coverage, Matched Free",
    description:
      "A free service that connects you with the right private PPO plans and a licensed agent. See any doctor. No referrals.",
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
    <html lang="en" className={`${spaceGrotesk.variable} ${publicSans.variable} bg-background`}>
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
                  name: "Union Private Healthcare",
                  url: siteUrl,
                  description:
                    "A free advisory service that connects working Americans with private PPO plans and the licensed agents who can help. Not an insurer or a government program.",
                  parentOrganization: { "@type": "Organization", name: "Holy Impact Media, LLC" },
                  sameAs: [],
                },
                {
                  "@type": "Organization",
                  "name": "Holy Impact Media, LLC",
                  "url": "https://holyimpactmedia.com",
                  "description":
                    "Operating company, doing business as Union Private Healthcare; marketing and lead-generation services.",
                },
                {
                  "@type": "WebSite",
                  "@id": `${siteUrl}/#website`,
                  url: siteUrl,
                  name: "Union Private Healthcare",
                  publisher: { "@id": `${siteUrl}/#organization` },
                  inLanguage: "en-US",
                },
              ],
            }),
          }}
        />
        {children}
        <Analytics />
        {/* Meta Pixel base code + PageView (no-ops until the pixel id is set). */}
        <MetaPixel />
        {/* TrustedForm SDK — injects the xxTrustedFormCertUrl field into forms
            on the page and mints a TCPA certificate (served from api.trustedform.com). */}
        <Script id="trustedform" strategy="afterInteractive">
          {`(function() {
      var tf = document.createElement('script');
      tf.type = 'text/javascript';
      tf.async = true;
      tf.src = 'https://api.trustedform.com/trustedform.js'
        + '?field=xxTrustedFormCertUrl'
        + '&ping_field=xxTrustedFormPingUrl'
        + '&l=' + new Date().getTime() + Math.random();
      var s = document.getElementsByTagName('script')[0];
      s.parentNode.insertBefore(tf, s);
    })();`}
        </Script>
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://api.trustedform.com/ns.gif" alt="" />
        </noscript>
      </body>
    </html>
  )
}
