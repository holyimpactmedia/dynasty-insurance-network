"use client"

import { useEffect, useState } from "react"
import { ArrowRight, Menu, X } from "lucide-react"
import { UnionLogo } from "./brand"

const NAV = [
  { label: "Coverage", href: "#coverage" },
  { label: "How it works", href: "#how" },
  { label: "Why us", href: "#why" },
  { label: "FAQ", href: "#faq" },
]

export function UnionHeader({
  onOpenQuiz,
  navLinks,
}: {
  onOpenQuiz: () => void
  navLinks?: { label: string; href: string }[]
}) {
  const links = navLinks ?? NAV
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const ctaStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "12px 22px",
    borderRadius: 10,
    border: "none",
    background: "var(--color-red)",
    color: "#fff",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
    boxShadow: "0 10px 22px -12px rgba(210,35,42,.75)",
  }

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 80,
        background: "rgba(255,255,255,.9)",
        backdropFilter: "saturate(180%) blur(12px)",
        borderBottom: `1px solid ${scrolled || menuOpen ? "var(--color-line)" : "transparent"}`,
        boxShadow: scrolled ? "0 6px 24px -14px rgba(10,37,64,.3)" : "none",
        transition: "border-color .25s, box-shadow .25s",
      }}
    >
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "13px clamp(18px,5vw,48px)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
        <a href="#top" aria-label="Union Private Healthcare" onClick={() => setMenuOpen(false)}><UnionLogo size={40} /></a>

        <nav className="union-nav" style={{ display: "flex", gap: 26 }}>
          {links.map((n) => (
            <a key={n.href} href={n.href} style={{ fontWeight: 600, fontSize: 14.5, color: "#42536b", textDecoration: "none" }}>{n.label}</a>
          ))}
        </nav>

        <button className="union-cta-desktop" onClick={onOpenQuiz} style={ctaStyle}>
          See My PPO Options
          <ArrowRight width={16} height={16} />
        </button>

        {/* Mobile hamburger */}
        <button
          className="union-hamburger"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          style={{ alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 10, border: "1px solid var(--color-line)", background: "#fff", cursor: "pointer" }}
        >
          {menuOpen ? <X width={22} height={22} color="var(--color-navy)" /> : <Menu width={22} height={22} color="var(--color-navy)" />}
        </button>
      </div>

      {/* Mobile menu panel */}
      {menuOpen && (
        <div style={{ borderTop: "1px solid var(--color-line)", background: "#fff", padding: "10px clamp(18px,5vw,48px) 18px" }}>
          <nav style={{ display: "grid" }}>
            {links.map((n) => (
              <a key={n.href} href={n.href} onClick={() => setMenuOpen(false)} style={{ padding: "14px 4px", fontWeight: 600, fontSize: 16, color: "var(--color-navy)", textDecoration: "none", borderBottom: "1px solid var(--color-line)" }}>{n.label}</a>
            ))}
          </nav>
          <button onClick={() => { setMenuOpen(false); onOpenQuiz() }} style={{ ...ctaStyle, width: "100%", justifyContent: "center", marginTop: 14, padding: "14px 22px", fontSize: 16 }}>
            See My PPO Options
            <ArrowRight width={17} height={17} />
          </button>
        </div>
      )}
    </header>
  )
}
