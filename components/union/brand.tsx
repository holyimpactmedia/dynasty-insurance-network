/* eslint-disable @next/next/no-img-element -- next.config sets images.unoptimized,
   so next/image emits a plain <img> with the raw src anyway: no optimization to
   gain, but its default lazy-loading fails to paint the mark inside the quiz
   modal. Plain eager <img> is both simpler and correct for small brand chrome. */
import type { CSSProperties, ReactNode } from "react"
import { Star } from "lucide-react"

// ── Union · Modern civic brand primitives ───────────────────────────────────
// Presentational + server-safe. Interactive CTAs live in ./quiz.tsx.

// Brand artwork is the client-supplied lockup in /public/brand, trimmed to the
// artwork bounds. Fixed colors: the logo is never recolored, so on navy surfaces
// UnionLogo places it on a white plate rather than swapping to a light variant.
// `size` is the rendered HEIGHT in px; width follows each asset's own aspect.
const LOGO_W = 408
const LOGO_H = 124
const MARK_W = 105
const MARK_H = 124

// Shield only, no wordmark (used where the lockup would be too wide).
export function UnionMark({ size = 42 }: { size?: number }) {
  return (
    <img
      src="/brand/union-mark.png"
      alt=""
      aria-hidden="true"
      width={MARK_W}
      height={MARK_H}
      loading="eager"
      decoding="async"
      style={{ display: "block", flexShrink: 0, height: size, width: "auto" }}
    />
  )
}

// `onDark` does not recolor the artwork. The lockup keeps its exact navy/red/white
// values everywhere; on navy surfaces it sits on a white plate so it reads the
// same way it does on a light page.
export function UnionLogo({ size = 42, onDark = false }: { size?: number; onDark?: boolean }) {
  const logo = (
    <img
      src="/brand/union-logo.png"
      alt="Union Private Healthcare"
      width={LOGO_W}
      height={LOGO_H}
      loading="eager"
      decoding="async"
      style={{ display: "block", height: size, width: "auto" }}
    />
  )

  if (!onDark) return logo
  return (
    <span
      style={{
        display: "inline-flex",
        background: "#ffffff",
        borderRadius: Math.round(size * 0.22),
        padding: `${Math.round(size * 0.3)}px ${Math.round(size * 0.42)}px`,
      }}
    >
      {logo}
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
