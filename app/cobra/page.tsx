"use client"

import { FunnelPage } from "@/components/union/FunnelPage"
import { cobraConfig } from "@/lib/funnels/union-configs"

export default function Page() {
  return <FunnelPage config={cobraConfig} />
}
