"use client"

import { FunnelPage } from "@/components/union/FunnelPage"
import { familyConfig } from "@/lib/funnels/union-configs"

export default function Page() {
  return <FunnelPage config={familyConfig} />
}
