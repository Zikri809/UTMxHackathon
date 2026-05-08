import { CalendarDays } from "lucide-react"

type HarvestWindowProps = {
  expectedDate: string
  windowLabel: string
  compact?: boolean
}

export function HarvestWindow({
  expectedDate,
  windowLabel,
  compact,
}: HarvestWindowProps) {
  return (
    <div className="grid gap-2 text-sm sm:grid-cols-2">
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">
          Expected ready date
        </p>
        <div className="mt-1 flex items-center gap-2 font-medium">
          <CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" />
          <span>{formatDate(expectedDate)}</span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">
          Ready window
        </p>
        <p className={compact ? "mt-1 font-medium" : "mt-1 font-medium"}>
          {windowLabel}
        </p>
      </div>
    </div>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value))
}
