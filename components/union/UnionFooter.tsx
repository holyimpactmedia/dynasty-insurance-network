import { UnionLogo } from "./brand"

// NOTE: the fine-print disclaimer + consent language below is a DRAFT under the
// new entity model (Holy Impact Media, LLC DBA Union Private Healthcare;
// advisory/lead-gen, not an insurer or government program; routes to licensed
// agents incl. Dynasty Forever LLC). Pending owner/legal review before launch.

const COVERAGE = [
  { label: "Individual", href: "/individual" },
  { label: "Family", href: "/family" },
  { label: "Self-employed", href: "/self-employed" },
  { label: "COBRA alternatives", href: "/cobra" },
  { label: "PPO plans", href: "/ppo" },
  { label: "Small business", href: "/business" },
]
const COMPANY = [
  { label: "How it works", href: "#how" },
  { label: "Why Union", href: "#why" },
  { label: "FAQ", href: "#faq" },
]
const LEGAL = [
  { label: "Terms of Use", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Do Not Sell / Share My Info", href: "/privacy" },
]

function Col({ head, links }: { head: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <p className="font-display" style={{ fontWeight: 700, fontSize: 13, color: "#fff", marginBottom: 14 }}>{head}</p>
      <ul style={{ display: "grid", gap: 9, listStyle: "none", padding: 0, margin: 0 }}>
        {links.map((l) => (
          <li key={l.label}><a href={l.href} style={{ color: "#8ba0bb", textDecoration: "none", fontSize: 14 }}>{l.label}</a></li>
        ))}
      </ul>
    </div>
  )
}

export function UnionFooter() {
  return (
    <footer style={{ background: "var(--color-navy-deep)", color: "#8ba0bb", padding: "clamp(48px,6vw,72px) clamp(18px,5vw,48px) 40px" }}>
      <div className="union-center-mobile" style={{ maxWidth: 1240, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 36, paddingBottom: 36, borderBottom: "1px solid rgba(255,255,255,.1)" }}>
          <div style={{ maxWidth: 300 }}>
            <UnionLogo size={38} onDark />
            <p style={{ fontSize: 13.5, lineHeight: 1.6, marginTop: 16 }}>
              A free service that connects working Americans with the right private PPO plans and the licensed agents who can help.
            </p>
          </div>
          <Col head="Coverage" links={COVERAGE} />
          <Col head="Company" links={COMPANY} />
          <Col head="Legal" links={LEGAL} />
        </div>

        <p style={{ fontSize: 11.5, lineHeight: 1.7, color: "#5f7492", marginTop: 28 }}>
          Union Private Healthcare is a brand of Holy Impact Media, LLC, an advisory and lead-generation service, not an insurance agency, insurer, or government program. We are not affiliated with or endorsed by any government entity, Healthcare.gov, the Health Insurance Marketplace, or the Centers for Medicare &amp; Medicaid Services. We connect consumers with independent licensed insurance agents, including Dynasty Forever LLC, and carriers who can provide quotes and enroll coverage. By submitting a form you provide your prior express written consent to be contacted by Holy Impact Media, LLC (DBA Union Private Healthcare) and its licensed insurance partners at the number and email provided, including by autodialed or prerecorded calls and text messages, about health coverage options. Consent is not a condition of any purchase. Message and data rates may apply; reply STOP to opt out. Plan availability, pricing, and eligibility vary by state and are determined by the carrier.
        </p>

        <div className="union-row-center-mobile" style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,.1)", fontSize: 12.5, color: "#7f95b2" }}>
          <span>© 2026 Holy Impact Media, LLC. All rights reserved.</span>
          <span>Made for working Americans.</span>
        </div>
      </div>
    </footer>
  )
}
