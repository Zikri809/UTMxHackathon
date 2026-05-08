import Link from "next/link"
import { ArrowRight, ClipboardCheck, MapPin, RadioTower } from "lucide-react"

import { ConfidenceMeter } from "@/components/crops/confidence-meter"
import { HarvestWindow } from "@/components/crops/harvest-window"
import { PredictionBadge } from "@/components/crops/prediction-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getHarvestWindowSummary } from "@/lib/domain/selectors"
import { cn } from "@/lib/utils"
import type { CropBatchSummary } from "@/types/crop"
import {
  getCropHealthLabel,
  getCropLifecycleLabel,
  getSensorAssignmentLabel,
} from "@/types/domain"

type CropCardProps = {
  crop: CropBatchSummary
}

const healthClasses: Record<CropBatchSummary["cropHealthState"], string> = {
  healthy: "border-emerald-200 bg-emerald-50 text-emerald-800",
  watch: "border-amber-200 bg-amber-50 text-amber-900",
  attention: "border-orange-200 bg-orange-50 text-orange-900",
}

const connectionClasses: Record<CropBatchSummary["sensorAssignmentState"], string> = {
  assigned: "border-emerald-200 bg-emerald-50 text-emerald-800",
  missing: "border-sky-200 bg-sky-50 text-sky-800",
  ambiguous: "border-amber-200 bg-amber-50 text-amber-900",
  offline: "border-orange-200 bg-orange-50 text-orange-900",
}

export function CropCard({ crop }: CropCardProps) {
  const windowSummary = getHarvestWindowSummary(crop)
  const dateShift = crop.predictionSummary.shiftDays
  const needsHarvestResult = crop.feedbackState === "awaiting_feedback"
  const needsDevices = crop.sensorAssignmentState !== "assigned"

  return (
    <Card className="relative transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:bg-card">
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-1.5",
          crop.cropHealthState === "healthy" && "bg-emerald-500",
          crop.cropHealthState === "watch" && "bg-amber-500",
          crop.cropHealthState === "attention" && "bg-orange-500",
        )}
      />
      <CardContent className="space-y-4 pl-7">
        <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-start 2xl:justify-between">
          <Link href={`/crops/${crop.id}`} className="min-w-0">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {crop.rack} / {crop.zone}
            </p>
            <p className="mt-1 font-heading text-xl font-semibold leading-tight">
              {crop.plantName}
              {crop.variety ? (
                <span className="font-sans text-sm font-medium text-muted-foreground">
                  {" "}
                  {crop.variety}
                </span>
              ) : null}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <MapPin className="size-3.5" aria-hidden="true" />
              <span>Planted {formatDate(crop.plantedAt)}</span>
            </div>
          </Link>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={cn("border", healthClasses[crop.cropHealthState])}
            >
              {getCropHealthLabel(crop.cropHealthState)}
            </Badge>
            <Badge variant="outline">
              {getCropLifecycleLabel(crop.status)}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <PredictionBadge mode={crop.predictionSummary.predictionMode} />
          <Badge
            variant="outline"
            className={cn("border", connectionClasses[crop.sensorAssignmentState])}
          >
            <RadioTower className="size-3.5" aria-hidden="true" />
            {getSensorAssignmentLabel(crop.sensorAssignmentState)}
          </Badge>
        </div>

        <HarvestWindow
          expectedDate={windowSummary.expectedDate}
          windowLabel={windowSummary.label}
        />
        <ConfidenceMeter value={crop.predictionSummary.confidence} />

        <div className="grid grid-cols-3 gap-2 rounded-md border border-border/70 bg-muted/35 p-2 text-xs">
          <div>
            <p className="text-muted-foreground">Starter</p>
            <p className="font-medium">{formatDate(crop.genericHarvestDate)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Shift</p>
            <p className="font-medium">{formatShift(dateShift)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Plants</p>
            <p className="font-medium">{crop.plantCount}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {needsHarvestResult ? (
            <Button asChild size="sm">
              <Link href={`/crops/${crop.id}?tab=feedback`}>
                <ClipboardCheck className="size-4" aria-hidden="true" />
                Record harvest result
              </Link>
            </Button>
          ) : null}
          {needsDevices ? (
            <Button asChild size="sm" variant="outline">
              <Link
                href={`/sensors?action=assign&batchId=${crop.id}&returnTo=/dashboard`}
              >
                <RadioTower className="size-4" aria-hidden="true" />
                Connect devices
              </Link>
            </Button>
          ) : null}
          <Button asChild size="sm" variant="ghost" className="ml-auto">
            <Link href={`/crops/${crop.id}`}>
              Details
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value))
}

function formatShift(days: number) {
  if (days === 0) {
    return "Unchanged"
  }

  return `${Math.abs(days)} days ${days > 0 ? "later" : "earlier"}`
}
