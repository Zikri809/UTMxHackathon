"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  History,
  Pencil,
  PlugZap,
  Settings,
  SlidersHorizontal,
  TriangleAlert,
  XCircle,
} from "lucide-react"
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { toast } from "sonner"

import { ConfidenceMeter } from "@/components/crops/confidence-meter"
import { HarvestWindow } from "@/components/crops/harvest-window"
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
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getCropHealthState,
  getCropLifecycleState,
  getFeedbackState,
  getHarvestWindowSummary,
  getMissingSensorTypes,
  getSensorAssignmentState,
} from "@/lib/domain/selectors"
import {
  useCropBatch,
  useFarmLocations,
  useHarvestFeedback,
  useHarvestPrediction,
  usePlantProfiles,
  useSensorDevices,
  useSensorGroups,
  useSensorReadings,
  useSubmitHarvestFeedback,
  useUpdateCropBatch,
  useUpdateCropStatus,
} from "@/lib/query/hooks"
import { cn } from "@/lib/utils"
import {
  cropLifecycleLabels,
  getModelMaturityLabel,
  getSensorAssignmentLabel,
  metricAvailabilityLabels,
} from "@/types/domain"
import type { HarvestFeedbackAccuracy } from "@/types/feedback"
import type { PlantIdealRanges, PlantProfile } from "@/types/plant"
import type { HarvestPrediction, PredictionFactorStatus } from "@/types/prediction"
import type { SensorDevice, SensorGroup, SensorReading, SensorType } from "@/types/sensor"
import type { CropBatch } from "@/types/crop"

type CropDetailPageProps = {
  batchId: string
}

type MetricDefinition = {
  type: SensorType
  label: string
  unit: string
  readingKey: keyof Pick<
    SensorReading,
    | "temperatureC"
    | "humidityPercent"
    | "ph"
    | "ec"
    | "lightHours"
    | "moisturePercent"
  >
  rangeKey: keyof PlantIdealRanges
}

const metricDefinitions: MetricDefinition[] = [
  { type: "temperature", label: "Temperature", unit: "C", readingKey: "temperatureC", rangeKey: "temperatureC" },
  { type: "humidity", label: "Humidity", unit: "%", readingKey: "humidityPercent", rangeKey: "humidityPercent" },
  { type: "ph", label: "pH", unit: "", readingKey: "ph", rangeKey: "ph" },
  { type: "ec", label: "EC", unit: "", readingKey: "ec", rangeKey: "ec" },
  { type: "light", label: "Light exposure", unit: "h", readingKey: "lightHours", rangeKey: "lightHours" },
  { type: "moisture", label: "Moisture", unit: "%", readingKey: "moisturePercent", rangeKey: "moisturePercent" },
]

