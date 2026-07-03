"use client"

import { QuizEngine } from "@/components/funnel/QuizEngine"
import { cobraConfig } from "@/lib/funnels/cobra.config"

// Client wrapper: the config carries a buildPayload function, so it must live on
// the client side of the boundary (the original page was entirely "use client"
// too). SEO metadata stays in the untouched app/cobra/layout.tsx.
export default function Page() {
  return <QuizEngine config={cobraConfig} />
}
