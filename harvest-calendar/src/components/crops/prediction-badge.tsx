import { Badge } from "@/components/ui/badge"
import { getPredictionModeLabel } from "@/types/domain"
import type { PredictionMode } from "@/types/domain"
import { cn } from "@/lib/utils"

type PredictionBadgeProps = {
  mode: PredictionMode
}

const modeClasses: Record<PredictionMode, string> = {
  generic_baseline: "border-sky-200 bg-sky-50 text-sky-800",
  sensor_adjusted: "border-emerald-200 bg-emerald-50 text-emerald-800",
  learned: "border-violet-200 bg-violet-50 text-violet-800",
}

export function PredictionBadge({ mode }: PredictionBadgeProps) {
  return (
    <Badge variant="outline" className={cn("border", modeClasses[mode])}>
      {getPredictionModeLabel(mode)}
    </Badge>
  )
}
