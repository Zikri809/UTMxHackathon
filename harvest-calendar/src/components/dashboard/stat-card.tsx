import type { LucideIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

type StatTone = "green" | "amber" | "orange" | "blue" | "slate"

type StatCardProps = {
  label: string
  value: string
  detail: string
  icon: LucideIcon
  tone?: StatTone
  progress?: number
}

const toneClasses: Record<StatTone, string> = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  orange: "bg-orange-50 text-orange-800 ring-orange-200",
  blue: "bg-sky-50 text-sky-700 ring-sky-200",
  slate: "bg-slate-50 text-slate-700 ring-slate-200",
}

const progressClasses: Record<StatTone, string> = {
  green: "[&_[data-slot=progress-indicator]]:bg-emerald-500",
  amber: "[&_[data-slot=progress-indicator]]:bg-amber-500",
  orange: "[&_[data-slot=progress-indicator]]:bg-orange-500",
  blue: "[&_[data-slot=progress-indicator]]:bg-sky-500",
  slate: "[&_[data-slot=progress-indicator]]:bg-slate-500",
}

export function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "slate",
  progress,
}: StatCardProps) {
  return (
    <Card size="sm">
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 font-heading text-xl font-semibold">
              {value}
            </p>
          </div>
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-md ring-1",
              toneClasses[tone],
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
          </span>
        </div>
        {progress !== undefined ? (
          <Progress
            value={progress}
            className={cn("h-2", progressClasses[tone])}
          />
        ) : null}
        <p className="text-xs leading-5 text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )
}
