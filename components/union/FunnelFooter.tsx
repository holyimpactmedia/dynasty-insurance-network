import { UnionLogo } from "./brand"

// Self-contained footer for funnel (paid-traffic) pages. Unlike UnionFooter it
// carries NO Coverage/Company columns and NO links to sibling funnels — every
// exit from a matched funnel is a wasted ad click. Legal links only, opened in a
// new tab so the visitor never leaves the funnel. The disclaimer paragraph is
// copied verbatim from UnionFooter (DBA disclosure + no-gov-affiliation + TCPA
// consent recital). paddingBottom clears the fixed sticky CTA bar.

const LEGAL = [
  { label: "Terms of Use", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Do Not Sell / Share My Info", href: "/privacy" },
]

export function FunnelFooter() {
  return (
    <footer
      style={{
        background: "var(--color-navy-deep)",
        color: "#8ba0bb",
        paddingTop: "clamp(48px,6vw,72px)",
        paddingLeft: "clamp(18px,5vw,48px)",
        paddingRight: "clamp(18px,5vw,48px)",
        paddingBottom: 84,
      }}
    >
      <div className="union-center-mobile" style={{ maxWidth: 1240, margin: "0 auto" }}>
        <div style={{ maxWidth: 300, paddingBottom: 28, borderBottom: "1px solid rgba(255,255,255,.1)" }}>
          <UnionLogo size={38} onDark />
          <p style={{ fontSize: 13.5, lineHeight: 1.6, marginTop: 16 }}>
            A free service that connects working Americans with the right private PPO plans and the licensed agents who can help.
          </p>
        </div>

        <p style={{ fontSize: 11.5, lineHeight: 1.7, color: "#5f7492", marginTop: 28 }}>
          Union Private Healthcare is a brand of Holy Impact Media, LLC, an advisory and lead-generation service, not an insurance agency, insurer, or government program. We are not affiliated with or endorsed by any government entity, Healthcare.gov, the Health Insurance Marketplace, or the Centers for Medicare &amp; Medicaid Services. We connect consumers with independent licensed insurance agents, including Dynasty Forever LLC, and carriers who can provide quotes and enroll coverage. By submitting a form you provide your prior express written consent to be contacted by Holy Impact Media, LLC (DBA Union Private Healthcare) and its licensed insurance partners at the number and email provided, including by autodialed or prerecorded calls and text messages, about health coverage options. Consent is not a condition of any purchase. Message and data rates may apply; reply STOP to opt out. Plan availability, pricing, and eligibility vary by state and are determined by the carrier.
        </p>

        <div
          className="union-row-center-mobile"
          style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between", marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,.1)", fontSize: 12.5, color: "#7f95b2" }}
        >
          <span>© 2026 Holy Impact Media, LLC. All rights reserved.</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 18, justifyContent: "center" }}>
            {LEGAL.map((l) => (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#8ba0bb", textDecoration: "none", fontSize: 12.5 }}
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
