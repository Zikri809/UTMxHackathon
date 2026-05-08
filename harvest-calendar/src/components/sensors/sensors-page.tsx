"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import {
  Boxes,
  CheckCircle2,
  CircleAlert,
  MapPin,
  Pencil,
  PlugZap,
  Plus,
  Router,
  TriangleAlert,
  Wifi,
  WifiOff,
} from "lucide-react"
import { toast } from "sonner"

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  getMissingSensorTypes,
  getSensorAssignmentState,
} from "@/lib/domain/selectors"
import {
  useAssignSensorGroupToBatch,
  useCreateFarmLocation,
  useCropBatchSummaries,
  useFarmLocations,
  usePlantProfiles,
  useSensorDevices,
  useSensorGroups,
  useUpdateFarmLocation,
} from "@/lib/query/hooks"
import { cn } from "@/lib/utils"
import type { CropBatchSummary } from "@/types/crop"
import type { GrowingMethod, SensorAssignmentState } from "@/types/domain"
import type { FarmLocation } from "@/types/location"
import type { PlantProfile } from "@/types/plant"
import type { SensorDevice, SensorDeviceStatus, SensorGroup, SensorType } from "@/types/sensor"

type ConnectDevicesDialogProps = {
  crops: CropBatchSummary[]
  sensorGroups: SensorGroup[]
  sensorDevices: SensorDevice[]
  plantProfiles: PlantProfile[]
  initialBatchId?: string
  initialOpen?: boolean
  returnTo?: string
  trigger?: React.ReactNode
}

const ACTIVE_CROP_STATUSES = ["growing", "ready_soon", "feedback_needed"]
const methodLabels: Record<GrowingMethod, string> = {
  hydroponic: "Hydroponic",
  soil: "Soil",
  aeroponic: "Aeroponic",
}

export function SensorsPage() {
  const searchParams = useSearchParams()
  const selectedBatchId = searchParams.get("batchId") ?? undefined
  const action = searchParams.get("action")
  const returnTo = searchParams.get("returnTo") ?? undefined

  const devicesQuery = useSensorDevices()
  const groupsQuery = useSensorGroups()
  const cropsQuery = useCropBatchSummaries()
  const locationsQuery = useFarmLocations()
  const plantProfilesQuery = usePlantProfiles()

  const loading =
    devicesQuery.isLoading ||
    groupsQuery.isLoading ||
    cropsQuery.isLoading ||
    locationsQuery.isLoading ||
    plantProfilesQuery.isLoading
  const error =
    devicesQuery.isError ||
    groupsQuery.isError ||
    cropsQuery.isError ||
    locationsQuery.isError ||
    plantProfilesQuery.isError

  if (loading) {
    return <SensorsPageSkeleton />
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <TriangleAlert className="size-4" aria-hidden="true" />
        <AlertTitle>Could not load Devices & Locations.</AlertTitle>
        <AlertDescription>
          Try again to refresh device groups, crops, and rack details.
        </AlertDescription>
        <AlertAction>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              void devicesQuery.refetch()
              void groupsQuery.refetch()
              void cropsQuery.refetch()
              void locationsQuery.refetch()
              void plantProfilesQuery.refetch()
            }}
          >
            Retry
          </Button>
        </AlertAction>
      </Alert>
    )
  }

  const sensorDevices = devicesQuery.data ?? []
  const sensorGroups = groupsQuery.data ?? []
  const crops = cropsQuery.data ?? []
  const farmLocations = locationsQuery.data ?? []
  const plantProfiles = plantProfilesQuery.data ?? []
  const activeCrops = crops.filter((crop) =>
    ACTIVE_CROP_STATUSES.includes(crop.status),
  )
  const cropNeedingDevices = activeCrops.filter((crop) =>
    ["missing", "ambiguous", "offline"].includes(
      getSensorAssignmentState(crop, sensorGroups, sensorDevices),
    ),
  )
  const missingMetrics = getMissingMetricRows({
    crops: activeCrops,
    sensorGroups,
    sensorDevices,
    plantProfiles,
  })
  const highlightedCrop = selectedBatchId
    ? crops.find((crop) => crop.id === selectedBatchId)
    : undefined

  return (
    <div className="space-y-5">
      <PageHeader
        title="Devices & Locations"
        description="See where devices are placed and connect them to crops."
        action={
          <ConnectDevicesDialog
            crops={crops}
            sensorGroups={sensorGroups}
            sensorDevices={sensorDevices}
            plantProfiles={plantProfiles}
            initialBatchId={selectedBatchId}
            initialOpen={action === "assign"}
            returnTo={returnTo}
            trigger={
              <Button>
                <PlugZap className="size-4" aria-hidden="true" />
                Connect devices
              </Button>
            }
          />
        }
      />

      {highlightedCrop ? (
        <Alert>
          <PlugZap className="size-4" aria-hidden="true" />
          <AlertTitle>{highlightedCrop.plantName} device connection</AlertTitle>
          <AlertDescription>
            {highlightedCrop.rack} / {highlightedCrop.zone} · Reliability{" "}
            {highlightedCrop.predictionSummary.confidence}% ·{" "}
            {formatAssignmentState(
              getSensorAssignmentState(highlightedCrop, sensorGroups, sensorDevices),
            )}
          </AlertDescription>
          <AlertAction>
            <Button asChild size="sm" variant="outline">
              <Link href={`/crops/${highlightedCrop.id}`}>View crop</Link>
            </Button>
          </AlertAction>
        </Alert>
      ) : null}

      <SummaryRow
        onlineDevices={
          sensorDevices.filter((device) => device.status === "online").length
        }
        connectedGroups={
          sensorGroups.filter((group) => Boolean(group.assignedBatchId)).length
        }
        unconnectedGroups={
          sensorGroups.filter((group) => !group.assignedBatchId).length
        }
        cropsNeedingDevices={cropNeedingDevices.length}
        missingMetrics={missingMetrics.length}
      />

      <MissingDeviceConnectionPanel
        crops={cropNeedingDevices}
        sensorGroups={sensorGroups}
        sensorDevices={sensorDevices}
        plantProfiles={plantProfiles}
      />

      <FarmLocationTable
        farmLocations={farmLocations}
        sensorGroups={sensorGroups}
        crops={activeCrops}
      />

      <DeviceGroupTable
        sensorGroups={sensorGroups}
        sensorDevices={sensorDevices}
        crops={crops}
        plantProfiles={plantProfiles}
        selectedBatchId={selectedBatchId}
      />

      <DeviceTable
        sensorDevices={sensorDevices}
        sensorGroups={sensorGroups}
        crops={crops}
      />
    </div>
  )
}

