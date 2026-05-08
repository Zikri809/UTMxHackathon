"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  Archive,
  ArrowUpDown,
  ClipboardCheck,
  Eye,
  MoreHorizontal,
  Plus,
  RadioTower,
  Search,
  TriangleAlert,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

import { ConfidenceMeter } from "@/components/crops/confidence-meter"
import { CropCard } from "@/components/crops/crop-card"
import { HarvestWindow } from "@/components/crops/harvest-window"
import { PredictionBadge } from "@/components/crops/prediction-badge"
import { PageHeader } from "@/components/page-header"
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
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getHarvestWindowSummary } from "@/lib/domain/selectors"
import { useCropBatchSummaries, useSensorGroups, useUpdateCropStatus } from "@/lib/query/hooks"
import { cn } from "@/lib/utils"
import type { CropBatchSummary } from "@/types/crop"
import type { CropLifecycleStatus, SensorAssignmentState } from "@/types/domain"
import {
  getCropHealthLabel,
  getCropLifecycleLabel,
  getSensorAssignmentLabel,
} from "@/types/domain"

type StatusTab = "all" | CropLifecycleStatus
type DeviceFilter = "all" | "connected" | "needs_connection" | "needs_review"
type SortKey = "ready_date" | "planted_date" | "reliability" | "status_priority"
type IncludeEnded = "active" | "with_ended"

type CropFiltersState = {
  search: string
  status: StatusTab
  plant: string
  location: string
  device: DeviceFilter
  sort: SortKey
  includeEnded: IncludeEnded
}

const allValue = "__all__"
const terminalStatuses = new Set<CropLifecycleStatus>([
  "completed",
  "cancelled",
  "failed",
  "archived",
])

const statusTabs: Array<{ value: StatusTab; label: string }> = [
  { value: "all", label: "All" },
  { value: "growing", label: "Growing" },
  { value: "ready_soon", label: "Ready Soon" },
  { value: "feedback_needed", label: "Harvest Check" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "failed", label: "Failed" },
  { value: "archived", label: "Archived" },
]

const defaultFilters: CropFiltersState = {
  search: "",
  status: "all",
  plant: allValue,
  location: allValue,
  device: "all",
  sort: "status_priority",
  includeEnded: "active",
}
const emptyCrops: CropBatchSummary[] = []

export function CropsListPage() {
  const cropSummariesQuery = useCropBatchSummaries()
  const sensorGroupsQuery = useSensorGroups()
  const [filters, setFilters] = useState<CropFiltersState>(defaultFilters)

  const crops = cropSummariesQuery.data ?? emptyCrops
  const filteredCrops = useMemo(
    () => filterAndSortCrops(crops, filters),
    [crops, filters],
  )
  const plantOptions = useMemo(
    () => Array.from(new Set(crops.map((crop) => crop.plantName))).sort(),
    [crops],
  )
  const locationOptions = useMemo(
    () =>
      Array.from(new Set(crops.map((crop) => `${crop.rack} / ${crop.zone}`))).sort(),
    [crops],
  )
  const statusCounts = useMemo(() => getStatusCounts(crops), [crops])
  const missingDeviceCount = crops.filter(
    (crop) => crop.sensorAssignmentState !== "assigned",
  ).length

  if (cropSummariesQuery.isLoading || sensorGroupsQuery.isLoading) {
    return <CropsInventorySkeleton />
  }

  if (cropSummariesQuery.isError) {
    return (
      <Alert variant="destructive">
        <TriangleAlert className="size-4" aria-hidden="true" />
        <AlertTitle>Could not load crops.</AlertTitle>
        <AlertDescription>
          Try again to refresh the crop inventory.
        </AlertDescription>
        <AlertAction>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void cropSummariesQuery.refetch()}
          >
            Retry
          </Button>
        </AlertAction>
      </Alert>
    )
  }

  if (!crops.length) {
    return <EmptyInventory />
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Crops"
        description={`${crops.length} crop batches. ${missingDeviceCount} need device connection.`}
        action={
          <Button asChild>
            <Link href="/crops/new">
              <Plus className="size-4" aria-hidden="true" />
              Add Crop
            </Link>
          </Button>
        }
      />

      {sensorGroupsQuery.isError ? (
        <Alert>
          <TriangleAlert className="size-4" aria-hidden="true" />
          <AlertTitle>Device connection details may be incomplete.</AlertTitle>
          <AlertDescription>
            Crop scanning still works. Retry from Devices & Locations if device
            groups look out of date.
          </AlertDescription>
        </Alert>
      ) : null}

      <CropStatusTabs
        value={filters.status}
        counts={statusCounts}
        onChange={(status) =>
          setFilters((current) => ({
            ...current,
            status,
            includeEnded: terminalStatuses.has(status as CropLifecycleStatus)
              ? "with_ended"
              : current.includeEnded,
          }))
        }
      />

      <CropFilters
        filters={filters}
        plantOptions={plantOptions}
        locationOptions={locationOptions}
        onChange={setFilters}
        onClear={() => setFilters(defaultFilters)}
      />

      {filteredCrops.length ? (
        <>
          <div className="hidden lg:block">
            <CropTable crops={filteredCrops} />
          </div>
          <div className="grid gap-3 lg:hidden">
            {filteredCrops.map((crop) => (
              <CropCard key={crop.id} crop={crop} />
            ))}
          </div>
        </>
      ) : (
        <FilteredEmptyState onClear={() => setFilters(defaultFilters)} />
      )}
    </div>
  )
}

