"use client"

import { useEffect, useState } from "react"
import { X, User, Users, Briefcase, RefreshCw, Building2, ArrowRight, Check, AlertCircle } from "lucide-react"
import { UnionMark } from "./brand"
import { zipToStateName } from "@/lib/geo/zipToState"

// "" = homepage entry (shows the "who is this for" step). A non-empty value is a
// pre-routed segment (funnel pages / homepage path cards) that skips that step.
export type Segment = "" | "individual" | "family" | "self_employed" | "cobra" | "small_business" | "ppo"

const SEGMENTS: { value: Exclude<Segment, "" | "ppo">; title: string; sub: string; icon: typeof User }[] = [
  { value: "individual", title: "Just me", sub: "Individual coverage", icon: User },
  { value: "family", title: "Me and my family", sub: "Cover the household", icon: Users },
  { value: "self_employed", title: "I'm self-employed", sub: "1099 / business owner", icon: Briefcase },
  { value: "cobra", title: "I'm losing my coverage", sub: "COBRA or job change", icon: RefreshCw },
  { value: "small_business", title: "My small business", sub: "2 to 50 employees", icon: Building2 },
]

const SEGMENT_TO_FUNNEL: Record<string, string> = {
  individual: "individual",
  family: "family",
  self_employed: "self_employed",
  cobra: "cobra",
  small_business: "small_business",
  ppo: "ppo",
}

// Per-segment qualifying questions — kept for lead quality on funnel/paid traffic.
type DetailQuestion = { key: string; question: string; options: string[] }
const DETAIL_QUESTIONS: Record<string, DetailQuestion[]> = {
  individual: [
    { key: "qualifyingEvent", question: "What brought you here today?", options: ["Lost job coverage", "Moving or a life change", "Currently uninsured", "Open enrollment shopping"] },
  ],
  family: [
    { key: "familyComposition", question: "Who needs coverage?", options: ["2 adults", "2 adults and kids", "Single parent and kids", "Just the kids"] },
  ],
  self_employed: [
    { key: "workSituation", question: "How would you describe your work?", options: ["Full-time freelancer", "1099 contractor", "Gig worker", "Business owner"] },
    { key: "priority", question: "What matters most in a plan?", options: ["Lowest monthly premium", "HSA and tax savings", "Low deductible", "Maximum flexibility"] },
  ],
  cobra: [
    { key: "cobraSituation", question: "What's your COBRA situation?", options: ["Just got the COBRA notice", "On COBRA now, too expensive", "COBRA ending soon", "Exploring options"] },
    { key: "cobraCost", question: "What are you paying for COBRA each month?", options: ["Under $400", "$400 to $700", "$700 to $1,200", "Over $1,200"] },
  ],
  small_business: [
    { key: "businessSize", question: "How many employees do you have?", options: ["Just me", "2 to 5", "6 to 15", "16 to 50"] },
    { key: "timeline", question: "When do you want coverage to start?", options: ["As soon as possible", "Next 30 days", "Next quarter", "Just exploring"] },
  ],
  ppo: [
    { key: "currentSituation", question: "What's your current coverage?", options: ["HMO or narrow network", "No coverage right now", "On COBRA", "Employer plan I want to replace"] },
  ],
}

const accent = "var(--color-red)"

type StepItem = { kind: "who" } | { kind: "detail"; detail: DetailQuestion } | { kind: "location" } | { kind: "details" } | { kind: "contact" }

