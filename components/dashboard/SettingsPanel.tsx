"use client"

import { useState, useTransition } from "react"
import { BarChart3 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"

interface SettingsPanelProps {
  projectionsEnabled: boolean
  updateProjectionsEnabled: (enabled: boolean) => Promise<void>
}

export default function SettingsPanel({
  projectionsEnabled,
  updateProjectionsEnabled,
}: SettingsPanelProps) {
  // Optimistic local state so the switch feels instant; reverts on error.
  const [enabled, setEnabled] = useState(projectionsEnabled)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleToggle = (next: boolean) => {
    setEnabled(next)
    setError(null)
    startTransition(async () => {
      try {
        await updateProjectionsEnabled(next)
      } catch {
        setEnabled(!next) // revert
        setError("Couldn't save that change. Please try again.")
      }
    })
  }

  return (
    <Card className="divide-y divide-gray-100">
      <div className="px-5 py-4">
        <h2 className="text-sm font-semibold text-gray-900">Sections</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Show or hide dashboard sections for every admin.
        </p>
      </div>

      <div className="flex items-start justify-between gap-4 px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
            <BarChart3 className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">Projections</div>
            <p className="text-sm text-gray-500">
              The Pass-through Financials &amp; calculators dashboard. When off,
              it&apos;s hidden from the nav and the page is blocked for everyone.
            </p>
            {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 pt-0.5">
          <span className="text-xs text-gray-400 w-7 text-right">
            {enabled ? "On" : "Off"}
          </span>
          <Switch
            checked={enabled}
            disabled={isPending}
            onCheckedChange={handleToggle}
            aria-label="Toggle Projections section"
          />
        </div>
      </div>
    </Card>
  )
}
