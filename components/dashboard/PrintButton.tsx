"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

/** Triggers the browser print dialog (export-to-PDF without extra infra). */
export function PrintButton({ label = "Export PDF" }: { label?: string }) {
  return (
    <Button variant="outline" onClick={() => window.print()}>
      <Download className="w-4 h-4 mr-2" />
      {label}
    </Button>
  )
}
