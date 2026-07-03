import type { FunnelConfig } from "./types"
import { cobraConfig } from "./cobra.config"

// slug → config. Phase 1b adds the remaining five funnels here.
export const FUNNELS: Record<string, FunnelConfig> = {
  cobra: cobraConfig,
}

export { cobraConfig }
export type { FunnelConfig }
