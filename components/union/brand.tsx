import type { CSSProperties, ReactNode } from "react"
import { Star } from "lucide-react"

// ── Union · Modern civic brand primitives ───────────────────────────────────
// Presentational + server-safe. Interactive CTAs live in ./quiz.tsx.

// The star-over-stripes logo mark: a navy tile with red stripe field and a
// white 5-point star, the recurring "civic" motif, scalable by `size`.
export function UnionMark({ size = 42 }: { size?: number }) {
  const radius = Math.max(8, Math.round(size * 0.26))
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: "var(--color-navy)",
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(180deg, var(--color-red) 0 5.5px, transparent 5.5px 11px)",
          opacity: 0.9,
        }}
      />
      <svg viewBox="0 0 24 24" width={size * 0.5} height={size * 0.5} style={{ position: "relative" }}>
        <path
          d="M12 2.6l2.6 6.1 6.6.5-5 4.3 1.6 6.5L12 16.9 6.2 20l1.6-6.5-5-4.3 6.6-.5z"
          fill="#fff"
        />
      </svg>
    </span>
  )
}

export function UnionLogo({ size = 42, onDark = false }: { size?: number; onDark?: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 11 }}>
      <UnionMark size={size} />
      <span style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <span
          className="font-display"
          style={{ fontWeight: 700, fontSize: size * 0.48, letterSpacing: "-0.5px", color: onDark ? "#fff" : "var(--color-navy)" }}
        >
          Union
        </span>
        <span
          style={{
            fontWeight: 700,
            fontSize: Math.max(8, size * 0.21),
            letterSpacing: "2.3px",
            textTransform: "uppercase",
            color: onDark ? "#8ba0bb" : "var(--color-ink-muted)",
            marginTop: 2,
          }}
        >
          Private Healthcare
        </span>
      </span>
    </span>
  )
}

// UPPERCASE tracked label above section headings. Red on light, steel on navy.
export function Eyebrow({ children, onDark = false }: { children: ReactNode; onDark?: boolean }) {
  return (
    <p
      style={{
        fontWeight: 700,
        fontSize: 12,
        letterSpacing: "2.2px",
        textTransform: "uppercase",
        color: onDark ? "var(--color-steel)" : "var(--color-red)",
      }}
    >
      {children}
    </p>
  )
}

export function Stars({ size = 16, color = "var(--color-navy)" }: { size?: number; color?: string }) {
  return (
    <span style={{ display: "inline-flex", gap: 2, color }} aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} width={size} height={size} fill="currentColor" strokeWidth={0} />
      ))}
    </span>
  )
}

// Decorative textures for navy panels (engraved civic-document feel).
export const dotGrid: CSSProperties = {
  backgroundImage:
    "radial-gradient(circle, rgba(255,255,255,.17) 1.3px, transparent 1.3px)",
  backgroundSize: "28px 28px",
}

export const redStripeField: CSSProperties = {
  backgroundImage:
    "repeating-linear-gradient(122deg, var(--color-red) 0 15px, transparent 15px 30px)",
}
