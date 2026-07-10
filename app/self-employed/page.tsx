"use client"

import { FunnelPage } from "@/components/union/FunnelPage"
import { selfEmployedConfig } from "@/lib/funnels/union-configs"

export default function Page() {
  return <FunnelPage config={selfEmployedConfig} />
}
