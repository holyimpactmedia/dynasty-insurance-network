"use client"

import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface AIScoreBadgeProps {
  score: number | null
  reasons?: string[] | null
}

export function AIScoreBadge({ score, reasons }: AIScoreBadgeProps) {
  if (score === null || score === undefined) {
    return (
      <Badge className="bg-gray-100 text-gray-600 border-gray-200">
        Scoring...
      </Badge>
    )
  }

  const getScoreDetails = (score: number) => {
    if (score >= 80) {
      return {
        label: "Hot",
        emoji: "🔥",
        className: "bg-red-100 text-red-800 border-red-200",
      }
    } else if (score >= 60) {
      return {
        label: "Warm",
        emoji: "",
        className: "bg-orange-100 text-orange-800 border-orange-200",
      }
    } else if (score >= 40) {
      return {
        label: "Qualified",
        emoji: "",
        className: "bg-yellow-100 text-yellow-800 border-yellow-200",
      }
    } else {
      return {
        label: "Cold",
        emoji: "",
        className: "bg-gray-100 text-gray-600 border-gray-200",
      }
    }
  }

  const { label, emoji, className } = getScoreDetails(score)

  const badge = (
    <Badge className={`${className} border cursor-default`}>
      {emoji && `${emoji} `}{label} ({score})
    </Badge>
  )

  if (reasons && reasons.length > 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-1">
              <p className="font-semibold text-sm">AI Score: {score}/100</p>
              <ul className="text-xs space-y-0.5">
                {reasons.map((reason, i) => (
                  <li key={i}>• {reason}</li>
                ))}
              </ul>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return badge
}
