"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  PlugZap,
  Plus,
  SlidersHorizontal,
  TriangleAlert,
} from "lucide-react"

import { ConfidenceMeter } from "@/components/crops/confidence-meter"
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
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
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
import { useCropBatchSummaries, useSensorGroups } from "@/lib/query/hooks"
import { cn } from "@/lib/utils"
import {
  cropLifecycleLabels,
  getPredictionModeLabel,
  getSensorAssignmentLabel,
} from "@/types/domain"
import type { CropBatchSummary } from "@/types/crop"

type PlanView = "month" | "week" | "list"
type StatusFilter = "active" | "all" | CropBatchSummary["status"]
type DeviceFilter = "all" | "connected" | "needs_connection"

const terminalStatuses: CropBatchSummary["status"][] = [
  "completed",
  "cancelled",
  "failed",
  "archived",
]

export function CalendarPage() {
  const searchParams = useSearchParams()
  const focusedBatchId = searchParams.get("batchId") ?? undefined
  const cropSummariesQuery = useCropBatchSummaries()
  const sensorGroupsQuery = useSensorGroups()
  const [view, setView] = useState<PlanView>("month")
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [plantFilter, setPlantFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active")
  const [rackFilter, setRackFilter] = useState("all")
  const [deviceFilter, setDeviceFilter] = useState<DeviceFilter>("all")
  const [selectedCrop, setSelectedCrop] = useState<CropBatchSummary | undefined>()

  const loading = cropSummariesQuery.isLoading || sensorGroupsQuery.isLoading
  const error = cropSummariesQuery.isError || sensorGroupsQuery.isError

  const crops = useMemo(() => cropSummariesQuery.data ?? [], [cropSummariesQuery.data])
  const plantOptions = unique(crops.map((crop) => crop.plantName))
  const rackOptions = unique(crops.map((crop) => `${crop.rack} / ${crop.zone}`))
  const filteredCrops = useMemo(
    () =>
      crops
        .filter((crop) => {
          if (statusFilter === "active" && terminalStatuses.includes(crop.status)) {
            return false
          }

          if (statusFilter !== "active" && statusFilter !== "all" && crop.status !== statusFilter) {
            return false
          }

          if (plantFilter !== "all" && crop.plantName !== plantFilter) {
            return false
          }

          if (rackFilter !== "all" && `${crop.rack} / ${crop.zone}` !== rackFilter) {
            return false
          }

          if (deviceFilter === "connected" && crop.sensorAssignmentState !== "assigned") {
            return false
          }

          if (deviceFilter === "needs_connection" && crop.sensorAssignmentState === "assigned") {
            return false
          }

          return true
        })
        .sort(
          (a, b) =>
            new Date(a.predictionSummary.predictedHarvestDate).getTime() -
            new Date(b.predictionSummary.predictedHarvestDate).getTime(),
        ),
    [crops, deviceFilter, plantFilter, rackFilter, statusFilter],
  )

  const focusedCrop = focusedBatchId
    ? crops.find((crop) => crop.id === focusedBatchId)
    : undefined

  if (loading) {
    return <CalendarPageSkeleton />
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <TriangleAlert className="size-4" aria-hidden="true" />
        <AlertTitle>Could not load Harvest Plan.</AlertTitle>
        <AlertDescription>
          Try again to refresh expected ready dates.
        </AlertDescription>
        <AlertAction>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              void cropSummariesQuery.refetch()
              void sensorGroupsQuery.refetch()
            }}
          >
            Retry
          </Button>
        </AlertAction>
      </Alert>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Harvest Plan"
        description="Expected ready dates arranged as a working harvest schedule."
        action={
          <Button asChild>
            <Link href="/crops/new">
              <Plus className="size-4" aria-hidden="true" />
              Add Crop
            </Link>
          </Button>
        }
      />

      {focusedCrop ? (
        <Alert>
          <CalendarDays className="size-4" aria-hidden="true" />
          <AlertTitle>{focusedCrop.plantName} is selected.</AlertTitle>
          <AlertDescription>
            Expected ready date {formatDate(focusedCrop.predictionSummary.predictedHarvestDate)} · Reliability{" "}
            {focusedCrop.predictionSummary.confidence}%.
          </AlertDescription>
          <AlertAction>
            <Button size="sm" variant="outline" onClick={() => setSelectedCrop(focusedCrop)}>
              Open
            </Button>
          </AlertAction>
        </Alert>
      ) : null}

      <CalendarToolbar
        view={view}
        onViewChange={setView}
        currentDate={currentDate}
        onCurrentDateChange={setCurrentDate}
        plantFilter={plantFilter}
        onPlantFilterChange={setPlantFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        rackFilter={rackFilter}
        onRackFilterChange={setRackFilter}
        deviceFilter={deviceFilter}
        onDeviceFilterChange={setDeviceFilter}
        plantOptions={plantOptions}
        rackOptions={rackOptions}
        onClear={() => {
          setPlantFilter("all")
          setStatusFilter("active")
          setRackFilter("all")
          setDeviceFilter("all")
        }}
      />

      {crops.length ? (
        <CalendarView
          view={view}
          currentDate={currentDate}
          crops={filteredCrops}
          onSelectCrop={setSelectedCrop}
          onClearFilters={() => {
            setPlantFilter("all")
            setStatusFilter("active")
            setRackFilter("all")
            setDeviceFilter("all")
          }}
        />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-start gap-3 py-8">
            <p className="font-medium">No harvests scheduled yet.</p>
            <Button asChild>
              <Link href="/crops/new">Add Crop</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <CropSummaryDrawer
        crop={selectedCrop}
        open={Boolean(selectedCrop)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCrop(undefined)
          }
        }}
      />
    </div>
  )
}

