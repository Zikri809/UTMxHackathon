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
    <Card className="transition-colors hover:bg-accent/40">
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-start 2xl:justify-between">
          <Link href={`/crops/${crop.id}`} className="min-w-0">
            <p className="font-heading text-lg font-semibold leading-tight">
              {crop.plantName}
              {crop.variety ? (
                <span className="font-sans text-sm font-medium text-muted-foreground">
                  {" "}
                  {crop.variety}
                </span>
              ) : null}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" aria-hidden="true" />
                {crop.rack} / {crop.zone}
              </span>
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
          <Badge variant="outline">
            {formatDate(crop.genericHarvestDate)} starter date
          </Badge>
          <Badge variant="outline">{formatShift(dateShift)}</Badge>
        </div>

        <HarvestWindow
          expectedDate={windowSummary.expectedDate}
          windowLabel={windowSummary.label}
        />
        <ConfidenceMeter value={crop.predictionSummary.confidence} />

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
    return "Date unchanged"
  }

  return `${Math.abs(days)} days ${days > 0 ? "later" : "earlier"}`
}
