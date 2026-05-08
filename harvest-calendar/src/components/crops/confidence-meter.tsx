import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

type ConfidenceMeterProps = {
  value: number
  compact?: boolean
}

export function ConfidenceMeter({ value, compact }: ConfidenceMeterProps) {
  const tone =
    value >= 75
      ? "[&_[data-slot=progress-indicator]]:bg-emerald-500"
      : value >= 55
        ? "[&_[data-slot=progress-indicator]]:bg-amber-500"
        : "[&_[data-slot=progress-indicator]]:bg-orange-500"

  return (
    <div className={cn("space-y-2", compact && "space-y-1.5")}>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-muted-foreground">Reliability</span>
        <span className="font-semibold">{value}%</span>
      </div>
      <Progress value={value} className={cn("h-2", tone)} />
    </div>
  )
}