export function QuizModal({
  open,
  segment = "",
  onClose,
}: {
  open: boolean
  segment?: Segment
  onClose: () => void
}) {
  const [step, setStep] = useState(0)
  const [a, setA] = useState<Record<string, string>>({})
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setDone(false)
      setError(null)
      setSubmitting(false)
      setA(segment ? { segment } : {})
      setStep(0)
    }
  }, [open, segment])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  // Build the active step list. Detail steps depend on the effective segment
  // (the pre-routed one, or the one chosen on the "who" step).
  const effSeg = segment || a.segment || ""
  const details = DETAIL_QUESTIONS[effSeg] ?? []
  const steps: StepItem[] = [
    ...(segment ? [] : [{ kind: "who" } as StepItem]),
    ...details.map((d) => ({ kind: "detail", detail: d }) as StepItem),
    { kind: "location" },
    { kind: "details" },
    { kind: "contact" },
  ]
  const total = steps.length
  const cur = steps[Math.min(step, total - 1)]

  const set = (k: string, v: string) => setA((p) => ({ ...p, [k]: v }))
  const next = () => setStep((s) => Math.min(s + 1, total - 1))
  const back = () => setStep((s) => Math.max(s - 1, 0))

  const contactValid =
    (a.firstName || "").trim().length >= 2 &&
    (a.lastName || "").trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email || "") &&
    (a.phone || "").replace(/\D/g, "").length === 10 &&
    a.consent === "yes"

  const valid =
    cur.kind === "who" ? !!a.segment
    : cur.kind === "detail" ? !!a[cur.detail.key]
    : cur.kind === "location" ? /^\d{5}$/.test(a.zip || "") && Number(a.age) >= 18 && Number(a.age) <= 64
    : cur.kind === "details" ? !!a.household && !!a.incomeRange && !!a.hasCoverage && !!a.tobacco
    : contactValid

  const needsContinue = cur.kind === "location" || cur.kind === "details" || cur.kind === "contact"
  const isLast = step === total - 1

  const submit = async () => {
    if (submitting) return
    setSubmitting(true)
    setError(null)
    try {
      // Name-based query: the SDK creates the field with name="xxTrustedFormCertUrl"
      // but id="xxTrustedFormCertUrl_0" (a form-index suffix), so getElementById
      // by that id returns null. Query by name instead.
      const tfInput = document.querySelector(
        'input[name="xxTrustedFormCertUrl"]',
      ) as HTMLInputElement | null
      const trustedFormCertUrl = tfInput?.value || null
      const params = new URLSearchParams(window.location.search)
      // Everything that isn't a top-level lead field becomes quizAnswers — this
      // carries the segment + per-segment detail answers + universal fields.
      const { firstName, lastName, email, phone, consent, age, ...quizRest } = a

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          age,
          state: zipToStateName(a.zip), // ZIP kept raw in quizAnswers below
          householdSize: a.household,
          incomeRange: a.incomeRange,
          tcpaConsent: a.consent === "yes",
          trustedFormCertUrl,
          funnelType: SEGMENT_TO_FUNNEL[a.segment] || "ppo",
          quizAnswers: { ...quizRest, source: "quiz" },
          utmSource: params.get("utm_source"),
          utmMedium: params.get("utm_medium"),
          utmCampaign: params.get("utm_campaign"),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.")
      setDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const progress = (Math.min(step + 1, total) / total) * 100

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(6,20,38,.6)", backdropFilter: "blur(5px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{ width: "min(560px,100%)", maxHeight: "94vh", overflowY: "auto", background: "#fff", borderRadius: 22, boxShadow: "0 40px 90px -30px rgba(0,0,0,.6)" }}
      >
        {/* Sticky header */}
        <div style={{ position: "sticky", top: 0, background: "#fff", borderBottom: "1px solid var(--color-line)", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, borderTopLeftRadius: 22, borderTopRightRadius: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <UnionMark size={34} />
            <span style={{ fontSize: 12.5, color: "var(--color-ink-muted)", fontWeight: 600 }}>100% free · secure · no obligation</span>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ width: 34, height: 34, borderRadius: 9, border: "1px solid var(--color-line)", background: "#fff", display: "grid", placeItems: "center", cursor: "pointer" }}>
            <X width={16} height={16} color="var(--color-navy)" />
          </button>
        </div>

        {!done && (
          <div style={{ padding: "16px 24px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, fontWeight: 700 }}>
              <span style={{ color: "var(--color-navy)" }}>Step {Math.min(step + 1, total)} of {total}</span>
              <span style={{ color: "var(--color-ink-muted)" }}>Takes ~2 minutes</span>
            </div>
            <div style={{ height: 6, borderRadius: 100, background: "#eef1f6", marginTop: 8, overflow: "hidden" }}>
              <div style={{ width: `${progress}%`, height: "100%", background: accent, transition: "width .4s cubic-bezier(.4,0,.2,1)" }} />
            </div>
          </div>
        )}

        <div style={{ padding: 24 }}>
          {done ? <Success onClose={onClose} /> : (
            <>
              {cur.kind === "who" && <Step0 a={a} set={(v) => { set("segment", v); next() }} />}
              {cur.kind === "detail" && <DetailStep q={cur.detail} value={a[cur.detail.key]} onSelect={(v) => { set(cur.detail.key, v); next() }} />}
              {cur.kind === "location" && <Step1 a={a} set={set} />}
              {cur.kind === "details" && <Step2 a={a} set={set} />}
              {cur.kind === "contact" && <Step3 a={a} set={set} />}

              {(step > 0 || needsContinue) && (
                <>
                  {error && (
                    <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 11, background: "#fdeef0", border: "1px solid #f6c9ce", color: "#b31d24", fontSize: 13.5, display: "flex", alignItems: "center", gap: 8 }}>
                      <AlertCircle width={16} height={16} style={{ flexShrink: 0 }} /> {error}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
                    {step > 0 && <button onClick={back} disabled={submitting} style={{ padding: "13px 20px", borderRadius: 11, border: "1.5px solid #d3dbe6", background: "#fff", color: "var(--color-navy)", fontWeight: 700, fontSize: 15, cursor: submitting ? "not-allowed" : "pointer" }}>Back</button>}
                    {needsContinue && (
                      <button
                        onClick={isLast ? submit : next}
                        disabled={!valid || submitting}
                        style={{ flex: 1, padding: "13px 20px", borderRadius: 11, border: "none", fontWeight: 700, fontSize: 15, color: "#fff", cursor: valid && !submitting ? "pointer" : "not-allowed", background: valid && !submitting ? accent : "#c3ccd8", boxShadow: valid && !submitting ? "0 14px 30px -14px rgba(210,35,42,.75)" : "none", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                      >
                        {submitting ? "Submitting…" : isLast ? "See My Matches" : "Continue"}
                        {valid && !submitting && <ArrowRight width={17} height={17} />}
                      </button>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function QTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h3 className="font-display" style={{ fontWeight: 700, fontSize: 22, color: "var(--color-navy)", letterSpacing: "-0.5px" }}>{children}</h3>
      {hint && <p style={{ color: "var(--color-ink-muted)", fontSize: 14, marginTop: 6 }}>{hint}</p>}
    </div>
  )
}

const optionBtn = (on: boolean): React.CSSProperties => ({
  display: "block", width: "100%", textAlign: "left", padding: 14, borderRadius: 14,
  border: `1.5px solid ${on ? accent : "#e2e8f1"}`, background: on ? "#f6f9ff" : "#fff",
  fontWeight: 600, fontSize: 15, color: "var(--color-navy)", cursor: "pointer",
})

function DetailStep({ q, value, onSelect }: { q: DetailQuestion; value?: string; onSelect: (v: string) => void }) {
  return (
    <>
      <QTitle>{q.question}</QTitle>
      <div style={{ display: "grid", gap: 10 }}>
        {q.options.map((o) => (
          <button key={o} onClick={() => onSelect(o)} style={optionBtn(value === o)}>{o}</button>
        ))}
      </div>
    </>
  )
}

function Step0({ a, set }: { a: Record<string, string>; set: (v: string) => void }) {
  return (
    <>
      <QTitle hint="This routes you to the right coverage.">Who is this coverage for?</QTitle>
      <div style={{ display: "grid", gap: 10 }}>
        {SEGMENTS.map((s) => {
          const on = a.segment === s.value
          const Icon = s.icon
          return (
            <button key={s.value} onClick={() => set(s.value)} style={{ display: "flex", alignItems: "center", gap: 14, textAlign: "left", padding: 14, borderRadius: 14, border: `1.5px solid ${on ? accent : "#e2e8f1"}`, background: on ? "#f6f9ff" : "#fff", cursor: "pointer" }}>
              <span style={{ width: 40, height: 40, borderRadius: 10, background: "#eef2f8", display: "grid", placeItems: "center", flexShrink: 0 }}>
                <Icon width={20} height={20} color="var(--color-navy)" strokeWidth={1.7} />
              </span>
              <span>
                <span style={{ display: "block", fontWeight: 700, fontSize: 15.5, color: "var(--color-navy)" }}>{s.title}</span>
                <span style={{ display: "block", fontSize: 13, color: "var(--color-ink-muted)" }}>{s.sub}</span>
              </span>
            </button>
          )
        })}
      </div>
    </>
  )
}

const field: React.CSSProperties = { width: "100%", padding: "13px 14px", borderRadius: 11, border: "1.5px solid #dbe3ee", fontSize: 15, color: "var(--color-navy)", outline: "none", background: "#fff" }
const label: React.CSSProperties = { fontWeight: 600, fontSize: 13, color: "#42536b", display: "block", marginBottom: 7 }

function Step1({ a, set }: { a: Record<string, string>; set: (k: string, v: string) => void }) {
  return (
    <>
      <QTitle>Where are you located?</QTitle>
      <div style={{ display: "grid", gap: 14 }}>
        <div><label style={label}>ZIP code</label><input inputMode="numeric" maxLength={5} value={a.zip || ""} onChange={(e) => set("zip", e.target.value.replace(/\D/g, ""))} placeholder="e.g. 30301" style={field} /></div>
        <div><label style={label}>Age</label><input inputMode="numeric" value={a.age || ""} onChange={(e) => set("age", e.target.value.replace(/\D/g, ""))} placeholder="Designed for adults & families under 65" style={field} /></div>
      </div>
    </>
  )
}

function Toggle({ q, hint, k, opts, a, set }: { q: string; hint?: string; k: string; opts: string[]; a: Record<string, string>; set: (k: string, v: string) => void }) {
  return (
    <div>
      <label style={label}>{q}</label>
      {hint && <p style={{ fontSize: 12, color: "var(--color-ink-muted)", marginTop: -2, marginBottom: 8 }}>{hint}</p>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {opts.map((o) => {
          const on = a[k] === o
          return <button key={o} onClick={() => set(k, o)} style={{ padding: "12px", borderRadius: 11, border: `1.5px solid ${on ? accent : "#e2e8f1"}`, background: on ? "#f6f9ff" : "#fff", fontWeight: 600, color: "var(--color-navy)", cursor: "pointer" }}>{o}</button>
        })}
      </div>
    </div>
  )
}

function Step2({ a, set }: { a: Record<string, string>; set: (k: string, v: string) => void }) {
  return (
    <>
      <QTitle>A few quick details.</QTitle>
      <div style={{ display: "grid", gap: 16 }}>
        <div><label style={label}>How many people need coverage?</label>
          <select value={a.household || ""} onChange={(e) => set("household", e.target.value)} style={{ ...field, cursor: "pointer" }}>
            <option value="" disabled>Select…</option>
            {["Just 1", "2", "3", "4", "5 or more"].map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label style={label}>Estimated annual household income</label>
          <select value={a.incomeRange || ""} onChange={(e) => set("incomeRange", e.target.value)} style={{ ...field, cursor: "pointer" }}>
            <option value="" disabled>Select…</option>
            {["Under $30,000", "$30,000 to $50,000", "$50,000 to $75,000", "$75,000 to $100,000", "Over $100,000"].map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <p style={{ fontSize: 12, color: "var(--color-ink-muted)", marginTop: 6 }}>This helps your agent find plans that fit your budget.</p>
        </div>
        <Toggle q="Do you have health coverage right now?" k="hasCoverage" opts={["Yes", "No"]} a={a} set={set} />
        <Toggle q="Do you use tobacco products?" hint="This helps us show you accurate plan pricing." k="tobacco" opts={["No", "Yes"]} a={a} set={set} />
      </div>
    </>
  )
}

function Step3({ a, set }: { a: Record<string, string>; set: (k: string, v: string) => void }) {
  return (
    <>
      <QTitle hint="A licensed agent will reach out with your matches.">Where should your matches go?</QTitle>
      <div style={{ display: "grid", gap: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><label style={label}>First name</label><input value={a.firstName || ""} onChange={(e) => set("firstName", e.target.value)} style={field} /></div>
          <div><label style={label}>Last name</label><input value={a.lastName || ""} onChange={(e) => set("lastName", e.target.value)} style={field} /></div>
        </div>
        <div><label style={label}>Phone</label><input inputMode="tel" value={a.phone || ""} onChange={(e) => set("phone", e.target.value)} placeholder="(555) 000-0000" style={field} /></div>
        <div><label style={label}>Email</label><input inputMode="email" value={a.email || ""} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" style={field} /></div>
        <label style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "var(--color-surface)", border: "1px solid var(--color-line)", borderRadius: 14, padding: 14, cursor: "pointer" }}>
          <input type="checkbox" checked={a.consent === "yes"} onChange={(e) => set("consent", e.target.checked ? "yes" : "")} style={{ marginTop: 2, width: 18, height: 18, accentColor: "var(--color-red)", flexShrink: 0 }} />
          <span style={{ fontSize: 11.5, color: "var(--color-ink-muted)", lineHeight: 1.6 }}>
            By checking this box I agree to be contacted by Union Private Healthcare and its licensed insurance partners by phone, text, and email about coverage options, including via automated technology. Consent is not a condition of purchase. Reply STOP to opt out. See our <a href="/terms" style={{ textDecoration: "underline" }}>Terms</a> and <a href="/privacy" style={{ textDecoration: "underline" }}>Privacy Policy</a>.
          </span>
        </label>
      </div>
    </>
  )
}

function Success({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "8px 0" }}>
      <div style={{ width: 66, height: 66, borderRadius: "50%", background: "#eaf6ef", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
        <Check width={30} height={30} color="var(--color-success)" strokeWidth={2.6} />
      </div>
      <h3 className="font-display" style={{ fontWeight: 700, fontSize: 24, color: "var(--color-navy)" }}>You&apos;re all set!</h3>
      <p style={{ color: "var(--color-ink-muted)", fontSize: 15, marginTop: 8, maxWidth: 380, marginInline: "auto" }}>A licensed agent is reviewing your info and will reach out shortly with your private PPO matches.</p>
      <div style={{ textAlign: "left", background: "var(--color-surface)", border: "1px solid var(--color-line)", borderRadius: 14, padding: 18, marginTop: 20 }}>
        {["A specialist reviews your info", "They call to compare your options", "You choose, always free to you"].map((t) => (
          <div key={t} style={{ display: "flex", gap: 10, alignItems: "center", padding: "6px 0" }}>
            <Check width={18} height={18} color="var(--color-success)" strokeWidth={2.6} />
            <span style={{ fontSize: 14, color: "var(--color-body)" }}>{t}</span>
          </div>
        ))}
      </div>
      <button onClick={onClose} style={{ marginTop: 20, width: "100%", padding: "14px", borderRadius: 11, border: "none", background: "var(--color-navy)", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Done</button>
    </div>
  )
}