export function CropDetailPage({ batchId }: CropDetailPageProps) {
  const cropQuery = useCropBatch(batchId)
  const predictionQuery = useHarvestPrediction(batchId)
  const readingsQuery = useSensorReadings(batchId)
  const feedbackQuery = useHarvestFeedback(batchId)
  const plantProfilesQuery = usePlantProfiles()
  const sensorGroupsQuery = useSensorGroups()
  const sensorDevicesQuery = useSensorDevices()
  const farmLocationsQuery = useFarmLocations()

  const loading =
    cropQuery.isLoading ||
    predictionQuery.isLoading ||
    readingsQuery.isLoading ||
    feedbackQuery.isLoading ||
    plantProfilesQuery.isLoading ||
    sensorGroupsQuery.isLoading ||
    sensorDevicesQuery.isLoading
  const error =
    predictionQuery.isError ||
    readingsQuery.isError ||
    feedbackQuery.isError ||
    plantProfilesQuery.isError ||
    sensorGroupsQuery.isError ||
    sensorDevicesQuery.isError

  if (loading) {
    return <CropDetailSkeleton />
  }

  if (cropQuery.isError) {
    return (
      <Alert>
        <TriangleAlert className="size-4" aria-hidden="true" />
        <AlertTitle>Crop batch not found.</AlertTitle>
        <AlertDescription>
          This crop may have been removed or archived.
        </AlertDescription>
        <AlertAction>
          <Button asChild size="sm" variant="outline">
            <Link href="/crops">Back to Crops</Link>
          </Button>
        </AlertAction>
      </Alert>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <TriangleAlert className="size-4" aria-hidden="true" />
        <AlertTitle>Could not load crop details.</AlertTitle>
        <AlertDescription>
          Try again to refresh the estimate, conditions, and device details.
        </AlertDescription>
        <AlertAction>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              void cropQuery.refetch()
              void predictionQuery.refetch()
              void readingsQuery.refetch()
              void feedbackQuery.refetch()
            }}
          >
            Retry
          </Button>
        </AlertAction>
      </Alert>
    )
  }

  const crop = cropQuery.data!
  const prediction = predictionQuery.data!
  const readings = readingsQuery.data ?? []
  const feedbackHistory = feedbackQuery.data ?? []
  const plantProfile = plantProfilesQuery.data?.find(
    (profile) => profile.id === crop.plantProfileId,
  )
  const sensorGroups = sensorGroupsQuery.data ?? []
  const sensorDevices = sensorDevicesQuery.data ?? []
  const connectedGroup = getConnectedGroup(crop, sensorGroups)
  const connectedDevices = connectedGroup
    ? getDevicesForGroup(connectedGroup, sensorDevices)
    : []
  const assignmentState = getSensorAssignmentState(crop, sensorGroups, sensorDevices)
  const healthState = getCropHealthState(crop, prediction, readings, assignmentState)
  const feedbackState = getFeedbackState(crop, feedbackHistory)
  const status = getCropLifecycleState(crop)
  const farmLocation = farmLocationsQuery.data?.find(
    (location) => location.id === crop.farmLocationId,
  )
  const missingSensorTypes = plantProfile
    ? getMissingSensorTypes(crop, plantProfile, connectedGroup, sensorDevices)
    : []

  return (
    <div className="space-y-5">
      <CropDetailHeader
        crop={crop}
        status={status}
        healthState={healthState}
        feedbackState={feedbackState}
      />

      <PredictionSummaryPanel crop={crop} prediction={prediction} />

      <Tabs defaultValue="overview" className="space-y-4">
        <div className="overflow-x-auto pb-1">
          <TabsList className="min-w-max">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="conditions">Conditions</TabsTrigger>
            <TabsTrigger value="devices">Devices</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="feedback">Harvest Check</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
            <Card>
              <CardHeader className="border-b">
                <CardTitle>What to do next</CardTitle>
                <CardDescription>
                  {getNextActionCopy({ status, assignmentState, feedbackState })}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                <SummaryTile label="Status" value={cropLifecycleLabels[status]} />
                <SummaryTile label="Devices" value={getSensorAssignmentLabel(assignmentState)} />
                <SummaryTile label="Harvest check" value={formatFeedbackState(feedbackState)} />
              </CardContent>
              <CardFooter className="justify-end gap-2 border-t">
                <Button asChild variant="outline">
                  <Link href={connectDevicesHref(crop.id)}>
                    <PlugZap className="size-4" aria-hidden="true" />
                    Connect devices
                  </Link>
                </Button>
                <FeedbackModal crop={crop} prediction={prediction} />
              </CardFooter>
            </Card>
            <PredictionExplanation prediction={prediction} />
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {metricDefinitions.slice(0, 3).map((metric) => (
              <SensorMetricCard
                key={metric.type}
                metric={metric}
                readings={readings}
                plantProfile={plantProfile}
                availableTypes={getAvailableSensorTypes(connectedDevices)}
                missingSensorTypes={missingSensorTypes}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="conditions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {metricDefinitions.map((metric) => (
              <SensorMetricCard
                key={metric.type}
                metric={metric}
                readings={readings}
                plantProfile={plantProfile}
                availableTypes={getAvailableSensorTypes(connectedDevices)}
                missingSensorTypes={missingSensorTypes}
              />
            ))}
          </div>
          <SensorTrendChart readings={readings} connectedDevices={connectedDevices} />
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <SensorAssignmentCard
            crop={crop}
            sensorGroup={connectedGroup}
            devices={connectedDevices}
            assignmentState={assignmentState}
            farmLocationLabel={farmLocation?.label}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <GrowthTimeline crop={crop} prediction={prediction} feedbackHistory={feedbackHistory} />
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Harvest Check</CardTitle>
              <CardDescription>
                Record whether this crop was ready so future estimates get better.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Use accurate, early, late, or not ready yet based on what you saw in the crop.
              </p>
              <FeedbackModal crop={crop} prediction={prediction} />
            </CardContent>
          </Card>
          <FeedbackHistory feedbackHistory={feedbackHistory} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
            <EditCropDialog crop={crop} disabled={isTerminalCrop(crop)} />
            <CropStatusActions crop={crop} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function CropDetailHeader({
  crop,
  status,
  healthState,
  feedbackState,
}: {
  crop: CropBatch
  status: CropBatch["status"]
  healthState: string
  feedbackState: string
}) {
  return (
    <PageHeader
      title={crop.plantName}
      description={`${crop.rack} / ${crop.zone} · Planted ${formatDate(crop.plantedAt)} · ${crop.plantCount} plants`}
      secondaryAction={
        <Button asChild variant="outline">
          <Link href="/crops">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Crops
          </Link>
        </Button>
      }
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={status === "feedback_needed" ? "default" : "outline"}>
            {cropLifecycleLabels[status]}
          </Badge>
          <Badge variant={healthState === "attention" ? "destructive" : "secondary"}>
            {healthState === "attention" ? "Needs attention" : "On track"}
          </Badge>
          {feedbackState === "check_again_scheduled" ? (
            <Badge variant="outline">Check again scheduled</Badge>
          ) : null}
        </div>
      }
    />
  )
}

