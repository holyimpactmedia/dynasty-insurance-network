"use client"

import { useState, type CSSProperties } from "react"
import {
  ArrowRight, Check, X, ChevronDown,
  Stethoscope, Globe, RefreshCw, Briefcase, Lock, Clock, HeartHandshake,
  User, Users, Building2, Network, Wallet,
} from "lucide-react"
import { Eyebrow, Stars, dotGrid, redStripeField } from "@/components/union/brand"
import { UnionHeader } from "@/components/union/UnionHeader"
import { UnionFooter } from "@/components/union/UnionFooter"
import { QuizModal, type Segment } from "@/components/union/quiz"

const container: CSSProperties = { maxWidth: 1240, margin: "0 auto", padding: "0 clamp(18px,5vw,48px)" }
const section: CSSProperties = { padding: "clamp(64px,9vw,104px) 0" }

export default function HomePage() {
  const [quizOpen, setQuizOpen] = useState(false)
  const [segment, setSegment] = useState<Segment>("")
  const [faq, setFaq] = useState(0)

  const open = (seg: Segment = "") => {
    setSegment(seg)
    setQuizOpen(true)
  }

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
      <UnionHeader onOpenQuiz={() => open()} />

      {/* HERO */}
      <section style={{ background: "linear-gradient(180deg,#fbfcfe,#fff)" }}>
        <div style={{ ...container, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,340px),1fr))", gap: "clamp(36px,5vw,60px)", alignItems: "center", padding: "clamp(48px,6vw,80px) clamp(18px,5vw,48px) clamp(52px,6vw,84px)" }}>
          <div className="union-center-mobile">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--color-surface-2)", border: "1px solid #e0e7f0", borderRadius: 100, padding: "7px 15px", fontSize: 11.5, fontWeight: 700, letterSpacing: "1.4px", color: "var(--color-navy)" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2e9e5b", boxShadow: "0 0 0 4px rgba(46,158,91,.18)" }} />
              PRIVATE PPO · 100% FREE TO YOU
            </span>
            <h1 className="font-display" style={{ fontWeight: 700, fontSize: "clamp(33px,5.2vw,52px)", lineHeight: 1.05, letterSpacing: "-1.5px", color: "var(--color-navy)", margin: "18px 0", textWrap: "balance" }}>
              Marketplace plans put a wall between you and your doctor.
            </h1>
            <p style={{ fontSize: "clamp(16px,2vw,18.5px)", lineHeight: 1.6, maxWidth: 540 }}>
              Union is a free service that connects working Americans with the right private PPO plans, see any doctor, skip the referrals, and keep nationwide coverage. Answer a few quick questions and we&apos;ll match you with a licensed agent who can help.
            </p>
            <div className="union-row-center-mobile" style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 26 }}>
              <PrimaryCTA onClick={() => open()}>See My PPO Options</PrimaryCTA>
              <a href="#how" style={{ ...secondaryStyle, textDecoration: "none" }}>How it works</a>
            </div>
            <div className="union-row-center-mobile" style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 22, fontSize: 14, color: "var(--color-ink-muted)" }}>
              <Stars size={16} />
              <span>4.9 / 5 · 1,200+ member reviews · No obligation</span>
            </div>
          </div>

          {/* Match card panel */}
          <div style={{ position: "relative", borderRadius: 24, overflow: "hidden", background: "linear-gradient(158deg,var(--color-navy),#103a63)", padding: "clamp(28px,4vw,44px)", minHeight: 380, display: "grid", placeItems: "center", boxShadow: "0 40px 80px -40px rgba(10,37,64,.6)" }}>
            <div aria-hidden style={{ position: "absolute", inset: 0, ...dotGrid }} />
            <div aria-hidden style={{ position: "absolute", inset: 0, ...redStripeField, opacity: 0.12 }} />
            <div style={{ position: "relative", width: "100%", maxWidth: 340, background: "#fff", borderRadius: 18, padding: 22, boxShadow: "0 30px 60px -26px rgba(0,0,0,.6)" }}>
              <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "1px", color: "var(--color-ink-muted)", textTransform: "uppercase" }}>Your matches, in about 2 minutes</p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "10px 0 16px" }}>
                <span className="font-display" style={{ fontWeight: 700, fontSize: 22, color: "var(--color-navy)" }}>3 PPO plans matched</span>
                <span style={{ background: "#eaf6ef", color: "var(--color-success)", fontSize: 10.5, fontWeight: 700, borderRadius: 6, padding: "4px 8px" }}>BEST FIT</span>
              </div>
              {["See any doctor, no referrals", "Nationwide network coverage", "Keep your preferred doctors"].map((t) => (
                <div key={t} style={{ display: "flex", gap: 10, alignItems: "center", padding: "7px 0" }}>
                  <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#dff0e6", display: "grid", placeItems: "center", flexShrink: 0 }}><Check width={13} height={13} color="var(--color-success)" strokeWidth={3} /></span>
                  <span style={{ fontSize: 14, color: "var(--color-navy)", fontWeight: 500 }}>{t}</span>
                </div>
              ))}
              <button onClick={() => open()} style={{ ...primaryStyle, width: "100%", justifyContent: "center", marginTop: 14 }}>View my plans<ArrowRight width={16} height={16} /></button>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
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

      {/* PROBLEM */}
      <section style={section}>
        <div style={container}>
          <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto" }}>
            <Eyebrow>The problem</Eyebrow>
            <H2 style={{ marginTop: 12 }}>The system wasn&apos;t built for people who buy their own coverage.</H2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,244px),1fr))", gap: 20, marginTop: 44 }}>
            {[
              { icon: Network, t: "Narrow networks, endless referrals", d: "HMO and marketplace plans box you into a short list of doctors and make you ask permission to see a specialist." },
              { icon: Wallet, t: "Premiums climb, coverage shrinks", d: "Every year you pay more for a plan that seems to cover less. The math stops making sense." },
              { icon: RefreshCw, t: "COBRA sticker shock", d: "Leaving a job? COBRA can cost a fortune for the same coverage you already had." },
              { icon: Briefcase, t: "Self-employed, on your own", d: "No HR, no group plan, no one to explain your options. Just you and a confusing marketplace." },
            ].map(({ icon: Icon, t, d }) => (
              <Card key={t} className="union-center-mobile">
                <IconChip tint="#fdeef0"><Icon width={23} height={23} color="var(--color-red)" strokeWidth={1.7} /></IconChip>
                <h3 className="font-display" style={cardTitle}>{t}</h3>
                <p style={cardBody}>{d}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SOLUTION */}
      <section style={{ ...section, background: "var(--color-surface)" }}>
        <div style={{ ...container, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,320px),1fr))", gap: "clamp(36px,5vw,56px)", alignItems: "center" }}>
          <div className="union-center-mobile">
            <Eyebrow>The better way</Eyebrow>
            <H2 style={{ marginTop: 12 }}>A private PPO changes the math.</H2>
            <p style={{ fontSize: 16.5, lineHeight: 1.6, marginTop: 16, maxWidth: 480 }}>
              For healthy adults and families under 65, a private PPO often means more freedom for a price that finally makes sense, and a real person to help you choose.
            </p>
            <div style={{ marginTop: 26 }}><PrimaryCTA onClick={() => open()}>See My PPO Options</PrimaryCTA></div>
          </div>
          <div style={{ background: "#fff", border: "1px solid var(--color-line)", borderRadius: 22, padding: "clamp(24px,3vw,34px)", boxShadow: "0 30px 70px -46px rgba(10,37,64,.4)" }}>
            <p className="font-display" style={{ fontWeight: 700, fontSize: 18, color: "var(--color-navy)", marginBottom: 18 }}>What a private PPO unlocks</p>
            {["See any doctor or specialist", "Keep the doctors you trust", "Coverage that travels with you", "A real person to guide you"].map((t) => (
              <div key={t} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 0", borderTop: "1px solid var(--color-line)" }}>
                <span style={{ width: 26, height: 26, borderRadius: "50%", background: "#eaf6ef", display: "grid", placeItems: "center", flexShrink: 0 }}><Check width={15} height={15} color="var(--color-success)" strokeWidth={3} /></span>
                <span style={{ fontSize: 15.5, color: "var(--color-navy)", fontWeight: 500 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section style={section}>
        <div style={container}>
          <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 44px" }}>
            <Eyebrow>See the difference</Eyebrow>
            <H2 style={{ marginTop: 12 }}>The typical setup vs. the private PPO way</H2>
          </div>
          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: 640, borderRadius: 22, overflow: "hidden", border: "1px solid var(--color-line)", boxShadow: "0 30px 70px -46px rgba(10,37,64,.4)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1.1fr" }}>
                <Cell head style={{ background: "#fbfcfe" }} />
                <Cell head style={{ background: "#fbfcfe", color: "var(--color-ink-muted)" }}>Typical narrow-network plan</Cell>
                <Cell head style={{ background: "var(--color-navy)", color: "#fff", borderTop: "4px solid var(--color-red)" }}>Private PPO, matched by Union</Cell>
                {COMPARE.map((r, i) => (
                  <CompareRow key={r.label} row={r} zebra={i % 2 === 1} />
                ))}
              </div>
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 32 }}><PrimaryCTA onClick={() => open()}>See My PPO Options</PrimaryCTA></div>
        </div>
      </section>

      {/* WHICH FITS YOU (paths) */}
      <section id="coverage" style={{ ...section, background: "var(--color-navy)", position: "relative", overflow: "hidden" }}>
        <div aria-hidden style={{ position: "absolute", inset: 0, ...dotGrid }} />
        <div style={{ ...container, position: "relative" }}>
          <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 44px" }}>
            <Eyebrow onDark>Which fits you?</Eyebrow>
            <H2 onDark style={{ marginTop: 12 }}>Start anywhere, the quiz routes you to the right coverage.</H2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,244px),1fr))", gap: 18 }}>
            {PATHS.map((p) => (
              <button key={p.title} onClick={() => open(p.seg)} className="union-path-card" style={{ position: "relative", textAlign: "left", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.14)", borderRadius: 18, padding: 24, cursor: "pointer", color: "#fff" }}>
                {p.popular && <span style={{ position: "absolute", top: 14, right: 14, background: "var(--color-red)", color: "#fff", fontSize: 10, fontWeight: 800, letterSpacing: ".4px", borderRadius: 6, padding: "4px 7px" }}>POPULAR</span>}
                <p.icon width={26} height={26} color="var(--color-steel)" strokeWidth={1.6} />
                <p className="font-display" style={{ fontWeight: 700, fontSize: 19, marginTop: 14 }}>{p.title}</p>
                <p style={{ fontSize: 14, color: "#a9bcd4", marginTop: 6, lineHeight: 1.5 }}>{p.d}</p>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 14, fontSize: 14, fontWeight: 700, color: "var(--color-steel)" }}>Start <ArrowRight width={15} height={15} /></span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={section}>
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
              <Card key={s.n} className="union-center-mobile">
                <span className="font-display" style={{ width: 42, height: 42, borderRadius: 10, background: "var(--color-navy)", color: "var(--color-steel)", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 18 }}>{s.n}</span>
                <h3 className="font-display" style={cardTitle}>{s.t}</h3>
                <p style={cardBody}>{s.d}</p>
              </Card>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 36 }}><PrimaryCTA onClick={() => open()}>Start my 2-minute quiz</PrimaryCTA></div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ ...section, background: "var(--color-surface)" }}>
        <div style={container}>
          <div className="union-row-center-mobile" style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center", justifyContent: "space-between", marginBottom: 44 }}>
            <div className="union-center-mobile" style={{ maxWidth: 560 }}>
              <Eyebrow>Member stories</Eyebrow>
              <H2 style={{ marginTop: 12 }}>Members love the freedom, and the follow-up.</H2>
            </div>
            <div style={{ background: "#fff", border: "1px solid var(--color-line)", borderRadius: 18, padding: "18px 24px", textAlign: "center" }}>
              <p className="font-display" style={{ fontWeight: 700, fontSize: 30, color: "var(--color-navy)" }}>4.9</p>
              <Stars size={15} />
              <p style={{ fontSize: 12.5, color: "var(--color-ink-muted)", marginTop: 4 }}>from 1,200+ verified members</p>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))", gap: 20 }}>
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="union-center-mobile union-card" style={{ margin: 0, background: "#fff", border: "1px solid var(--color-line)", borderRadius: 20, padding: 28 }}>
                <Stars size={16} />
                <blockquote style={{ margin: "14px 0 18px", fontSize: 16, lineHeight: 1.6, color: "#2c3a4c", fontWeight: 500 }}>&ldquo;{t.quote}&rdquo;</blockquote>
                <figcaption style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span className="font-display" style={{ width: 42, height: 42, borderRadius: "50%", background: "var(--color-navy)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 15 }}>{t.initials}</span>
                  <span>
                    <span style={{ display: "block", fontWeight: 700, color: "var(--color-navy)" }}>{t.name}</span>
                    <span style={{ display: "block", fontSize: 13, color: "#7c8a9c" }}>{t.meta}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section id="why" style={section}>
        <div style={container}>
          <div style={{ textAlign: "center", maxWidth: 740, margin: "0 auto 44px" }}>
            <Eyebrow>Why Union</Eyebrow>
            <H2 style={{ marginTop: 12 }}>We&apos;re the shortcut to the right plan, not another insurance company.</H2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,244px),1fr))", gap: 20 }}>
            {[
              { icon: Wallet, t: "100% free to you", d: "You never pay us. Carriers compensate the agents we connect you with." },
              { icon: HeartHandshake, t: "A matchmaker, not a call center", d: "We point you to the right licensed agent, not a floor of salespeople." },
              { icon: Lock, t: "Private & secure", d: "Your information is protected and only shared with the agent who helps you." },
              { icon: Clock, t: "Fast, human follow-up", d: "A real specialist reaches out quickly, usually within minutes on business days." },
            ].map(({ icon: Icon, t, d }) => (
              <Card key={t} className="union-center-mobile">
                <IconChip tint="var(--color-surface-2)"><Icon width={23} height={23} color="var(--color-navy)" strokeWidth={1.7} /></IconChip>
                <h3 className="font-display" style={cardTitle}>{t}</h3>
                <p style={cardBody}>{d}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ ...section, background: "var(--color-surface)" }}>
        <div style={{ ...container, maxWidth: 820 }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <Eyebrow>Questions &amp; answers</Eyebrow>
            <H2 style={{ marginTop: 12 }}>Good questions, straight answers.</H2>
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            {FAQS.map((f, i) => {
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

      {/* FINAL CTA */}
      <section style={{ position: "relative", overflow: "hidden", background: "linear-gradient(158deg,var(--color-navy),#0d2f52)", color: "#fff", padding: "clamp(64px,9vw,104px) 0" }}>
        <div aria-hidden style={{ position: "absolute", inset: 0, ...dotGrid }} />
        <div aria-hidden style={{ position: "absolute", inset: 0, ...redStripeField, opacity: 0.1 }} />
        <div style={{ ...container, position: "relative", maxWidth: 760, textAlign: "center" }}>
          <Stars size={18} color="var(--color-steel)" />
          <p style={{ fontSize: 14, color: "#a9bcd4", marginTop: 8 }}>4.9 / 5 · 1,200+ member reviews</p>
          <H2 onDark style={{ marginTop: 16, fontSize: "clamp(30px,4.6vw,46px)" }}>See your private PPO options in about two minutes.</H2>
          <p style={{ fontSize: 17, color: "#c4d3e6", marginTop: 16, lineHeight: 1.6 }}>Free, private, and no obligation. Keep your doctors, and finally get coverage that works the way you do.</p>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 28 }}><PrimaryCTA onClick={() => open()} big>See My PPO Options</PrimaryCTA></div>
          <p style={{ fontSize: 13, color: "#8ba0bb", marginTop: 18 }}>No cost to you · Takes ~2 minutes · Your info stays private</p>
        </div>
      </section>

      <UnionFooter />

      <QuizModal open={quizOpen} segment={segment} onClose={() => setQuizOpen(false)} />
    </div>
  )
}

// ── local helpers ───────────────────────────────────────────────────────────
const primaryStyle: CSSProperties = { display: "inline-flex", alignItems: "center", gap: 8, padding: "16px 28px", borderRadius: 12, border: "none", background: "var(--color-red)", color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer", boxShadow: "0 18px 38px -16px rgba(210,35,42,.75)" }
const secondaryStyle: CSSProperties = { display: "inline-flex", alignItems: "center", padding: "16px 28px", borderRadius: 12, border: "1.5px solid #d3dbe6", background: "#fff", color: "var(--color-navy)", fontWeight: 700, fontSize: 15, cursor: "pointer" }
const cardTitle: CSSProperties = { fontWeight: 700, fontSize: 18.5, color: "var(--color-navy)", margin: "16px 0 8px", letterSpacing: "-0.3px" }
const cardBody: CSSProperties = { fontSize: 15, lineHeight: 1.6, color: "var(--color-body)" }

function PrimaryCTA({ children, onClick, big }: { children: React.ReactNode; onClick: () => void; big?: boolean }) {
  return <button onClick={onClick} style={big ? { ...primaryStyle, padding: "19px 38px", fontSize: 17 } : primaryStyle}>{children}<ArrowRight width={17} height={17} /></button>
}
function H2({ children, onDark, style }: { children: React.ReactNode; onDark?: boolean; style?: CSSProperties }) {
  return <h2 className="font-display" style={{ fontWeight: 700, fontSize: "clamp(28px,4.2vw,42px)", lineHeight: 1.08, letterSpacing: "-1.1px", color: onDark ? "#fff" : "var(--color-navy)", textWrap: "balance", ...style }}>{children}</h2>
}
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={["union-card", className].filter(Boolean).join(" ")} style={{ background: "#fff", border: "1px solid var(--color-line)", borderRadius: 18, padding: 28, boxShadow: "0 1px 2px rgba(10,37,64,.04)" }}>{children}</div>
}
function IconChip({ children, tint }: { children: React.ReactNode; tint: string }) {
  return <span style={{ width: 46, height: 46, borderRadius: 12, background: tint, display: "grid", placeItems: "center" }}>{children}</span>
}
function Cell({ children, head, style }: { children?: React.ReactNode; head?: boolean; style?: CSSProperties }) {
  return <div style={{ padding: "18px 20px", fontWeight: head ? 700 : 500, fontSize: head ? 14 : 15, ...style }}>{children}</div>
}
function CompareRow({ row, zebra }: { row: (typeof COMPARE)[number]; zebra: boolean }) {
  return (
    <>
      <div style={{ padding: "16px 20px", fontWeight: 600, color: "var(--color-navy)", fontSize: 14.5, borderTop: "1px solid var(--color-line)", background: zebra ? "#fbfcfe" : "#fff" }}>{row.label}</div>
      <div style={{ padding: "16px 20px", borderTop: "1px solid var(--color-line)", background: zebra ? "#fbfcfe" : "#fff", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#f2f4f8", display: "grid", placeItems: "center", flexShrink: 0 }}><X width={13} height={13} color="#9aa7b8" strokeWidth={2.6} /></span>
        <span style={{ fontSize: 13, color: "var(--color-ink-muted)" }}>{row.typical}</span>
      </div>
      <div style={{ padding: "16px 20px", borderTop: "1px solid var(--color-line)", background: "#f6faf7", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#dff0e6", display: "grid", placeItems: "center", flexShrink: 0 }}><Check width={13} height={13} color="var(--color-success)" strokeWidth={3} /></span>
        <span style={{ fontSize: 13, color: "#1f6f43", fontWeight: 600 }}>{row.ppo}</span>
      </div>
    </>
  )
}

const COMPARE = [
  { label: "See any doctor", typical: "In-network only", ppo: "Any doctor nationwide" },
  { label: "Referrals for specialists", typical: "Required", ppo: "Not required" },
  { label: "Nationwide coverage", typical: "Regional", ppo: "Travels with you" },
  { label: "Keep your current doctors", typical: "Often no", ppo: "Usually yes" },
  { label: "Out-of-network care", typical: "Not covered", ppo: "Covered" },
  { label: "A person to guide you", typical: "Call center", ppo: "Licensed agent" },
]

const PATHS: { title: string; d: string; seg: Segment; icon: typeof User; popular?: boolean }[] = [
  { title: "Just me", d: "Individual PPO coverage built around you.", seg: "individual", icon: User, popular: true },
  { title: "My family", d: "One plan that covers everyone at home.", seg: "family", icon: Users },
  { title: "Self-employed / 1099", d: "Real coverage for the way you work.", seg: "self_employed", icon: Briefcase },
  { title: "Losing coverage", d: "A better value than COBRA, for many.", seg: "cobra", icon: RefreshCw },
  { title: "See any doctor", d: "The freedom a PPO is built for.", seg: "ppo", icon: Stethoscope },
  { title: "My business (2-50)", d: "Group benefits that keep great people.", seg: "small_business", icon: Building2 },
]

const TESTIMONIALS = [
  { initials: "MT", name: "Marcus T.", meta: "Self-employed · Dallas, TX", quote: "I kept my doctor, dropped the referrals, and finally understand what I'm paying for. The agent did the heavy lifting." },
  { initials: "RF", name: "The Reyes Family", meta: "Family of four · Phoenix, AZ", quote: "We wanted one plan for the whole family that actually travels with us. Union matched us in minutes and someone called the same day." },
  { initials: "PS", name: "Priya S.", meta: "Left her job · Atlanta, GA", quote: "COBRA was going to cost a fortune. They showed me a private PPO that cost less and kept my specialists in-network." },
]

const FAQS = [
  { q: "Is Union an insurance company?", a: "No. Union Private Healthcare is a free advisory service that connects you with independent licensed insurance agents and carriers who can quote and enroll coverage. We are not an insurer or a government program." },
  { q: "How much does this cost me?", a: "Nothing. Our service is 100% free to you. The licensed agents we connect you with are compensated by the carriers, not by you." },
  { q: "What is a private PPO?", a: "A PPO (Preferred Provider Organization) plan lets you see any doctor or specialist, usually without referrals, with nationwide coverage, including out-of-network care." },
  { q: "Will I have to switch doctors?", a: "Usually not. PPO networks are broad, and a licensed agent will help you find a plan that keeps the doctors you trust in-network wherever possible." },
  { q: "Who actually contacts me?", a: "A licensed insurance agent, a real person, reaches out to review your options, answer questions, and help you enroll if you choose to." },
  { q: "Do I have to buy anything?", a: "No. There's no obligation. You can compare your options and walk away at any time." },
  { q: "Is my information private?", a: "Yes. Your details are protected and only shared with the licensed agent who helps you, never sold to a list." },
]
