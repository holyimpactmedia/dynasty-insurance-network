import { Fragment } from "react"
import { ICONS } from "@/lib/funnels/icons"
import type { IconKey, RichText } from "@/lib/funnels/types"

export function Icon({ name, className }: { name: IconKey; className?: string }) {
  const Cmp = ICONS[name]
  return <Cmp className={className} />
}

// Renders a RichText line: plain text as bare nodes, `em` segments emphasized,
// `href` segments as links. Emphasis/link classes are passed by the caller so
// styling stays in the component, not the config.
export function RichLine({
  segments,
  emClassName,
  linkClassName,
}: {
  segments: RichText
  emClassName?: string
  linkClassName?: string
}) {
  return (
    <>
      {segments.map((s, i) => {
        if (s.href) {
          return (
            <a key={i} href={s.href} className={linkClassName}>
              {s.text}
            </a>
          )
        }
        if (s.em) {
          return (
            <span key={i} className={emClassName}>
              {s.text}
            </span>
          )
        }
        return <Fragment key={i}>{s.text}</Fragment>
      })}
    </>
  )
}