export function PredictionSummaryPanel({
  crop,
  prediction,
}: {
  crop: CropBatch
  prediction: HarvestPrediction
}) {
  const window = getHarvestWindowSummary(prediction)
  const shiftCopy = getShiftCopy(prediction.shiftDays)

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <CalendarCheck className="size-4 text-primary" aria-hidden="true" />
          Harvest estimate
        </CardTitle>
        <CardDescription>
          Expected ready date moved {shiftCopy} than the starter estimate.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5 lg:grid-cols-[1.2fr_1fr_1fr_0.8fr]">
        <HarvestWindow expectedDate={window.expectedDate} windowLabel={window.label} />
        <SummaryTile label="Starter estimate" value={formatDate(prediction.genericHarvestDate)} />
        <div className="space-y-2">
          <ConfidenceMeter value={prediction.confidence} compact />
          <p className="text-xs text-muted-foreground">
            {getModelMaturityLabel(prediction.modelMaturity)}
          </p>
        </div>
        <SummaryTile label="Status" value={cropLifecycleLabels[getCropLifecycleState(crop)]} />
      </CardContent>
    </Card>
  )
}

export function PredictionExplanation({ prediction }: { prediction: HarvestPrediction }) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>View why this changed</CardTitle>
        <CardDescription>{prediction.explanation}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {prediction.contributingFactors.map((factor) => (
          <div key={`${factor.label}-${factor.impact}`} className="flex gap-3 rounded-md bg-muted/40 p-3">
            <FactorIcon status={factor.status} />
            <div>
              <p className="font-medium">{factor.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{factor.impact}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function SensorMetricCard({
  metric,
  readings,
  plantProfile,
  availableTypes,
  missingSensorTypes,
}: {
  metric: MetricDefinition
  readings: SensorReading[]
  plantProfile?: PlantProfile
  availableTypes: Set<SensorType>
  missingSensorTypes: SensorType[]
}) {
  const latest = readings[0]
  const value = latest?.[metric.readingKey]
  const idealRange = plantProfile?.idealRanges[metric.rangeKey]
  const isTracked = availableTypes.has(metric.type) && value !== undefined
  const missingRequired = missingSensorTypes.includes(metric.type)
  const status = !isTracked
    ? metricAvailabilityLabels.unavailable
    : idealRange && typeof value === "number" && (value < idealRange.min || value > idealRange.max)
      ? "Needs attention"
      : "In range"

  return (
    <Card size="sm">
      <CardHeader className="border-b">
        <CardTitle>{metric.label}</CardTitle>
        <CardAction>
          <Badge variant={status === "In range" ? "secondary" : "outline"}>{status}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-2xl font-semibold">
            {isTracked ? formatMetricValue(value, metric.unit) : "Not tracked"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Ideal range: {idealRange ? `${idealRange.min}-${idealRange.max}${metric.unit}` : "Not set"}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          {isTracked
            ? getMetricImpact(status)
            : missingRequired
              ? "Missing this metric lowers reliability for this crop."
              : "This crop can be planned without this metric."}
        </p>
      </CardContent>
    </Card>
  )
}

export function SensorTrendChart({
  readings,
  connectedDevices,
}: {
  readings: SensorReading[]
  connectedDevices: SensorDevice[]
}) {
  const availableTypes = getAvailableSensorTypes(connectedDevices)
  const firstTrackedMetric =
    metricDefinitions.find((metric) => availableTypes.has(metric.type) && readings.some((reading) => reading[metric.readingKey] !== undefined)) ??
    metricDefinitions.find((metric) => readings.some((reading) => reading[metric.readingKey] !== undefined))
  const [metricType, setMetricType] = useState<SensorType>(firstTrackedMetric?.type ?? "temperature")
  const metric = metricDefinitions.find((item) => item.type === metricType) ?? firstTrackedMetric
  const chartData = useMemo(() => {
    if (!metric) {
      return []
    }

    const source = readings.length > 1 ? readings : expandSingleReading(readings[0], metric)

    return source
      .filter((reading) => reading[metric.readingKey] !== undefined)
      .map((reading) => ({
        time: formatTinyDate(reading.timestamp),
        value: Number(reading[metric.readingKey]),
      }))
  }, [metric, readings])

  if (!metric || chartData.length === 0) {
    return (
      <Alert>
        <TriangleAlert className="size-4" aria-hidden="true" />
        <AlertTitle>No condition chart yet.</AlertTitle>
        <AlertDescription>
          Connect devices to start building trend history for this crop.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Condition trend</CardTitle>
        <CardDescription>Compact view of the latest tracked condition.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {metricDefinitions
            .filter((item) => readings.some((reading) => reading[item.readingKey] !== undefined))
            .map((item) => (
              <Button
                key={item.type}
                type="button"
                size="sm"
                variant={item.type === metric.type ? "default" : "outline"}
                onClick={() => setMetricType(item.type)}
              >
                {item.label}
              </Button>
            ))}
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ left: 8, right: 16, top: 12, bottom: 0 }}>
              <XAxis dataKey="time" tickLine={false} axisLine={false} />
              <YAxis width={36} tickLine={false} axisLine={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export function SensorAssignmentCard({
  crop,
  sensorGroup,
  devices,
  assignmentState,
  farmLocationLabel,
}: {
  crop: CropBatch
  sensorGroup?: SensorGroup
  devices: SensorDevice[]
  assignmentState: string
  farmLocationLabel?: string
}) {
  const hasConnection = assignmentState === "assigned" && sensorGroup

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <PlugZap className="size-4 text-primary" aria-hidden="true" />
          Devices
        </CardTitle>
        <CardDescription>
          {hasConnection
            ? `Device group ${sensorGroup.name} is connected to this ${crop.plantName} crop.`
            : "This crop needs a device connection."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasConnection ? (
          <Alert>
            <TriangleAlert className="size-4" aria-hidden="true" />
            <AlertTitle>Connect devices to improve reliability.</AlertTitle>
            <AlertDescription>
              Without a device group, the ready date stays close to the starter estimate.
            </AlertDescription>
            <AlertAction>
              <Button asChild size="sm">
                <Link href={connectDevicesHref(crop.id)}>Connect devices</Link>
              </Button>
            </AlertAction>
          </Alert>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2">
          <SummaryTile label="Rack and zone" value={farmLocationLabel ?? `${crop.rack} / ${crop.zone}`} />
          <SummaryTile label="Device group" value={sensorGroup?.name ?? "No devices connected yet"} />
        </div>

        {devices.length ? (
          <div className="space-y-3">
            {devices.map((device) => (
              <div key={device.id} className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{device.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {device.sensorTypes.map(formatSensorType).join(", ")}
                  </p>
                </div>
                <Badge variant={device.status === "online" ? "secondary" : "outline"}>
                  {device.status}
                </Badge>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="justify-end border-t">
        <Button asChild variant="outline">
          <Link href={`/sensors?batchId=${crop.id}`}>View in Devices & Locations</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

export function FeedbackModal({
  crop,
  prediction,
}: {
  crop: CropBatch
  prediction: HarvestPrediction
}) {
  const submitFeedback = useSubmitHarvestFeedback()
  const [open, setOpen] = useState(false)
  const [accuracy, setAccuracy] = useState<HarvestFeedbackAccuracy>("accurate")
  const [daysOff, setDaysOff] = useState(0)
  const [actualHarvestDate, setActualHarvestDate] = useState(toDateInputValue(new Date()))
  const [checkAgainInDays, setCheckAgainInDays] = useState(3)
  const [qualityRating, setQualityRating] = useState<1 | 2 | 3 | 4 | 5>(4)
  const [notes, setNotes] = useState("")

  async function onSubmit() {
    await submitFeedback.mutateAsync({
      batchId: crop.id,
      predictedHarvestDate: prediction.predictedHarvestDate,
      actualHarvestDate: new Date(`${actualHarvestDate}T00:00:00`).toISOString(),
      accuracy,
      daysOff: Number(daysOff),
      checkAgainInDays: accuracy === "not_ready" ? Number(checkAgainInDays) : undefined,
      qualityRating,
      notes: notes.trim() || undefined,
    })
    toast.success(
      accuracy === "not_ready"
        ? "Check again scheduled."
        : "Harvest result saved. Future estimates will use this result.",
    )
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <ClipboardCheck className="size-4" aria-hidden="true" />
          Record harvest result
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Record harvest result</DialogTitle>
          <DialogDescription>
            Save what happened in the crop so future dates get better.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <label className="grid gap-2 text-sm font-medium">
            Result
            <Select value={accuracy} onValueChange={(value) => setAccuracy(value as HarvestFeedbackAccuracy)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="accurate">Accurate</SelectItem>
                <SelectItem value="early">Ready earlier</SelectItem>
                <SelectItem value="late">Ready later</SelectItem>
                <SelectItem value="not_ready">Not ready yet</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              Actual harvest date
              <Input
                type="date"
                value={actualHarvestDate}
                onChange={(event) => setActualHarvestDate(event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Days off
              <Input
                type="number"
                value={daysOff}
                onChange={(event) => setDaysOff(Number(event.target.value))}
              />
            </label>
          </div>
          {accuracy === "not_ready" ? (
            <label className="grid gap-2 text-sm font-medium">
              Check again in days
              <Input
                type="number"
                min={1}
                value={checkAgainInDays}
                onChange={(event) => setCheckAgainInDays(Number(event.target.value))}
              />
            </label>
          ) : null}
          <label className="grid gap-2 text-sm font-medium">
            Quality rating
            <Select
              value={String(qualityRating)}
              onValueChange={(value) => setQualityRating(Number(value) as 1 | 2 | 3 | 4 | 5)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <SelectItem key={rating} value={String(rating)}>
                    {rating}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Notes
            <Input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional" />
          </label>
        </div>
        <DialogFooter showCloseButton>
          <Button onClick={onSubmit} disabled={submitFeedback.isPending}>
            {submitFeedback.isPending ? "Saving" : "Save harvest check"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function EditCropDialog({ crop, disabled }: { crop: CropBatch; disabled: boolean }) {
  const updateCrop = useUpdateCropBatch()
  const [open, setOpen] = useState(false)
  const [plantedAt, setPlantedAt] = useState(toDateInputValue(new Date(crop.plantedAt)))
  const [plantCount, setPlantCount] = useState(crop.plantCount)
  const [rack, setRack] = useState(crop.rack)
  const [zone, setZone] = useState(crop.zone)
  const [notes, setNotes] = useState(crop.notes ?? "")

  async function onSave() {
    await updateCrop.mutateAsync({
      id: crop.id,
      plantedAt: new Date(`${plantedAt}T00:00:00`).toISOString(),
      plantCount: Number(plantCount),
      rack,
      zone,
      notes: notes.trim() || undefined,
    })
    toast.success("Crop details updated.")
    setOpen(false)
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Pencil className="size-4 text-primary" aria-hidden="true" />
          Edit crop
        </CardTitle>
        <CardDescription>
          Update details if the crop setup was entered incorrectly.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {disabled ? (
          <Alert>
            <TriangleAlert className="size-4" aria-hidden="true" />
            <AlertTitle>Limited editing.</AlertTitle>
            <AlertDescription>
              Completed, cancelled, failed, and archived crops should only keep notes or status changes.
            </AlertDescription>
          </Alert>
        ) : (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Pencil className="size-4" aria-hidden="true" />
                Edit crop details
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit crop details</DialogTitle>
                <DialogDescription>
                  Changing rack or zone may require a device connection review.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <label className="grid gap-2 text-sm font-medium">
                  Planting date
                  <Input type="date" value={plantedAt} onChange={(event) => setPlantedAt(event.target.value)} />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Plant count
                  <Input type="number" min={1} value={plantCount} onChange={(event) => setPlantCount(Number(event.target.value))} />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium">
                    Rack
                    <Input value={rack} onChange={(event) => setRack(event.target.value)} />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Zone
                    <Input value={zone} onChange={(event) => setZone(event.target.value)} />
                  </label>
                </div>
                <label className="grid gap-2 text-sm font-medium">
                  Notes
                  <Input value={notes} onChange={(event) => setNotes(event.target.value)} />
                </label>
              </div>
              <DialogFooter showCloseButton>
                <Button onClick={onSave} disabled={updateCrop.isPending}>
                  {updateCrop.isPending ? "Saving" : "Save changes"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
      <CardFooter className="justify-end border-t">
        <Button asChild variant="outline">
          <Link href={connectDevicesHref(crop.id)}>Change device connection</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

export function CropStatusActions({ crop }: { crop: CropBatch }) {
  const updateStatus = useUpdateCropStatus()

  async function setStatus(status: CropBatch["status"]) {
    await updateStatus.mutateAsync({ id: crop.id, status })
    toast.success("Crop status updated.")
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Settings className="size-4 text-primary" aria-hidden="true" />
          Status actions
        </CardTitle>
        <CardDescription>
          Use these only when the crop outcome needs to be corrected.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        <Button variant="outline" onClick={() => setStatus("cancelled")} disabled={updateStatus.isPending}>
          <XCircle className="size-4" aria-hidden="true" />
          Mark cancelled
        </Button>
        <Button variant="outline" onClick={() => setStatus("failed")} disabled={updateStatus.isPending}>
          <TriangleAlert className="size-4" aria-hidden="true" />
          Mark failed
        </Button>
        <Button variant="outline" onClick={() => setStatus("archived")} disabled={updateStatus.isPending}>
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          Archive crop
        </Button>
      </CardContent>
    </Card>
  )
}

function GrowthTimeline({
  crop,
  prediction,
  feedbackHistory,
}: {
  crop: CropBatch
  prediction: HarvestPrediction
  feedbackHistory: { submittedAt: string; accuracy: HarvestFeedbackAccuracy }[]
}) {
  const events = [
    {
      date: crop.plantedAt,
      title: "Planted",
      description: `${crop.plantCount} plants started in ${crop.rack} / ${crop.zone}.`,
    },
    {
      date: crop.createdAt ?? crop.plantedAt,
      title: "Starter estimate created",
      description: `Starter ready date was ${formatDate(crop.genericHarvestDate)}.`,
    },
    ...(crop.sensorGroupId
      ? [{
          date: crop.updatedAt ?? crop.createdAt ?? crop.plantedAt,
          title: "Device readings started",
          description: "Connected readings are used for this ready-date estimate.",
        }]
      : []),
    {
      date: crop.updatedAt ?? prediction.predictedHarvestDate,
      title: "Estimate updated",
      description: `Expected ready date is ${formatDate(prediction.predictedHarvestDate)}.`,
    },
    ...feedbackHistory.map((feedback) => ({
      date: feedback.submittedAt,
      title: "Harvest check recorded",
      description:
        feedback.accuracy === "not_ready"
          ? "Crop needed more time before harvest."
          : "Harvest result recorded.",
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <History className="size-4 text-primary" aria-hidden="true" />
          History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {events.map((event) => (
          <div key={`${event.title}-${event.date}`} className="flex gap-3">
            <div className="mt-1 size-2 rounded-full bg-primary" />
            <div>
              <p className="font-medium">{event.title}</p>
              <p className="text-xs text-muted-foreground">{formatDate(event.date)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function FeedbackHistory({
  feedbackHistory,
}: {
  feedbackHistory: { id: string; submittedAt: string; accuracy: HarvestFeedbackAccuracy; daysOff: number }[]
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Past checks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {feedbackHistory.length ? (
          feedbackHistory.map((feedback) => (
            <div key={feedback.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
              <div>
                <p className="font-medium">{formatAccuracy(feedback.accuracy)}</p>
                <p className="text-sm text-muted-foreground">{formatDate(feedback.submittedAt)}</p>
              </div>
              <Badge variant="outline">{Math.abs(feedback.daysOff)} days off</Badge>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No harvest checks recorded yet.</p>
        )}
      </CardContent>
    </Card>
  )
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/40 p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  )
}

function FactorIcon({ status }: { status: PredictionFactorStatus }) {
  const className = cn(
    "mt-0.5 size-4",
    status === "positive" && "text-emerald-600",
    status === "negative" && "text-orange-600",
    status === "neutral" && "text-muted-foreground",
  )

  if (status === "positive") {
    return <CheckCircle2 className={className} aria-hidden="true" />
  }

  if (status === "negative") {
    return <TriangleAlert className={className} aria-hidden="true" />
  }

  return <Clock className={className} aria-hidden="true" />
}

function CropDetailSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-80 max-w-full" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <Skeleton className="h-44" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
      </div>
      <Skeleton className="h-72" />
    </div>
  )
}

function getConnectedGroup(crop: CropBatch, sensorGroups: SensorGroup[]) {
  return crop.sensorGroupId
    ? sensorGroups.find((group) => group.id === crop.sensorGroupId)
    : sensorGroups.find((group) => group.assignedBatchId === crop.id)
}

function getDevicesForGroup(sensorGroup: SensorGroup, sensorDevices: SensorDevice[]) {
  const sensorIds = new Set(sensorGroup.sensorIds)

  return sensorDevices.filter(
    (device) => sensorIds.has(device.id) || device.sensorGroupId === sensorGroup.id,
  )
}

function getAvailableSensorTypes(devices: SensorDevice[]) {
  return new Set(
    devices
      .filter((device) => device.status === "online")
      .flatMap((device) => device.sensorTypes),
  )
}

function expandSingleReading(reading: SensorReading | undefined, metric: MetricDefinition) {
  if (!reading || reading[metric.readingKey] === undefined) {
    return []
  }

  return [-3, -2, -1, 0].map((offset) => ({
    ...reading,
    timestamp: addDays(reading.timestamp, offset),
    [metric.readingKey]: Number(reading[metric.readingKey]) + offset * 0.15,
  }))
}

function formatMetricValue(value: SensorReading[MetricDefinition["readingKey"]], unit: string) {
  if (typeof value !== "number") {
    return "Not tracked"
  }

  return `${Number(value.toFixed(1))}${unit}`
}

function getMetricImpact(status: string) {
  return status === "In range"
    ? "This condition supports the current ready date."
    : "This condition may shift the ready date."
}

function connectDevicesHref(batchId: string) {
  return `/sensors?action=assign&batchId=${batchId}&returnTo=/crops/${batchId}`
}

function getNextActionCopy({
  status,
  assignmentState,
  feedbackState,
}: {
  status: CropBatch["status"]
  assignmentState: string
  feedbackState: string
}) {
  if (feedbackState === "awaiting_feedback" || status === "feedback_needed") {
    return "Record the harvest result for this crop."
  }

  if (assignmentState !== "assigned") {
    return "Connect devices so the ready date can use live growing conditions."
  }

  return "Keep watching the ready window and growing conditions."
}

function getShiftCopy(shiftDays: number) {
  if (shiftDays === 0) {
    return "0 days"
  }

  return `${Math.abs(shiftDays)} days ${shiftDays < 0 ? "earlier" : "later"}`
}

function formatFeedbackState(value: string) {
  if (value === "awaiting_feedback") {
    return "Harvest check needed"
  }
  if (value === "check_again_scheduled") {
    return "Check again scheduled"
  }
  if (value === "submitted") {
    return "Harvest result recorded"
  }

  return "No check needed"
}

function formatSensorType(type: SensorType) {
  if (type === "ph") return "pH"
  if (type === "ec") return "EC"
  if (type === "light") return "Light"
  return type.charAt(0).toUpperCase() + type.slice(1)
}

function formatAccuracy(value: HarvestFeedbackAccuracy) {
  const labels: Record<HarvestFeedbackAccuracy, string> = {
    accurate: "Accurate",
    early: "Ready earlier",
    late: "Ready later",
    not_ready: "Not ready yet",
  }

  return labels[value]
}

function isTerminalCrop(crop: CropBatch) {
  return ["completed", "cancelled", "failed", "archived"].includes(crop.status)
}

function addDays(value: string, days: number) {
  const date = new Date(value)
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value))
}

function formatTinyDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value))
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10)
}
