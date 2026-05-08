"use client"

import Link from "next/link"
import {
  Activity,
  CalendarDays,
  ClipboardCheck,
  Leaf,
  Plus,
  RadioTower,
  Sparkles,
  Sprout,
  TrendingUp,
  TriangleAlert,
} from "lucide-react"

import { CropCard } from "@/components/crops/crop-card"
import { ConfidenceMeter } from "@/components/crops/confidence-meter"
import { DemoResetDialog } from "@/components/demo-reset-dialog"
import { PageHeader } from "@/components/page-header"
import { InsightList, type InsightItem } from "@/components/dashboard/insight-list"
import { StatCard } from "@/components/dashboard/stat-card"
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getHarvestWindowSummary, getStatusPriority } from "@/lib/domain/selectors"
import {
  useCropBatchSummaries,
  useModelLearningStats,
  useSensorGroups,
} from "@/lib/query/hooks"
import type { CropBatchSummary } from "@/types/crop"
import type { ModelLearningStats } from "@/types/learning"

const hiddenStatuses = new Set(["cancelled", "failed", "archived"])

export function DashboardPage() {
  const cropSummariesQuery = useCropBatchSummaries()
  const sensorGroupsQuery = useSensorGroups()
  const learningStatsQuery = useModelLearningStats()

  const isLoading =
    cropSummariesQuery.isLoading ||
    sensorGroupsQuery.isLoading ||
    learningStatsQuery.isLoading
  const isError =
    cropSummariesQuery.isError ||
    sensorGroupsQuery.isError ||
    learningStatsQuery.isError

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <TriangleAlert className="size-4" aria-hidden="true" />
        <AlertTitle>Could not load dashboard data.</AlertTitle>
        <AlertDescription>
          Try again to refresh today&apos;s crop list.
        </AlertDescription>
        <AlertAction>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              void cropSummariesQuery.refetch()
              void sensorGroupsQuery.refetch()
              void learningStatsQuery.refetch()
            }}
          >
            Retry
          </Button>
        </AlertAction>
      </Alert>
    )
  }

  const cropSummaries = cropSummariesQuery.data ?? []
  const activeCrops = cropSummaries.filter((crop) => !hiddenStatuses.has(crop.status))
  const learningStats = learningStatsQuery.data ?? []
  const availableDeviceGroups =
    sensorGroupsQuery.data?.filter((group) => !group.assignedBatchId).length ?? 0

  if (!cropSummaries.length) {
    return <EmptyDashboard />
  }

  const readySoon = activeCrops.filter(
    (crop) => crop.status === "ready_soon" || getHarvestWindowSummary(crop).daysUntilStart <= 3,
  )
  const harvestChecks = activeCrops.filter(
    (crop) => crop.feedbackState === "awaiting_feedback" || crop.status === "feedback_needed",
  )
  const checkAgain = activeCrops.filter(
    (crop) => crop.feedbackState === "check_again_scheduled",
  )
  const missingDevices = activeCrops.filter(
    (crop) => crop.sensorAssignmentState !== "assigned",
  )
  const attentionCrops = activeCrops.filter(
    (crop) => crop.cropHealthState === "attention",
  )
  const averageReliability = activeCrops.length
    ? Math.round(
        activeCrops.reduce(
          (total, crop) => total + crop.predictionSummary.confidence,
          0,
        ) / activeCrops.length,
      )
    : 0

  const prioritizedCrops = [...activeCrops].sort(sortDashboardCrops).slice(0, 5)
  const upcomingCrops = [...activeCrops]
    .sort(
      (left, right) =>
        new Date(left.predictedHarvestDate).getTime() -
        new Date(right.predictedHarvestDate).getTime(),
    )
    .slice(0, 5)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Today"
        description="Ready work, attention crops, and the next best action."
        action={
          <Button asChild>
            <Link href="/crops/new">
              <Plus className="size-4" aria-hidden="true" />
              Add Crop
            </Link>
          </Button>
        }
        secondaryAction={<DemoResetDialog />}
      />

      <OperationsBrief
        activeCount={activeCrops.length}
        readySoonCount={readySoon.length}
        harvestChecksCount={harvestChecks.length}
        attentionCount={attentionCrops.length}
        reliability={averageReliability}
        nextCrop={upcomingCrops[0]}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active Batches"
          value={String(activeCrops.length)}
          detail={`${missingDevices.length} need device connection`}
          icon={Leaf}
          tone="green"
        />
        <StatCard
          label="Ready Soon"
          value={String(readySoon.length)}
          detail="Expected within the next few days"
          icon={CalendarDays}
          tone="amber"
        />
        <StatCard
          label="Harvest Checks"
          value={String(harvestChecks.length)}
          detail={`${checkAgain.length} scheduled to check again`}
          icon={ClipboardCheck}
          tone="orange"
        />
        <StatCard
          label="Average Reliability"
          value={`${averageReliability}%`}
          detail="Across active crops"
          icon={Activity}
          tone={averageReliability >= 70 ? "green" : "amber"}
          progress={averageReliability}
        />
      </section>

      <section className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-heading text-xl font-semibold">
                Morning Queue
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                One clear next action per crop.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/crops">View crops</Link>
            </Button>
          </div>
          <div className="grid gap-3 2xl:grid-cols-2">
            {prioritizedCrops.map((crop) => (
              <CropCard key={crop.id} crop={crop} />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <UpcomingHarvests crops={upcomingCrops} />
          <DeviceConnections
            crops={missingDevices}
            availableDeviceGroups={availableDeviceGroups}
          />
          <InsightList
            title="Recent Improvements"
            description="Harvest checks make future dates clearer."
            items={buildImprovementItems(learningStats)}
            viewAllHref="/learning"
            viewAllLabel="Open Improvements"
          />
        </div>
      </section>

      <InsightList
        title="Attention Summary"
        description="A short list of crops that need a decision."
        items={buildAttentionItems(attentionCrops)}
        emptyText="No urgent crop attention needed."
      />
    </div>
  )
}

function OperationsBrief({
  activeCount,
  readySoonCount,
  harvestChecksCount,
  attentionCount,
  reliability,
  nextCrop,
}: {
  activeCount: number
  readySoonCount: number
  harvestChecksCount: number
  attentionCount: number
  reliability: number
  nextCrop?: CropBatchSummary
}) {
  const rhythm = [
    { label: "Active", value: activeCount },
    { label: "Ready", value: readySoonCount },
    { label: "Checks", value: harvestChecksCount },
    { label: "Watch", value: attentionCount },
  ]

  return (
    <section className="overflow-hidden rounded-lg border border-border/80 bg-[linear-gradient(135deg,oklch(0.997_0.004_86_/_0.98),oklch(0.92_0.034_157_/_0.7))] shadow-[0_1px_0_oklch(1_0_0_/_0.7)_inset,0_18px_42px_oklch(0.2_0.03_110_/_0.08)]">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="relative p-5 sm:p-6">
          <div className="absolute inset-y-5 left-0 w-1 bg-primary" />
          <div className="pl-3">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Operations pulse
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              {rhythm.map((item) => (
                <div key={item.label} className="border-l border-border/80 pl-3">
                  <p className="font-heading text-3xl font-semibold leading-none">
                    {item.value}
                  </p>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 h-2 overflow-hidden rounded-full bg-background/80 ring-1 ring-border/70">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.min(reliability, 100)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {reliability}% average reliability across active crop batches.
            </p>
          </div>
        </div>
        <div className="border-t border-border/70 bg-foreground/[0.035] p-5 lg:border-l lg:border-t-0">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Next ready window
          </p>
          {nextCrop ? (
            <div className="mt-4">
              <p className="font-heading text-2xl font-semibold">
                {nextCrop.plantName}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {nextCrop.rack} / {nextCrop.zone}
              </p>
              <div className="mt-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Expected</p>
                  <p className="font-medium">
                    {formatDate(nextCrop.predictedHarvestDate)}
                  </p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/crops/${nextCrop.id}`}>Open crop</Link>
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              No active harvest window is scheduled.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

function UpcomingHarvests({ crops }: { crops: CropBatchSummary[] }) {
  return (
    <Card size="sm">
      <CardHeader className="border-b">
        <CardTitle>Upcoming Harvests</CardTitle>
        <CardDescription>Sorted by expected ready date.</CardDescription>
        <CardAction>
          <Button asChild size="sm" variant="ghost">
            <Link href="/calendar">Harvest Plan</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-1 px-0">
        {crops.map((crop) => {
          const windowSummary = getHarvestWindowSummary(crop)

          return (
            <Link
              key={crop.id}
              href={`/crops/${crop.id}`}
              className="block px-4 py-3 hover:bg-accent/60"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{crop.plantName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Expected ready date {formatDate(windowSummary.expectedDate)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ready window {windowSummary.label}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0">
                  {crop.predictionSummary.confidence}%
                </Badge>
              </div>
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}

function DeviceConnections({
  crops,
  availableDeviceGroups,
}: {
  crops: CropBatchSummary[]
  availableDeviceGroups: number
}) {
  return (
    <Card size="sm">
      <CardHeader className="border-b">
        <CardTitle>Device Connection</CardTitle>
        <CardDescription>
          {availableDeviceGroups} available device groups.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1 px-0">
        {crops.length ? (
          crops.slice(0, 4).map((crop) => (
            <div
              key={crop.id}
              className="grid gap-3 px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{crop.plantName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {crop.rack} / {crop.zone}
                </p>
                <div className="mt-2 max-w-40">
                  <ConfidenceMeter
                    value={crop.predictionSummary.confidence}
                    compact
                  />
                </div>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link
                  href={`/sensors?action=assign&batchId=${crop.id}&returnTo=/dashboard`}
                >
                  <RadioTower className="size-4" aria-hidden="true" />
                  Connect devices
                </Link>
              </Button>
            </div>
          ))
        ) : (
          <p className="px-4 py-3 text-sm text-muted-foreground">
            Every active crop has devices connected.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function EmptyDashboard() {
  return (
    <div className="flex min-h-96 flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center">
      <Sprout className="size-10 text-primary" aria-hidden="true" />
      <h1 className="mt-4 font-heading text-2xl font-semibold">Today</h1>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Add a crop to create a starter harvest estimate and begin planning.
      </p>
      <Button asChild className="mt-5">
        <Link href="/crops/new">
          <Plus className="size-4" aria-hidden="true" />
          Add first crop
        </Link>
      </Button>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-5 w-80 max-w-full" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32" />
        ))}
      </div>
      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="grid gap-3 2xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-72" />
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-48" />
          ))}
        </div>
      </div>
    </div>
  )
}

function sortDashboardCrops(left: CropBatchSummary, right: CropBatchSummary) {
  const leftPriority = priorityScore(left)
  const rightPriority = priorityScore(right)

  if (leftPriority !== rightPriority) {
    return rightPriority - leftPriority
  }

  return (
    new Date(left.predictedHarvestDate).getTime() -
    new Date(right.predictedHarvestDate).getTime()
  )
}

function priorityScore(crop: CropBatchSummary) {
  const priority = getStatusPriority(crop)

  if (crop.feedbackState === "awaiting_feedback" || crop.status === "feedback_needed") {
    return 50
  }

  if (crop.sensorAssignmentState !== "assigned") {
    return 40
  }

  if (priority === "critical") {
    return 30
  }

  if (priority === "action") {
    return 20
  }

  if (priority === "watch") {
    return 10
  }

  return 0
}

function buildImprovementItems(stats: ModelLearningStats[]): InsightItem[] {
  return [...stats]
    .sort((left, right) => right.confidence - left.confidence)
    .slice(0, 3)
    .map((stat) => {
      const improved = stat.averageErrorBeforeDays > stat.averageErrorAfterDays

      return {
        title: stat.plantName,
        detail: improved
          ? `Average miss improved from ${stat.averageErrorBeforeDays} to ${stat.averageErrorAfterDays} days.`
          : `${stat.completedCycles} harvest checks recorded so far.`,
        href: `/learning?plantProfileId=${stat.plantProfileId}`,
        actionLabel: `${stat.confidence}% reliable`,
        icon: improved ? TrendingUp : Sparkles,
      }
    })
}

function buildAttentionItems(crops: CropBatchSummary[]): InsightItem[] {
  return crops.slice(0, 5).map((crop) => {
    const needsDevices = crop.sensorAssignmentState !== "assigned"
    const needsHarvestResult =
      crop.feedbackState === "awaiting_feedback" || crop.status === "feedback_needed"

    if (needsHarvestResult) {
      return {
        title: crop.plantName,
        detail: "Harvest result is due.",
        href: `/crops/${crop.id}?tab=feedback`,
        actionLabel: "Record harvest result",
        icon: ClipboardCheck,
      }
    }

    if (needsDevices) {
      return {
        title: crop.plantName,
        detail: `${crop.rack} / ${crop.zone} needs a device connection.`,
        href: `/sensors?action=assign&batchId=${crop.id}&returnTo=/dashboard`,
        actionLabel: "Connect devices",
        icon: RadioTower,
      }
    }

    return {
      title: crop.plantName,
      detail: "Check this crop today.",
      href: `/crops/${crop.id}`,
      actionLabel: "Open crop",
      icon: TriangleAlert,
    }
  })
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value))
}