function SummaryRow({
  onlineDevices,
  connectedGroups,
  unconnectedGroups,
  cropsNeedingDevices,
  missingMetrics,
}: {
  onlineDevices: number
  connectedGroups: number
  unconnectedGroups: number
  cropsNeedingDevices: number
  missingMetrics: number
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <SummaryCard icon={Wifi} label="Online devices" value={onlineDevices} />
      <SummaryCard icon={CheckCircle2} label="Connected groups" value={connectedGroups} />
      <SummaryCard icon={PlugZap} label="Unconnected groups" value={unconnectedGroups} />
      <SummaryCard icon={CircleAlert} label="Crops needing devices" value={cropsNeedingDevices} />
      <SummaryCard icon={TriangleAlert} label="Missing metrics" value={missingMetrics} />
    </div>
  )
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  label: string
  value: number
}) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
        </div>
        <Icon className="size-5 text-primary" aria-hidden />
      </CardContent>
    </Card>
  )
}

function MissingDeviceConnectionPanel({
  crops,
  sensorGroups,
  sensorDevices,
  plantProfiles,
}: {
  crops: CropBatchSummary[]
  sensorGroups: SensorGroup[]
  sensorDevices: SensorDevice[]
  plantProfiles: PlantProfile[]
}) {
  if (!crops.length) {
    return null
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Missing device connection</CardTitle>
        <CardDescription>
          These crops can still use a starter estimate, but reliability may be lower.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 lg:grid-cols-2">
        {crops.map((crop) => (
          <div
            key={crop.id}
            className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium">{crop.plantName}</p>
              <p className="text-sm text-muted-foreground">
                {crop.rack} / {crop.zone} · Reliability{" "}
                {crop.predictionSummary.confidence}%
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatMissingMetricsForCrop(crop, sensorGroups, sensorDevices, plantProfiles)}
              </p>
            </div>
            <ConnectDevicesDialog
              crops={crops}
              sensorGroups={sensorGroups}
              sensorDevices={sensorDevices}
              plantProfiles={plantProfiles}
              initialBatchId={crop.id}
              trigger={
                <Button size="sm" variant="outline">
                  Connect devices
                </Button>
              }
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function FarmLocationTable({
  farmLocations,
  sensorGroups,
  crops,
}: {
  farmLocations: FarmLocation[]
  sensorGroups: SensorGroup[]
  crops: CropBatchSummary[]
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="size-4 text-primary" aria-hidden="true" />
          Farm locations
        </CardTitle>
        <CardDescription>
          New rack and zone entries can exist as placement-only locations.
        </CardDescription>
        <CardAction>
          <LocationDialog
            trigger={
              <Button size="sm">
                <Plus className="size-4" aria-hidden="true" />
                Add rack/zone
              </Button>
            }
          />
        </CardAction>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Location</TableHead>
              <TableHead>Rack</TableHead>
              <TableHead>Zone</TableHead>
              <TableHead>Device groups</TableHead>
              <TableHead>Active crops</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {farmLocations.map((location) => {
              const groupCount = sensorGroups.filter(
                (group) =>
                  group.farmLocationId === location.id ||
                  (group.rack === location.rack && group.zone === location.zone),
              ).length
              const cropCount = crops.filter(
                (crop) =>
                  crop.farmLocationId === location.id ||
                  (crop.rack === location.rack && crop.zone === location.zone),
              ).length

              return (
                <TableRow key={location.id}>
                  <TableCell className="font-medium">{location.label}</TableCell>
                  <TableCell>{location.rack}</TableCell>
                  <TableCell>{location.zone}</TableCell>
                  <TableCell>{groupCount || "Placement-only"}</TableCell>
                  <TableCell>{cropCount}</TableCell>
                  <TableCell>
                    <Badge variant={location.status === "active" ? "secondary" : "outline"}>
                      {location.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <LocationDialog
                        location={location}
                        trigger={
                          <Button size="sm" variant="outline">
                            <Pencil className="size-4" aria-hidden="true" />
                            Edit
                          </Button>
                        }
                      />
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/crops/new?farmLocationId=${location.id}`}>
                          Add crop
                        </Link>
                      </Button>
                    </div>
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

export function DeviceGroupTable({
  sensorGroups,
  sensorDevices,
  crops,
  plantProfiles,
  selectedBatchId,
}: {
  sensorGroups: SensorGroup[]
  sensorDevices: SensorDevice[]
  crops: CropBatchSummary[]
  plantProfiles: PlantProfile[]
  selectedBatchId?: string
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Boxes className="size-4 text-primary" aria-hidden="true" />
          Device groups
        </CardTitle>
        <CardDescription>
          A device group should be connected to one active crop at a time.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sensorGroups.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device group</TableHead>
                <TableHead>Rack</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead>Devices</TableHead>
                <TableHead>Metrics tracked</TableHead>
                <TableHead>Not tracked</TableHead>
                <TableHead>Connected crop</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sensorGroups.map((group) => {
                const devices = getDevicesForGroup(group, sensorDevices)
                const crop = group.assignedBatchId
                  ? crops.find((item) => item.id === group.assignedBatchId)
                  : undefined
                const missingMetrics = crop
                  ? getMissingMetricLabels(crop, group, sensorDevices, plantProfiles)
                  : []
                const status = getGroupStatus(group, devices, crop, missingMetrics)

                return (
                  <TableRow
                    key={group.id}
                    className={cn(
                      crop?.id === selectedBatchId && "bg-muted/60",
                    )}
                  >
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell>{group.rack}</TableCell>
                    <TableCell>{group.zone}</TableCell>
                    <TableCell>{devices.length}</TableCell>
                    <TableCell>{formatSensorTypes(getAvailableSensorTypes(devices))}</TableCell>
                    <TableCell>{missingMetrics.length ? missingMetrics.join(", ") : "None"}</TableCell>
                    <TableCell>{crop?.plantName ?? "Unconnected"}</TableCell>
                    <TableCell>
                      <ConnectionStatusBadge status={status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <ConnectDevicesDialog
                          crops={crops}
                          sensorGroups={sensorGroups}
                          sensorDevices={sensorDevices}
                          plantProfiles={plantProfiles}
                          trigger={
                            <Button size="sm" variant="outline">
                              {crop ? "Change" : "Connect"}
                            </Button>
                          }
                        />
                        {crop ? (
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/crops/${crop.id}`}>View crop</Link>
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">
            No devices are registered in the demo farm.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export function DeviceTable({
  sensorDevices,
  sensorGroups,
  crops,
}: {
  sensorDevices: SensorDevice[]
  sensorGroups: SensorGroup[]
  crops: CropBatchSummary[]
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Router className="size-4 text-primary" aria-hidden="true" />
          Devices
        </CardTitle>
        <CardDescription>
          Online devices keep crop conditions current.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sensorDevices.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <TableHead>Metrics tracked</TableHead>
                <TableHead>Rack</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead>Device group</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Connected crop</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sensorDevices.map((device) => {
                const group = device.sensorGroupId
                  ? sensorGroups.find((item) => item.id === device.sensorGroupId)
                  : undefined
                const crop = device.assignedBatchId
                  ? crops.find((item) => item.id === device.assignedBatchId)
                  : group?.assignedBatchId
                    ? crops.find((item) => item.id === group.assignedBatchId)
                    : undefined

                return (
                  <TableRow key={device.id}>
                    <TableCell className="font-medium">{device.name}</TableCell>
                    <TableCell>{formatSensorTypes(device.sensorTypes)}</TableCell>
                    <TableCell>{device.rack}</TableCell>
                    <TableCell>{device.zone}</TableCell>
                    <TableCell>{group?.name ?? "No group"}</TableCell>
                    <TableCell>
                      <SensorStatusBadge status={device.status} />
                    </TableCell>
                    <TableCell>{crop?.plantName ?? "Unconnected"}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">
            No devices are registered in the demo farm.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export function ConnectDevicesDialog({
  crops,
  sensorGroups,
  sensorDevices,
  plantProfiles,
  initialBatchId,
  initialOpen = false,
  returnTo,
  trigger,
}: ConnectDevicesDialogProps) {
  const router = useRouter()
  const assignSensorGroup = useAssignSensorGroupToBatch()
  const activeCrops = crops.filter((crop) =>
    ACTIVE_CROP_STATUSES.includes(crop.status),
  )
  const defaultCrop = initialBatchId ?? activeCrops[0]?.id ?? ""
  const matchingGroup = defaultCrop
    ? sensorGroups.find((group) => {
      const crop = crops.find((item) => item.id === defaultCrop)
      return crop && matchesLocation(group, crop)
    })
    : undefined
  const [open, setOpen] = useState(initialOpen)
  const [batchId, setBatchId] = useState(defaultCrop)
  const [sensorGroupId, setSensorGroupId] = useState(
    matchingGroup?.id ?? sensorGroups[0]?.id ?? "",
  )
  const [confirmedReconnect, setConfirmedReconnect] = useState(false)

  const crop = crops.find((item) => item.id === batchId)
  const group = sensorGroups.find((item) => item.id === sensorGroupId)
  const groupDevices = group ? getDevicesForGroup(group, sensorDevices) : []
  const previousCrop = group?.assignedBatchId
    ? crops.find((item) => item.id === group.assignedBatchId)
    : undefined
  const isReconnect =
    Boolean(previousCrop) && previousCrop?.id !== crop?.id
  const missingMetrics =
    crop && group
      ? getMissingMetricLabels(crop, group, sensorDevices, plantProfiles)
      : []
  const locationMismatch = Boolean(crop && group && !matchesLocation(group, crop))

  async function onSubmit() {
    if (!batchId || !sensorGroupId) {
      return
    }

    if (isReconnect && !confirmedReconnect) {
      setConfirmedReconnect(true)
      return
    }

    await assignSensorGroup.mutateAsync({ batchId, sensorGroupId })
    toast.success("Devices connected.")
    setOpen(false)

    if (returnTo) {
      router.push(returnTo)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Connect devices</DialogTitle>
          <DialogDescription>
            Choose the crop and device group that share the same growing location.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              Crop batch
              <Select
                value={batchId}
                onValueChange={(value) => {
                  setBatchId(value)
                  setConfirmedReconnect(false)
                  const nextCrop = crops.find((item) => item.id === value)
                  const nextGroup = sensorGroups.find((item) =>
                    nextCrop ? matchesLocation(item, nextCrop) : false,
                  )
                  if (nextGroup) {
                    setSensorGroupId(nextGroup.id)
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose crop" />
                </SelectTrigger>
                <SelectContent>
                  {activeCrops.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.plantName} · {item.rack} / {item.zone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Device group
              <Select
                value={sensorGroupId}
                onValueChange={(value) => {
                  setSensorGroupId(value)
                  setConfirmedReconnect(false)
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose device group" />
                </SelectTrigger>
                <SelectContent>
                  {sensorGroups.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} · {item.rack} / {item.zone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </div>

          {crop && group ? (
            <div className="grid gap-3 md:grid-cols-2">
              <InfoTile label="Crop location" value={`${crop.rack} / ${crop.zone}`} />
              <InfoTile label="Device group location" value={`${group.rack} / ${group.zone}`} />
              <InfoTile label="Crop status" value={formatCropStatus(crop.status)} />
              <InfoTile label="Metrics tracked" value={formatSensorTypes(getAvailableSensorTypes(groupDevices))} />
            </div>
          ) : null}

          {locationMismatch ? (
            <Alert>
              <TriangleAlert className="size-4" aria-hidden="true" />
              <AlertTitle>Different rack or zone.</AlertTitle>
              <AlertDescription>
                You can connect these devices, but review the crop location after saving.
              </AlertDescription>
            </Alert>
          ) : null}

          {missingMetrics.length ? (
            <Alert>
              <CircleAlert className="size-4" aria-hidden="true" />
              <AlertTitle>Some expected metrics are Not tracked.</AlertTitle>
              <AlertDescription>
                {missingMetrics.join(", ")} may lower reliability until a matching device is connected.
              </AlertDescription>
            </Alert>
          ) : null}

          {isReconnect ? (
            <Alert>
              <TriangleAlert className="size-4" aria-hidden="true" />
              <AlertTitle>Reconnect this device group?</AlertTitle>
              <AlertDescription>
                This will move {group?.name} from {previousCrop?.plantName} to{" "}
                {crop?.plantName}.
              </AlertDescription>
            </Alert>
          ) : null}
        </div>
        <DialogFooter showCloseButton>
          <Button
            onClick={onSubmit}
            disabled={!batchId || !sensorGroupId || assignSensorGroup.isPending}
          >
            {assignSensorGroup.isPending
              ? "Connecting"
              : isReconnect && !confirmedReconnect
                ? "Review reconnect"
                : "Connect devices"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function LocationDialog({
  location,
  trigger,
}: {
  location?: FarmLocation
  trigger: React.ReactNode
}) {
  const createLocation = useCreateFarmLocation()
  const updateLocation = useUpdateFarmLocation()
  const [open, setOpen] = useState(false)
  const [rack, setRack] = useState(location?.rack ?? "")
  const [zone, setZone] = useState(location?.zone ?? "")
  const [label, setLabel] = useState(location?.label ?? "")
  const [defaultGrowingMethod, setDefaultGrowingMethod] = useState<GrowingMethod>(
    location?.defaultGrowingMethod ?? "hydroponic",
  )

  async function onSave() {
    if (location) {
      await updateLocation.mutateAsync({
        id: location.id,
        rack,
        zone,
        label: label.trim() || `${rack} / ${zone}`,
        defaultGrowingMethod,
      })
      toast.success("Location updated.")
    } else {
      await createLocation.mutateAsync({
        rack,
        zone,
        label: label.trim() || `${rack} / ${zone}`,
        defaultGrowingMethod,
      })
      toast.success("Location added.")
    }

    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{location ? "Edit location" : "Add rack/zone"}</DialogTitle>
          <DialogDescription>
            Locations can be used before a device group exists there.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
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
            Label
            <Input value={label} onChange={(event) => setLabel(event.target.value)} />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Growing method
            <Select
              value={defaultGrowingMethod}
              onValueChange={(value) => setDefaultGrowingMethod(value as GrowingMethod)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(methodLabels).map(([value, text]) => (
                  <SelectItem key={value} value={value}>
                    {text}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        </div>
        <DialogFooter showCloseButton>
          <Button
            onClick={onSave}
            disabled={!rack || !zone || createLocation.isPending || updateLocation.isPending}
          >
            {createLocation.isPending || updateLocation.isPending ? "Saving" : "Save location"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SensorStatusBadge({ status }: { status: SensorDeviceStatus }) {
  const icon =
    status === "online" ? (
      <Wifi className="size-3" aria-hidden="true" />
    ) : (
      <WifiOff className="size-3" aria-hidden="true" />
    )

  return (
    <Badge variant={status === "online" ? "secondary" : "outline"}>
      {icon}
      {status}
    </Badge>
  )
}

function ConnectionStatusBadge({ status }: { status: GroupDisplayStatus }) {
  const variant = status === "Connected" ? "secondary" : status === "Offline devices" ? "destructive" : "outline"

  return <Badge variant={variant}>{status}</Badge>
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/40 p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  )
}

export function SensorsPageSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-72" />
      <Skeleton className="h-72" />
      <Skeleton className="h-72" />
    </div>
  )
}

type GroupDisplayStatus =
  | "Connected"
  | "Unconnected"
  | "Needs review"
  | "Offline devices"
  | "Missing expected metric"

function getGroupStatus(
  group: SensorGroup,
  devices: SensorDevice[],
  crop: CropBatchSummary | undefined,
  missingMetrics: string[],
): GroupDisplayStatus {
  if (devices.length && devices.every((device) => device.status !== "online")) {
    return "Offline devices"
  }

  if (!crop) {
    return group.assignedBatchId ? "Needs review" : "Unconnected"
  }

  if (missingMetrics.length) {
    return "Missing expected metric"
  }

  return "Connected"
}

function getMissingMetricRows({
  crops,
  sensorGroups,
  sensorDevices,
  plantProfiles,
}: {
  crops: CropBatchSummary[]
  sensorGroups: SensorGroup[]
  sensorDevices: SensorDevice[]
  plantProfiles: PlantProfile[]
}) {
  return crops.flatMap((crop) => {
    const group = getConnectedGroup(crop, sensorGroups)
    const missing = getMissingMetricLabels(crop, group, sensorDevices, plantProfiles)

    return missing.map((metric) => ({ crop, metric }))
  })
}

function formatMissingMetricsForCrop(
  crop: CropBatchSummary,
  sensorGroups: SensorGroup[],
  sensorDevices: SensorDevice[],
  plantProfiles: PlantProfile[],
) {
  const group = getConnectedGroup(crop, sensorGroups)
  const missing = getMissingMetricLabels(crop, group, sensorDevices, plantProfiles)

  return missing.length ? `Not tracked: ${missing.join(", ")}` : "Needs review"
}

function getMissingMetricLabels(
  crop: CropBatchSummary,
  group: SensorGroup | undefined,
  sensorDevices: SensorDevice[],
  plantProfiles: PlantProfile[],
) {
  const plantProfile = plantProfiles.find((profile) => profile.id === crop.plantProfileId)

  if (!plantProfile) {
    return []
  }

  return getMissingSensorTypes(crop, plantProfile, group, sensorDevices).map(formatSensorType)
}

function getConnectedGroup(crop: CropBatchSummary, sensorGroups: SensorGroup[]) {
  return crop.sensorGroupId
    ? sensorGroups.find((group) => group.id === crop.sensorGroupId)
    : sensorGroups.find((group) => group.assignedBatchId === crop.id)
}

function matchesLocation(group: SensorGroup, crop: CropBatchSummary) {
  if (group.farmLocationId && crop.farmLocationId) {
    return group.farmLocationId === crop.farmLocationId
  }

  return group.rack === crop.rack && group.zone === crop.zone
}

function getDevicesForGroup(group: SensorGroup, devices: SensorDevice[]) {
  const sensorIds = new Set(group.sensorIds)

  return devices.filter(
    (device) => sensorIds.has(device.id) || device.sensorGroupId === group.id,
  )
}

function getAvailableSensorTypes(devices: SensorDevice[]) {
  return Array.from(
    new Set(
      devices
        .filter((device) => device.status === "online")
        .flatMap((device) => device.sensorTypes),
    ),
  )
}

function formatSensorTypes(types: SensorType[]) {
  return types.length ? types.map(formatSensorType).join(", ") : "Not tracked"
}

function formatSensorType(type: SensorType) {
  const labels: Record<SensorType, string> = {
    temperature: "Temperature",
    humidity: "Humidity",
    ph: "pH",
    ec: "EC",
    light: "Light",
    moisture: "Moisture",
  }

  return labels[type]
}

function formatAssignmentState(state: SensorAssignmentState) {
  const labels: Record<SensorAssignmentState, string> = {
    assigned: "Connected",
    missing: "Connect devices",
    ambiguous: "Needs review",
    offline: "Offline devices",
  }

  return labels[state]
}

function formatCropStatus(status: CropBatchSummary["status"]) {
  if (status === "ready_soon") return "Ready soon"
  if (status === "feedback_needed") return "Harvest check needed"
  if (status === "growing") return "On track"
  return status
}