export function CropStatusTabs({
  value,
  counts,
  onChange,
}: {
  value: StatusTab
  counts: Record<StatusTab, number>
  onChange: (value: StatusTab) => void
}) {
  return (
    <Tabs value={value} onValueChange={(nextValue) => onChange(nextValue as StatusTab)}>
      <TabsList className="h-auto max-w-full flex-wrap justify-start">
        {statusTabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
            {tab.label}
            <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
              {counts[tab.value] ?? 0}
            </Badge>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

export function CropFilters({
  filters,
  plantOptions,
  locationOptions,
  onChange,
  onClear,
}: {
  filters: CropFiltersState
  plantOptions: string[]
  locationOptions: string[]
  onChange: (filters: CropFiltersState) => void
  onClear: () => void
}) {
  function update(nextFilters: Partial<CropFiltersState>) {
    onChange({ ...filters, ...nextFilters })
  }

  return (
    <Card>
      <CardContent className="grid gap-3 py-4 md:grid-cols-2 xl:grid-cols-[minmax(14rem,1.2fr)_repeat(5,minmax(10rem,1fr))_auto]">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={filters.search}
            onChange={(event) => update({ search: event.target.value })}
            placeholder="Search plant, variety, rack, zone"
            className="pl-8"
          />
        </div>

        <Select value={filters.plant} onValueChange={(plant) => update({ plant })}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Plant type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={allValue}>All plant types</SelectItem>
            {plantOptions.map((plant) => (
              <SelectItem key={plant} value={plant}>
                {plant}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.location}
          onValueChange={(location) => update({ location })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Rack or zone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={allValue}>All racks and zones</SelectItem>
            {locationOptions.map((location) => (
              <SelectItem key={location} value={location}>
                {location}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.device}
          onValueChange={(device) => update({ device: device as DeviceFilter })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Device connection" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All device states</SelectItem>
            <SelectItem value="connected">Connected</SelectItem>
            <SelectItem value="needs_connection">Needs connection</SelectItem>
            <SelectItem value="needs_review">Needs review</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.includeEnded}
          onValueChange={(includeEnded) =>
            update({ includeEnded: includeEnded as IncludeEnded })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active only</SelectItem>
            <SelectItem value="with_ended">Include ended</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.sort}
          onValueChange={(sort) => update({ sort: sort as SortKey })}
        >
          <SelectTrigger className="w-full">
            <ArrowUpDown className="size-4" aria-hidden="true" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="status_priority">Status priority</SelectItem>
            <SelectItem value="ready_date">Expected ready date</SelectItem>
            <SelectItem value="planted_date">Planted date</SelectItem>
            <SelectItem value="reliability">Reliability</SelectItem>
          </SelectContent>
        </Select>

        <Button type="button" variant="outline" onClick={onClear}>
          Clear
        </Button>
      </CardContent>
    </Card>
  )
}

export function CropTable({ crops }: { crops: CropBatchSummary[] }) {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Crop</TableHead>
            <TableHead>Variety</TableHead>
            <TableHead>Rack/Zone</TableHead>
            <TableHead>Planted</TableHead>
            <TableHead>Starter date</TableHead>
            <TableHead>Expected ready date</TableHead>
            <TableHead>Reliability</TableHead>
            <TableHead>Device connection</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {crops.map((crop) => {
            const windowSummary = getHarvestWindowSummary(crop)

            return (
              <TableRow key={crop.id}>
                <TableCell>
                  <Link
                    href={`/crops/${crop.id}`}
                    className="font-medium hover:underline"
                  >
                    {crop.plantName}
                  </Link>
                  <div className="mt-1">
                    <PredictionBadge mode={crop.predictionSummary.predictionMode} />
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {crop.variety ?? "Default"}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{crop.rack}</div>
                  <div className="text-xs text-muted-foreground">{crop.zone}</div>
                </TableCell>
                <TableCell>{formatDate(crop.plantedAt)}</TableCell>
                <TableCell>{formatDate(crop.genericHarvestDate)}</TableCell>
                <TableCell className="min-w-48">
                  <HarvestWindow
                    expectedDate={windowSummary.expectedDate}
                    windowLabel={windowSummary.label}
                    compact
                  />
                </TableCell>
                <TableCell className="min-w-32">
                  <ConfidenceMeter value={crop.predictionSummary.confidence} compact />
                </TableCell>
                <TableCell>
                  <DeviceConnectionBadge state={crop.sensorAssignmentState} />
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Badge variant="outline">{getCropLifecycleLabel(crop.status)}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {getCropHealthLabel(crop.cropHealthState)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <CropRowActions crop={crop} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Card>
  )
}

export function CropRowActions({ crop }: { crop: CropBatchSummary }) {
  const updateCropStatus = useUpdateCropStatus()
  const [open, setOpen] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<CropLifecycleStatus | undefined>()
  const needsDevices = crop.sensorAssignmentState !== "assigned"
  const needsHarvestResult =
    crop.feedbackState === "awaiting_feedback" || crop.status === "feedback_needed"

  const action = pendingStatus ? lifecycleActionCopy[pendingStatus] : undefined

  async function confirmStatusChange() {
    if (!pendingStatus) {
      return
    }

    await updateCropStatus.mutateAsync({ id: crop.id, status: pendingStatus })
    toast.success(`${crop.plantName} updated.`)
    setPendingStatus(undefined)
    setOpen(false)
  }

  return (
    <div className="flex justify-end gap-1">
      <Button asChild size="icon-sm" variant="ghost" aria-label={`View ${crop.plantName}`}>
        <Link href={`/crops/${crop.id}`}>
          <Eye className="size-4" aria-hidden="true" />
        </Link>
      </Button>
      {needsDevices ? (
        <Button
          asChild
          size="icon-sm"
          variant="ghost"
          aria-label={`Connect devices for ${crop.plantName}`}
        >
          <Link href={`/sensors?action=assign&batchId=${crop.id}&returnTo=/crops`}>
            <RadioTower className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      ) : null}
      {needsHarvestResult ? (
        <Button
          asChild
          size="icon-sm"
          variant="ghost"
          aria-label={`Record harvest result for ${crop.plantName}`}
        >
          <Link href={`/crops/${crop.id}?tab=feedback`}>
            <ClipboardCheck className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="icon-sm" variant="ghost" aria-label={`More actions for ${crop.plantName}`}>
            <MoreHorizontal className="size-4" aria-hidden="true" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action ? action.title : `More actions for ${crop.plantName}`}
            </DialogTitle>
            <DialogDescription>
              {action
                ? action.description
                : "Edit details from Crop Detail, or choose a lifecycle action below."}
            </DialogDescription>
          </DialogHeader>

          {action ? (
            <DialogFooter>
              <Button
                variant={action.destructive ? "destructive" : "default"}
                onClick={confirmStatusChange}
                disabled={updateCropStatus.isPending}
              >
                {updateCropStatus.isPending ? "Updating" : action.confirmLabel}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPendingStatus(undefined)}
              >
                Back
              </Button>
            </DialogFooter>
          ) : (
            <div className="grid gap-2">
              <Button asChild variant="outline" className="justify-start">
                <Link href={`/crops/${crop.id}?tab=settings`}>
                  <Eye className="size-4" aria-hidden="true" />
                  Edit in Crop Detail
                </Link>
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => setPendingStatus("archived")}
              >
                <Archive className="size-4" aria-hidden="true" />
                Archive
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => setPendingStatus("failed")}
              >
                <TriangleAlert className="size-4" aria-hidden="true" />
                Mark failed
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => setPendingStatus("cancelled")}
              >
                <XCircle className="size-4" aria-hidden="true" />
                Cancel
              </Button>
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  Close
                </Button>
              </DialogClose>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DeviceConnectionBadge({ state }: { state: SensorAssignmentState }) {
  return (
    <Badge variant="outline" className={cn("border", deviceStateClasses[state])}>
      <RadioTower className="size-3.5" aria-hidden="true" />
      {getSensorAssignmentLabel(state)}
    </Badge>
  )
}

function EmptyInventory() {
  return (
    <div className="flex min-h-96 flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center">
      <h1 className="font-heading text-2xl font-semibold">No crop batches yet.</h1>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Add a crop to start planning ready windows and daily work.
      </p>
      <Button asChild className="mt-5">
        <Link href="/crops/new">
          <Plus className="size-4" aria-hidden="true" />
          Add Crop
        </Link>
      </Button>
    </div>
  )
}

function FilteredEmptyState({ onClear }: { onClear: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>No crop batches match these filters.</CardTitle>
        <CardDescription>
          Clear filters to return to the full inventory.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={onClear}>Clear filters</Button>
      </CardContent>
    </Card>
  )
}

function CropsInventorySkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-5 w-80 max-w-full" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>
      <Skeleton className="h-12" />
      <Skeleton className="h-20" />
      <Card>
        <CardContent className="space-y-3 py-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-16" />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function filterAndSortCrops(crops: CropBatchSummary[], filters: CropFiltersState) {
  const query = filters.search.trim().toLowerCase()
  const includeEnded =
    filters.includeEnded === "with_ended" ||
    (filters.status !== "all" && terminalStatuses.has(filters.status))

  return crops
    .filter((crop) => {
      if (!includeEnded && terminalStatuses.has(crop.status)) {
        return false
      }

      if (filters.status !== "all" && crop.status !== filters.status) {
        return false
      }

      if (filters.plant !== allValue && crop.plantName !== filters.plant) {
        return false
      }

      if (filters.location !== allValue && `${crop.rack} / ${crop.zone}` !== filters.location) {
        return false
      }

      if (!matchesDeviceFilter(crop.sensorAssignmentState, filters.device)) {
        return false
      }

      if (!query) {
        return true
      }

      return [crop.plantName, crop.variety, crop.rack, crop.zone]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query))
    })
    .sort((left, right) => sortCrops(left, right, filters.sort))
}

function matchesDeviceFilter(state: SensorAssignmentState, filter: DeviceFilter) {
  if (filter === "all") {
    return true
  }

  if (filter === "connected") {
    return state === "assigned"
  }

  if (filter === "needs_connection") {
    return state === "missing"
  }

  return state === "ambiguous" || state === "offline"
}

function sortCrops(left: CropBatchSummary, right: CropBatchSummary, sort: SortKey) {
  if (sort === "ready_date") {
    return dateValue(left.predictedHarvestDate) - dateValue(right.predictedHarvestDate)
  }

  if (sort === "planted_date") {
    return dateValue(right.plantedAt) - dateValue(left.plantedAt)
  }

  if (sort === "reliability") {
    return left.predictionSummary.confidence - right.predictionSummary.confidence
  }

  const priorityDelta = statusPriority(left) - statusPriority(right)

  if (priorityDelta !== 0) {
    return priorityDelta
  }

  return dateValue(left.predictedHarvestDate) - dateValue(right.predictedHarvestDate)
}

function statusPriority(crop: CropBatchSummary) {
  if (crop.feedbackState === "awaiting_feedback" || crop.status === "feedback_needed") {
    return 1
  }

  if (crop.status === "ready_soon") {
    return 2
  }

  if (crop.cropHealthState === "attention") {
    return 3
  }

  const priorities: Record<CropLifecycleStatus, number> = {
    growing: 4,
    completed: 5,
    failed: 6,
    cancelled: 7,
    archived: 8,
    feedback_needed: 1,
    ready_soon: 2,
  }

  return priorities[crop.status]
}

function getStatusCounts(crops: CropBatchSummary[]) {
  const counts = Object.fromEntries(statusTabs.map((tab) => [tab.value, 0])) as Record<
    StatusTab,
    number
  >

  counts.all = crops.length

  for (const crop of crops) {
    counts[crop.status] += 1
  }

  return counts
}

function dateValue(value: string) {
  return new Date(value).getTime()
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value))
}

const deviceStateClasses: Record<SensorAssignmentState, string> = {
  assigned: "border-emerald-200 bg-emerald-50 text-emerald-800",
  missing: "border-sky-200 bg-sky-50 text-sky-800",
  ambiguous: "border-amber-200 bg-amber-50 text-amber-900",
  offline: "border-orange-200 bg-orange-50 text-orange-900",
}

const lifecycleActionCopy: Partial<
  Record<
    CropLifecycleStatus,
    {
      title: string
      description: string
      confirmLabel: string
      destructive?: boolean
    }
  >
> = {
  archived: {
    title: "Archive this crop?",
    description:
      "Archived crops leave the active inventory but remain available when ended crops are included.",
    confirmLabel: "Archive crop",
  },
  failed: {
    title: "Mark this crop failed?",
    description:
      "Use this when the batch should stay in history but no harvest result will be recorded.",
    confirmLabel: "Mark failed",
    destructive: true,
  },
  cancelled: {
    title: "Cancel this crop?",
    description:
      "Cancelled crops leave the active inventory and can still be found with ended crops included.",
    confirmLabel: "Cancel crop",
    destructive: true,
  },
}