export function CalendarToolbar({
  view,
  onViewChange,
  currentDate,
  onCurrentDateChange,
  plantFilter,
  onPlantFilterChange,
  statusFilter,
  onStatusFilterChange,
  rackFilter,
  onRackFilterChange,
  deviceFilter,
  onDeviceFilterChange,
  plantOptions,
  rackOptions,
  onClear,
}: {
  view: PlanView
  onViewChange: (view: PlanView) => void
  currentDate: Date
  onCurrentDateChange: (date: Date) => void
  plantFilter: string
  onPlantFilterChange: (value: string) => void
  statusFilter: StatusFilter
  onStatusFilterChange: (value: StatusFilter) => void
  rackFilter: string
  onRackFilterChange: (value: string) => void
  deviceFilter: DeviceFilter
  onDeviceFilterChange: (value: DeviceFilter) => void
  plantOptions: string[]
  rackOptions: string[]
  onClear: () => void
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="icon-sm"
              variant="outline"
              onClick={() => onCurrentDateChange(shiftViewDate(currentDate, view, -1))}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              <span className="sr-only">Previous</span>
            </Button>
            <div className="min-w-44 text-center font-medium">
              {formatPeriodLabel(currentDate, view)}
            </div>
            <Button
              size="icon-sm"
              variant="outline"
              onClick={() => onCurrentDateChange(shiftViewDate(currentDate, view, 1))}
            >
              <ChevronRight className="size-4" aria-hidden="true" />
              <span className="sr-only">Next</span>
            </Button>
          </div>
          <Tabs value={view} onValueChange={(value) => onViewChange(value as PlanView)}>
            <TabsList>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="size-4 text-muted-foreground" aria-hidden="true" />
          <FilterSelect value={plantFilter} onChange={onPlantFilterChange} label="Plant type">
            <SelectItem value="all">All plants</SelectItem>
            {plantOptions.map((plant) => (
              <SelectItem key={plant} value={plant}>
                {plant}
              </SelectItem>
            ))}
          </FilterSelect>
          <FilterSelect
            value={statusFilter}
            onChange={(value) => onStatusFilterChange(value as StatusFilter)}
            label="Status"
          >
            <SelectItem value="active">Active only</SelectItem>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="growing">On track</SelectItem>
            <SelectItem value="ready_soon">Ready soon</SelectItem>
            <SelectItem value="feedback_needed">Harvest check needed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </FilterSelect>
          <FilterSelect value={rackFilter} onChange={onRackFilterChange} label="Rack">
            <SelectItem value="all">All racks</SelectItem>
            {rackOptions.map((rack) => (
              <SelectItem key={rack} value={rack}>
                {rack}
              </SelectItem>
            ))}
          </FilterSelect>
          <FilterSelect
            value={deviceFilter}
            onChange={(value) => onDeviceFilterChange(value as DeviceFilter)}
            label="Devices"
          >
            <SelectItem value="all">All device states</SelectItem>
            <SelectItem value="connected">Connected</SelectItem>
            <SelectItem value="needs_connection">Needs device connection</SelectItem>
          </FilterSelect>
          <Button variant="outline" size="sm" onClick={onClear}>
            Clear filters
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function FilterSelect({
  value,
  onChange,
  label,
  children,
}: {
  value: string
  onChange: (value: string) => void
  label: string
  children: React.ReactNode
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger size="sm" className="w-44">
        <SelectValue aria-label={label} />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  )
}

export function CalendarView({
  view,
  currentDate,
  crops,
  onSelectCrop,
  onClearFilters,
}: {
  view: PlanView
  currentDate: Date
  crops: CropBatchSummary[]
  onSelectCrop: (crop: CropBatchSummary) => void
  onClearFilters: () => void
}) {
  if (!crops.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-3 py-8">
          <p className="font-medium">No harvest work matches these filters.</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Clear filters to return to the full harvest plan.
          </p>
          <Button onClick={onClearFilters}>Clear filters</Button>
        </CardContent>
      </Card>
    )
  }

  if (view === "list") {
    return <ListView crops={crops} onSelectCrop={onSelectCrop} />
  }

  if (view === "week") {
    return <WeekView currentDate={currentDate} crops={crops} onSelectCrop={onSelectCrop} />
  }

  return <MonthView currentDate={currentDate} crops={crops} onSelectCrop={onSelectCrop} />
}

function MonthView({
  currentDate,
  crops,
  onSelectCrop,
}: {
  currentDate: Date
  crops: CropBatchSummary[]
  onSelectCrop: (crop: CropBatchSummary) => void
}) {
  const days = getMonthGridDays(currentDate)
  const month = currentDate.getMonth()

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Month plan</CardTitle>
        <CardDescription>Expected harvest work by ready date.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-7 border-b bg-muted/40 text-xs font-medium text-muted-foreground">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="p-3 text-center">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayCrops = crops.filter((crop) =>
              isSameDay(crop.predictionSummary.predictedHarvestDate, day),
            )
            const visible = dayCrops.slice(0, 3)

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-32 border-r border-b p-2 last:border-r-0",
                  day.getMonth() !== month && "bg-muted/20 text-muted-foreground",
                )}
              >
                <div className="mb-2 text-xs font-medium">{day.getDate()}</div>
                <div className="space-y-1">
                  {visible.map((crop) => (
                    <CalendarEventChip key={crop.id} crop={crop} onClick={() => onSelectCrop(crop)} />
                  ))}
                  {dayCrops.length > visible.length ? (
                    <p className="text-xs text-muted-foreground">
                      +{dayCrops.length - visible.length} more
                    </p>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function WeekView({
  currentDate,
  crops,
  onSelectCrop,
}: {
  currentDate: Date
  crops: CropBatchSummary[]
  onSelectCrop: (crop: CropBatchSummary) => void
}) {
  const days = getWeekDays(currentDate)

  return (
    <div className="grid gap-4 lg:grid-cols-7">
      {days.map((day) => {
        const dayCrops = crops.filter((crop) =>
          isDateInWindow(day, crop.predictionSummary.predictedHarvestWindow.start, crop.predictionSummary.predictedHarvestWindow.end),
        )

        return (
          <Card key={day.toISOString()} size="sm">
            <CardHeader className="border-b">
              <CardTitle>{formatWeekday(day)}</CardTitle>
              <CardDescription>{formatDate(day.toISOString())}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {dayCrops.length ? (
                dayCrops.map((crop) => (
                  <CalendarEventChip key={crop.id} crop={crop} expanded onClick={() => onSelectCrop(crop)} />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No expected harvest work.</p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function ListView({
  crops,
  onSelectCrop,
}: {
  crops: CropBatchSummary[]
  onSelectCrop: (crop: CropBatchSummary) => void
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>List plan</CardTitle>
        <CardDescription>Crops sorted by expected ready date.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Crop</TableHead>
              <TableHead>Rack or zone</TableHead>
              <TableHead>Starter date</TableHead>
              <TableHead>Expected ready date</TableHead>
              <TableHead>Ready window</TableHead>
              <TableHead>Reliability</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {crops.map((crop) => {
              const window = getHarvestWindowSummary(crop)

              return (
                <TableRow
                  key={crop.id}
                  className="cursor-pointer"
                  onClick={() => onSelectCrop(crop)}
                >
                  <TableCell className="font-medium">{crop.plantName}</TableCell>
                  <TableCell>{crop.rack} / {crop.zone}</TableCell>
                  <TableCell>{formatDate(crop.predictionSummary.genericHarvestDate)}</TableCell>
                  <TableCell>{formatDate(crop.predictionSummary.predictedHarvestDate)}</TableCell>
                  <TableCell>{window.label}</TableCell>
                  <TableCell>{crop.predictionSummary.confidence}%</TableCell>
                  <TableCell>
                    <StatusBadge crop={crop} />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export function CalendarEventChip({
  crop,
  expanded,
  onClick,
}: {
  crop: CropBatchSummary
  expanded?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-md border px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted",
        chipTone(crop),
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-medium">{crop.plantName}</span>
        <span className="shrink-0">{crop.predictionSummary.confidence}%</span>
      </div>
      {expanded ? (
        <div className="mt-1 flex flex-wrap gap-1">
          <StatusBadge crop={crop} compact />
          {crop.sensorAssignmentState !== "assigned" ? (
            <Badge variant="outline">Needs device connection</Badge>
          ) : null}
        </div>
      ) : null}
    </button>
  )
}

export function CropSummaryDrawer({
  crop,
  open,
  onOpenChange,
}: {
  crop?: CropBatchSummary
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!crop) {
    return <Drawer open={open} onOpenChange={onOpenChange} />
  }

  const window = getHarvestWindowSummary(crop)

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{crop.plantName}</DrawerTitle>
          <DrawerDescription>
            {crop.rack} / {crop.zone} · {crop.plantCount} plants
          </DrawerDescription>
        </DrawerHeader>
        <div className="space-y-4 overflow-y-auto px-4 pb-4">
          <div className="flex flex-wrap gap-2">
            <StatusBadge crop={crop} />
            <PredictionBadge mode={crop.predictionSummary.predictionMode} />
            {crop.sensorAssignmentState !== "assigned" ? (
              <Badge variant="outline">Needs device connection</Badge>
            ) : null}
          </div>

          <HarvestWindow expectedDate={window.expectedDate} windowLabel={window.label} />

          <div className="grid gap-3">
            <InfoRow label="Starter date" value={formatDate(crop.predictionSummary.genericHarvestDate)} />
            <InfoRow
              label="Conditions summary"
              value={getPredictionModeLabel(crop.predictionSummary.predictionMode)}
            />
            <InfoRow
              label="Device connection"
              value={
                crop.sensorAssignmentState === "assigned"
                  ? "Devices connected"
                  : getSensorAssignmentLabel(crop.sensorAssignmentState)
              }
            />
          </div>

          <ConfidenceMeter value={crop.predictionSummary.confidence} />
        </div>
        <DrawerFooter>
          <Button asChild>
            <Link href={`/crops/${crop.id}`}>View details</Link>
          </Button>
          {crop.status === "feedback_needed" ? (
            <Button asChild variant="outline">
              <Link href={`/crops/${crop.id}?tab=feedback`}>Record harvest result</Link>
            </Button>
          ) : null}
          {crop.sensorAssignmentState !== "assigned" ? (
            <Button asChild variant="outline">
              <Link href={`/sensors?action=assign&batchId=${crop.id}&returnTo=/calendar`}>
                <PlugZap className="size-4" aria-hidden="true" />
                Connect devices
              </Link>
            </Button>
          ) : null}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/40 p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  )
}

function StatusBadge({ crop, compact }: { crop: CropBatchSummary; compact?: boolean }) {
  const needsDevice = crop.sensorAssignmentState !== "assigned"
  const label = needsDevice
    ? "Needs device connection"
    : cropLifecycleLabels[crop.status]
  const variant =
    crop.status === "feedback_needed" || needsDevice
      ? "outline"
      : crop.status === "ready_soon"
        ? "secondary"
        : "outline"

  return (
    <Badge
      variant={variant}
      className={cn(
        crop.status === "feedback_needed" && "border-orange-300 bg-orange-50 text-orange-800",
        crop.status === "ready_soon" && "border-amber-300 bg-amber-50 text-amber-800",
        needsDevice && "border-orange-300 text-orange-800",
        compact && "h-auto whitespace-normal",
      )}
    >
      {label}
    </Badge>
  )
}

export function CalendarPageSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>
      <Skeleton className="h-28" />
      <Skeleton className="h-[32rem]" />
    </div>
  )
}

function chipTone(crop: CropBatchSummary) {
  if (crop.sensorAssignmentState !== "assigned") {
    return "border-orange-200 bg-orange-50 text-orange-900"
  }

  if (crop.status === "feedback_needed") {
    return "border-orange-300 bg-orange-50 text-orange-950"
  }

  if (crop.status === "ready_soon") {
    return "border-amber-300 bg-amber-50 text-amber-950"
  }

  if (crop.predictionSummary.predictionMode === "sensor_adjusted") {
    return "border-emerald-200 bg-emerald-50 text-emerald-950"
  }

  return "border-sky-200 bg-sky-50 text-sky-950"
}

function shiftViewDate(date: Date, view: PlanView, direction: number) {
  const nextDate = new Date(date)

  if (view === "week") {
    nextDate.setDate(nextDate.getDate() + direction * 7)
  } else {
    nextDate.setMonth(nextDate.getMonth() + direction)
  }

  return nextDate
}

function formatPeriodLabel(date: Date, view: PlanView) {
  if (view === "week") {
    const [start, end] = getWeekDays(date)
    return `${formatDate(start.toISOString())} - ${formatDate(end.toISOString())}`
  }

  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(date)
}

function getMonthGridDays(date: Date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1)
  const start = new Date(first)
  start.setDate(first.getDate() - first.getDay())

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start)
    day.setDate(start.getDate() + index)
    return day
  })
}

function getWeekDays(date: Date) {
  const start = new Date(date)
  start.setDate(date.getDate() - date.getDay())
  start.setHours(0, 0, 0, 0)

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start)
    day.setDate(start.getDate() + index)
    return day
  })
}

function isSameDay(value: string, day: Date) {
  const date = new Date(value)
  return (
    date.getFullYear() === day.getFullYear() &&
    date.getMonth() === day.getMonth() &&
    date.getDate() === day.getDate()
  )
}

function isDateInWindow(day: Date, startValue: string, endValue: string) {
  const start = startOfDay(new Date(startValue))
  const end = startOfDay(new Date(endValue))
  const target = startOfDay(day)

  return target >= start && target <= end
}

function startOfDay(date: Date) {
  const nextDate = new Date(date)
  nextDate.setHours(0, 0, 0, 0)
  return nextDate
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value))
}

function formatWeekday(value: Date) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
  }).format(value)
}

function unique(values: string[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))
}
