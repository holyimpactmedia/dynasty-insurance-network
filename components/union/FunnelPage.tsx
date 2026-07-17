"use client"

import { useEffect, useRef, useState, type CSSProperties, type ComponentType } from "react"
import {
  ArrowRight, Check, ChevronDown, Wallet, HeartHandshake, Lock, Globe,
} from "lucide-react"
import { Eyebrow, Stars, dotGrid, redStripeField } from "./brand"
import { UnionHeader } from "./UnionHeader"
import { FunnelFooter } from "./FunnelFooter"
import { QuizModal, type Segment } from "./quiz"

// ── Shared funnel landing page (Union · Modern civic) ────────────────────────
// Every funnel page shares this layout and differs only by config copy. All
// CTAs open the Union quiz pre-routed to the funnel's segment.

type IconType = ComponentType<{ width?: number; height?: number; color?: string; strokeWidth?: number }>
export type RichText = { text: string; em?: boolean }[]

export interface FunnelConfig {
  segment: Segment
  ctaLabel: string
  hero: { eyebrow: string; headline: RichText; subhead: string }
  benefits: { eyebrow: string; heading: string; items: { icon: IconType; title: string; desc: string }[] }
  faqHeading: string
  faqs: { q: string; a: string }[]
  finalHeading: string
}

const container: CSSProperties = { maxWidth: 1240, margin: "0 auto", padding: "0 clamp(18px,5vw,48px)" }
const section: CSSProperties = { padding: "clamp(64px,9vw,104px) 0" }
const primaryStyle: CSSProperties = { display: "inline-flex", alignItems: "center", gap: 8, padding: "16px 28px", borderRadius: 12, border: "none", background: "var(--color-red)", color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer", boxShadow: "0 18px 38px -16px rgba(210,35,42,.75)" }

function PrimaryCTA({ children, onClick, big }: { children: React.ReactNode; onClick: () => void; big?: boolean }) {
  return <button onClick={onClick} style={big ? { ...primaryStyle, padding: "19px 38px", fontSize: 17 } : primaryStyle}>{children}<ArrowRight width={17} height={17} /></button>
}
function H2({ children, onDark, style }: { children: React.ReactNode; onDark?: boolean; style?: CSSProperties }) {
  return <h2 className="font-display" style={{ fontWeight: 700, fontSize: "clamp(28px,4.2vw,42px)", lineHeight: 1.08, letterSpacing: "-1.1px", color: onDark ? "#fff" : "var(--color-navy)", textWrap: "balance", ...style }}>{children}</h2>
}

export function FunnelPage({ config }: { config: FunnelConfig }) {
  const [quizOpen, setQuizOpen] = useState(false)
  const [faq, setFaq] = useState(0)
  const [showBar, setShowBar] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)
  const open = () => setQuizOpen(true)

  // Sticky CTA bar appears once the hero is scrolled past (500px).
  useEffect(() => {
    const onScroll = () => setShowBar(window.scrollY > 500)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Publish the bar's real measured height to the document root so the footer
  // can reserve exactly that much space (+ breathing room) at any viewport /
  // label length. Re-observes on resize and orientation change; resets to 0
  // when the bar is absent.
  useEffect(() => {
    const el = barRef.current
    const root = document.documentElement
    if (!el) {
      root.style.setProperty("--sticky-bar-h", "0px")
      return
    }
    const publish = () => root.style.setProperty("--sticky-bar-h", `${el.offsetHeight}px`)
    publish()
    const ro = new ResizeObserver(publish)
    ro.observe(el)
    return () => {
      ro.disconnect()
      root.style.setProperty("--sticky-bar-h", "0px")
    }
  }, [showBar, quizOpen])

  return (
    <div id="top" className="font-body" style={{ background: "#fff", color: "var(--color-body)", overflowX: "hidden" }}>
      {/* Persistent, empty form for the TrustedForm SDK to inject its hidden
          cert field into (the quiz modal is conditionally rendered). */}
      <form
        id="tf-capture"
        aria-hidden="true"
        onSubmit={(e) => e.preventDefault()}
        style={{ position: "absolute", width: 0, height: 0, overflow: "hidden", pointerEvents: "none" }}
      />
      <UnionHeader
        onOpenQuiz={open}
        navLinks={[
          { label: "How it works", href: "#how" },
          { label: "FAQ", href: "#faq" },
        ]}
        ctaLabel={config.ctaLabel}
      />

      {/* Hero */}
      <section style={{ background: "linear-gradient(180deg,#fbfcfe,#fff)" }}>
        <div className="union-center-mobile" style={{ ...container, maxWidth: 820, textAlign: "center", padding: "clamp(52px,7vw,88px) clamp(18px,5vw,48px)" }}>
          <Eyebrow>{config.hero.eyebrow}</Eyebrow>
          <h1 className="font-display" style={{ fontWeight: 700, fontSize: "clamp(33px,5.2vw,52px)", lineHeight: 1.05, letterSpacing: "-1.5px", color: "var(--color-navy)", margin: "16px auto", textWrap: "balance" }}>
            {config.hero.headline.map((s, i) => s.em ? <span key={i} style={{ color: "var(--color-red)" }}>{s.text}</span> : <span key={i}>{s.text}</span>)}
          </h1>
          <p style={{ fontSize: "clamp(16px,2vw,18.5px)", lineHeight: 1.6, maxWidth: 620, margin: "0 auto" }}>{config.hero.subhead}</p>
          <div className="union-row-center-mobile" style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginTop: 26 }}>
            <PrimaryCTA onClick={open}>{config.ctaLabel}</PrimaryCTA>
            <a href="#how" style={{ display: "inline-flex", alignItems: "center", padding: "16px 28px", borderRadius: 12, border: "1.5px solid #d3dbe6", background: "#fff", color: "var(--color-navy)", fontWeight: 700, fontSize: 15, textDecoration: "none" }}>How it works</a>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 22, fontSize: 14, color: "var(--color-ink-muted)" }}>
            <Stars size={16} />
            <span>4.9 / 5 · 1,200+ member reviews · No obligation</span>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section style={{ borderTop: "1px solid #edf1f6", borderBottom: "1px solid #edf1f6", background: "var(--color-surface)", padding: "20px 0" }}>
        <div style={{ ...container, display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
          {[
            { icon: Wallet, t: "100% free to you" },
            { icon: HeartHandshake, t: "Connects you with licensed agents" },
            { icon: Lock, t: "Private & secure" },
            { icon: Globe, t: "Nationwide PPO networks" },
          ].map(({ icon: Icon, t }) => (
            <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "#fff", border: "1px solid var(--color-line)", borderRadius: 100, padding: "9px 17px", fontSize: 13.5, fontWeight: 600, color: "#33445b" }}>
              <Icon width={17} height={17} color="var(--color-red)" strokeWidth={1.9} />{t}
            </span>
          ))}
        </div>
      </section>

      {/* Benefits, built for this segment */}
      <section style={section}>
        <div style={container}>
          <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 44px" }}>
            <Eyebrow>{config.benefits.eyebrow}</Eyebrow>
            <H2 style={{ marginTop: 12 }}>{config.benefits.heading}</H2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,244px),1fr))", gap: 20 }}>
            {config.benefits.items.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="union-card union-center-mobile" style={{ background: "#fff", border: "1px solid var(--color-line)", borderRadius: 18, padding: 28, boxShadow: "0 1px 2px rgba(10,37,64,.04)" }}>
                <span style={{ width: 46, height: 46, borderRadius: 12, background: "var(--color-surface-2)", display: "grid", placeItems: "center" }}>
                  <Icon width={23} height={23} color="var(--color-navy)" strokeWidth={1.7} />
                </span>
                <h3 className="font-display" style={{ fontWeight: 700, fontSize: 18.5, color: "var(--color-navy)", margin: "16px 0 8px", letterSpacing: "-0.3px" }}>{title}</h3>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--color-body)" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" style={{ ...section, background: "var(--color-surface)" }}>
        <div style={container}>
          <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 44px" }}>
            <Eyebrow>How it works</Eyebrow>
            <H2 style={{ marginTop: 12 }}>Getting matched takes about two minutes.</H2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,280px),1fr))", gap: 22 }}>
            {[
              { n: "1", t: "Take the quick quiz", d: "A few simple questions about who needs coverage and where you live. No jargon." },
              { n: "2", t: "We match you", d: "We connect you with a licensed agent and the private PPO plans that fit your situation." },
              { n: "3", t: "Compare & enroll", d: "Review your options side by side, ask questions, and enroll, always free to you." },
            ].map((s) => (
              <div key={s.n} className="union-card union-center-mobile" style={{ background: "#fff", border: "1px solid var(--color-line)", borderRadius: 18, padding: 28, boxShadow: "0 1px 2px rgba(10,37,64,.04)" }}>
                <span className="font-display" style={{ width: 42, height: 42, borderRadius: 10, background: "var(--color-navy)", color: "var(--color-steel)", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 18 }}>{s.n}</span>
                <h3 className="font-display" style={{ fontWeight: 700, fontSize: 18.5, color: "var(--color-navy)", margin: "16px 0 8px", letterSpacing: "-0.3px" }}>{s.t}</h3>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--color-body)" }}>{s.d}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 36 }}><PrimaryCTA onClick={open}>Start my 2-minute quiz</PrimaryCTA></div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={section}>
        <div style={{ ...container, maxWidth: 820 }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <Eyebrow>Questions &amp; answers</Eyebrow>
            <H2 style={{ marginTop: 12 }}>{config.faqHeading}</H2>
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            {config.faqs.map((f, i) => {
              const on = faq === i
              return (
                <div key={f.q} style={{ background: "#fff", border: "1px solid var(--color-line)", borderRadius: 14, overflow: "hidden" }}>
                  <button onClick={() => setFaq(on ? -1 : i)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "20px 22px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
                    <span className="font-display" style={{ fontWeight: 700, fontSize: 16.5, color: "var(--color-navy)" }}>{f.q}</span>
                    <ChevronDown width={20} height={20} color="var(--color-ink-muted)" style={{ transition: "transform .3s", transform: on ? "rotate(180deg)" : "none", flexShrink: 0 }} />
                  </button>
                  {on && <div style={{ padding: "0 22px 20px", fontSize: 15, lineHeight: 1.6, color: "#54637a" }}>{f.a}</div>}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ position: "relative", overflow: "hidden", background: "linear-gradient(158deg,var(--color-navy),#0d2f52)", color: "#fff", padding: "clamp(64px,9vw,104px) 0" }}>
        <div aria-hidden style={{ position: "absolute", inset: 0, ...dotGrid }} />
        <div aria-hidden style={{ position: "absolute", inset: 0, ...redStripeField, opacity: 0.1 }} />
        <div style={{ ...container, position: "relative", maxWidth: 760, textAlign: "center" }}>
          <Stars size={18} color="var(--color-steel)" />
          <p style={{ fontSize: 14, color: "#a9bcd4", marginTop: 8 }}>4.9 / 5 · 1,200+ member reviews</p>
          <H2 onDark style={{ marginTop: 16, fontSize: "clamp(30px,4.6vw,46px)" }}>{config.finalHeading}</H2>
          <p style={{ fontSize: 17, color: "#c4d3e6", marginTop: 16, lineHeight: 1.6 }}>Free, private, and no obligation. Keep your doctors, and finally get coverage that works the way you do.</p>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 28 }}><PrimaryCTA onClick={open} big>{config.ctaLabel}</PrimaryCTA></div>
          <p style={{ fontSize: 13, color: "#8ba0bb", marginTop: 18 }}>No cost to you · Takes ~2 minutes · Your info stays private</p>
        </div>
      </section>

      <FunnelFooter />
      <QuizModal open={quizOpen} segment={config.segment} onClose={() => setQuizOpen(false)} />

      {/* Sticky CTA bar — hidden while the quiz modal (z 100) is open. */}
      {showBar && !quizOpen && (
        <div
          ref={barRef}
          className="union-sticky-bar"
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 89,
            background: "var(--color-navy)",
            borderTop: "1px solid rgba(255,255,255,.12)",
            boxShadow: "0 -8px 30px rgba(10,37,64,.4)",
            padding: "14px clamp(18px,5vw,48px)",
          }}
        >
          <div className="union-sticky-bar-inner">
            <div>
              <p className="font-display" style={{ fontWeight: 700, fontSize: 15.5, color: "#fff" }}>{config.ctaLabel}</p>
              <p style={{ fontSize: 12.5, color: "#a9bcd4", marginTop: 2 }}>Free · Takes 2 minutes · No obligation</p>
            </div>
            <button onClick={open} style={{ ...primaryStyle, padding: "13px 24px", fontSize: 15 }}>
              Get Matched <ArrowRight width={16} height={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
