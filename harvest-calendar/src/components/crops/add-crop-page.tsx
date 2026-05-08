"use client"

import Link from "next/link"
import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  ArrowLeft,
  CalendarDays,
  Leaf,
  MapPin,
  PlugZap,
  Sprout,
  TriangleAlert,
} from "lucide-react"
import { useForm, useWatch, type Resolver, type UseFormReturn } from "react-hook-form"
import { z } from "zod"

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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useCreateCropBatchWithDependencies,
  useCropBatches,
  useFarmLocations,
  useModelLearningStats,
  usePlantProfiles,
  useSensorDevices,
  useSensorGroups,
} from "@/lib/query/hooks"
import type { ModelMaturity } from "@/types/domain"
import type { FarmLocation } from "@/types/location"
import type { PlantIdealRanges, PlantProfile } from "@/types/plant"
import type { SensorDevice, SensorGroup } from "@/types/sensor"

const CUSTOM_PLANT = "__custom_plant__"
const CUSTOM_LOCATION = "__custom_location__"
const NO_DEVICE_GROUP = "__no_device_group__"
const optionalNumber = z.preprocess(
  (value) => (value === "" || Number.isNaN(value) ? undefined : value),
  z.coerce.number().optional(),
)

const formSchema = z
  .object({
    plantProfileId: z.string().min(1, "Choose what you are growing."),
    customPlantName: z.string().trim().optional(),
    customPlantVariety: z.string().trim().optional(),
    customMaturityDays: optionalNumber,
    temperatureMin: optionalNumber,
    temperatureMax: optionalNumber,
    phMin: optionalNumber,
    phMax: optionalNumber,
    ecMin: optionalNumber,
    ecMax: optionalNumber,
    lightMin: optionalNumber,
    lightMax: optionalNumber,
    farmLocationId: z.string().min(1, "Choose where this crop is growing."),
    customRack: z.string().trim().optional(),
    customZone: z.string().trim().optional(),
    growingMethod: z.enum(["hydroponic", "soil", "aeroponic"]),
    plantedAt: z.string().min(1, "Add the start date."),
    plantCount: z.coerce.number().int().positive("Plant count must be positive."),
    sensorGroupId: z.string(),
    notes: z.string().max(400, "Keep notes under 400 characters.").optional(),
  })
  .superRefine((value, context) => {
    if (value.plantProfileId === CUSTOM_PLANT) {
      if (!value.customPlantName) {
        context.addIssue({
          code: "custom",
          path: ["customPlantName"],
          message: "Add a plant name.",
        })
      }

      if (!value.customMaturityDays || value.customMaturityDays <= 0) {
        context.addIssue({
          code: "custom",
          path: ["customMaturityDays"],
          message: "Add typical days to ready.",
        })
      }
    }

    if (value.farmLocationId === CUSTOM_LOCATION) {
      if (!value.customRack) {
        context.addIssue({
          code: "custom",
          path: ["customRack"],
          message: "Add a rack name.",
        })
      }

      if (!value.customZone) {
        context.addIssue({
          code: "custom",
          path: ["customZone"],
          message: "Add a zone name.",
        })
      }
    }

    const plantedDate = new Date(`${value.plantedAt}T00:00:00`)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(23, 59, 59, 999)

    if (Number.isNaN(plantedDate.getTime()) || plantedDate > tomorrow) {
      context.addIssue({
        code: "custom",
        path: ["plantedAt"],
        message: "Use today or an earlier start date.",
      })
    }
  })

type AddCropFormValues = z.infer<typeof formSchema>
type AddCropFormApi = UseFormReturn<AddCropFormValues>

export function AddCropPage() {
  const plantProfilesQuery = usePlantProfiles()
  const farmLocationsQuery = useFarmLocations()
  const sensorGroupsQuery = useSensorGroups()
  const sensorDevicesQuery = useSensorDevices()
  const cropBatchesQuery = useCropBatches()
  const learningStatsQuery = useModelLearningStats()

  const requiredLoading = plantProfilesQuery.isLoading || farmLocationsQuery.isLoading
  const deviceLoading = sensorGroupsQuery.isLoading || sensorDevicesQuery.isLoading
  const requiredError = plantProfilesQuery.isError || farmLocationsQuery.isError

  if (requiredLoading) {
    return <AddCropSkeleton />
  }

  if (requiredError) {
    return (
      <Alert variant="destructive">
        <TriangleAlert className="size-4" aria-hidden="true" />
        <AlertTitle>Could not load crop setup.</AlertTitle>
        <AlertDescription>
          Try again to refresh plant and location choices.
        </AlertDescription>
        <AlertAction>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              void plantProfilesQuery.refetch()
              void farmLocationsQuery.refetch()
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
        title="Add Crop"
        description="Create a crop and start with a harvest estimate you can improve over time."
        secondaryAction={
          <Button asChild variant="outline">
            <Link href="/crops">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Crops
            </Link>
          </Button>
        }
      />

      {sensorGroupsQuery.isError || sensorDevicesQuery.isError ? (
        <Alert>
          <TriangleAlert className="size-4" aria-hidden="true" />
          <AlertTitle>Devices can be connected later.</AlertTitle>
          <AlertDescription>
            The form is still ready. Choose no devices for now and connect them
            from Devices & Locations when available.
          </AlertDescription>
        </Alert>
      ) : null}

      <AddCropForm
        plantProfiles={plantProfilesQuery.data ?? []}
        farmLocations={farmLocationsQuery.data ?? []}
        sensorGroups={sensorGroupsQuery.data ?? []}
        sensorDevices={sensorDevicesQuery.data ?? []}
        cropBatches={cropBatchesQuery.data ?? []}
        learningStats={learningStatsQuery.data ?? []}
        deviceLoading={deviceLoading}
      />
    </div>
  )
}

export function AddCropForm({
  plantProfiles,
  farmLocations,
  sensorGroups,
  sensorDevices,
  cropBatches,
  learningStats,
  deviceLoading,
}: {
  plantProfiles: PlantProfile[]
  farmLocations: FarmLocation[]
  sensorGroups: SensorGroup[]
  sensorDevices: SensorDevice[]
  cropBatches: { id: string; plantName: string }[]
  learningStats: { plantProfileId: string; maturityLevel: ModelMaturity; confidence: number }[]
  deviceLoading: boolean
}) {
  const createCrop = useCreateCropBatchWithDependencies()
  const today = toDateInputValue(new Date())
  const firstLocation = farmLocations[0]
  const defaultLocationId = firstLocation?.id ?? CUSTOM_LOCATION

  const form = useForm<AddCropFormValues>({
    resolver: zodResolver(formSchema) as Resolver<AddCropFormValues>,
    defaultValues: {
      plantProfileId: plantProfiles[0]?.id ?? "",
      customPlantName: "",
      customPlantVariety: "",
      customMaturityDays: 35,
      farmLocationId: defaultLocationId,
      customRack: "",
      customZone: "",
      growingMethod: firstLocation?.defaultGrowingMethod ?? "hydroponic",
      plantedAt: today,
      plantCount: 24,
      sensorGroupId: NO_DEVICE_GROUP,
      notes: "",
    },
  })

  const values = useWatch({ control: form.control }) as AddCropFormValues
  const selectedPlant = plantProfiles.find((plant) => plant.id === values.plantProfileId)
  const selectedLocation = farmLocations.find(
    (location) => location.id === values.farmLocationId,
  )
  const matchingDeviceGroups = getMatchingDeviceGroups({
    selectedLocation,
    values,
    sensorGroups,
  })
  const selectedDeviceGroup = sensorGroups.find(
    (group) => group.id === values.sensorGroupId,
  )

  useEffect(() => {
    if (values.farmLocationId === CUSTOM_LOCATION) {
      if (values.sensorGroupId !== NO_DEVICE_GROUP) {
        form.setValue("sensorGroupId", NO_DEVICE_GROUP)
      }
      return
    }

    const unconnectedGroups = matchingDeviceGroups.filter((group) => !group.assignedBatchId)
    if (
      unconnectedGroups.length === 1 &&
      values.sensorGroupId !== unconnectedGroups[0].id
    ) {
      form.setValue("sensorGroupId", unconnectedGroups[0].id)
    } else if (
      values.sensorGroupId !== NO_DEVICE_GROUP &&
      !matchingDeviceGroups.some((group) => group.id === values.sensorGroupId)
    ) {
      form.setValue("sensorGroupId", NO_DEVICE_GROUP)
    }
  }, [form, matchingDeviceGroups, values.farmLocationId, values.sensorGroupId])

  async function onSubmit(input: AddCropFormValues) {
    const location = farmLocations.find((item) => item.id === input.farmLocationId)
    const deviceGroup = sensorGroups.find((group) => group.id === input.sensorGroupId)
    const assignedSensorIds =
      input.sensorGroupId === NO_DEVICE_GROUP ? [] : deviceGroup?.sensorIds ?? []
    const cropLocation =
      input.farmLocationId === CUSTOM_LOCATION
        ? { rack: input.customRack!, zone: input.customZone! }
        : { rack: location!.rack, zone: location!.zone }

    await createCrop.mutateAsync({
      crop: {
        plantProfileId:
          input.plantProfileId === CUSTOM_PLANT ? undefined : input.plantProfileId,
        plantedAt: new Date(`${input.plantedAt}T00:00:00`).toISOString(),
        growingMethod: input.growingMethod,
        farmLocationId:
          input.farmLocationId === CUSTOM_LOCATION ? undefined : input.farmLocationId,
        rack: cropLocation.rack,
        zone: cropLocation.zone,
        sensorGroupId:
          input.sensorGroupId === NO_DEVICE_GROUP ? undefined : input.sensorGroupId,
        assignedSensorIds,
        plantCount: input.plantCount,
        notes: input.notes?.trim() || undefined,
      },
      customPlantProfile:
        input.plantProfileId === CUSTOM_PLANT
          ? {
              name: input.customPlantName!,
              variety: input.customPlantVariety?.trim() || undefined,
              defaultMaturityDays: input.customMaturityDays!,
              harvestWindowBufferDays: 3,
              idealRanges: buildIdealRanges(input),
            }
          : undefined,
      farmLocation:
        input.farmLocationId === CUSTOM_LOCATION
          ? {
              rack: input.customRack!,
              zone: input.customZone!,
              label: `${input.customRack} / ${input.customZone}`,
              defaultGrowingMethod: input.growingMethod,
            }
          : undefined,
    })
  }

  const support = selectedPlant
    ? learningStats.find((stat) => stat.plantProfileId === selectedPlant.id)
    : undefined

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {createCrop.isError ? (
            <Alert variant="destructive">
              <TriangleAlert className="size-4" aria-hidden="true" />
              <AlertTitle>Could not add crop.</AlertTitle>
              <AlertDescription>
                Check the form and try creating the crop again.
              </AlertDescription>
            </Alert>
          ) : null}

          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Sprout className="size-4 text-primary" aria-hidden="true" />
                1. What are you growing?
              </CardTitle>
              <CardDescription>
                Pick a catalog plant or add one for this farm.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="plantProfileId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plant type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose a plant" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {plantProfiles.map((plant) => (
                          <SelectItem key={plant.id} value={plant.id}>
                            {plant.name}
                          </SelectItem>
                        ))}
                        <SelectSeparator />
                        <SelectItem value={CUSTOM_PLANT}>
                          Add custom plant
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {values.plantProfileId === CUSTOM_PLANT ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="customPlantName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plant name</FormLabel>
                        <FormControl>
                          <Input placeholder="Pak choi" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customPlantVariety"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Variety</FormLabel>
                        <FormControl>
                          <Input placeholder="Optional" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customMaturityDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Typical days to ready</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-end">
                    <Badge variant="outline">Starter estimate</Badge>
                  </div>
                </div>
              ) : selectedPlant ? (
                <div className="flex flex-wrap items-center gap-2 rounded-md bg-muted/40 px-3 py-2 text-sm">
                  <span>{selectedPlant.defaultMaturityDays} days to ready</span>
                  <ModelSupportBadge
                    maturity={support?.maturityLevel ?? selectedPlant.modelMaturity}
                    confidence={support?.confidence}
                  />
                </div>
              ) : null}

              {values.plantProfileId === CUSTOM_PLANT ? (
                <details className="rounded-md border border-border p-4">
                  <summary className="cursor-pointer text-sm font-medium">
                    Advanced growing ranges
                  </summary>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <RangeFields
                      form={form}
                      minName="temperatureMin"
                      maxName="temperatureMax"
                      label="Temperature C"
                    />
                    <RangeFields
                      form={form}
                      minName="phMin"
                      maxName="phMax"
                      label="pH"
                    />
                    <RangeFields
                      form={form}
                      minName="ecMin"
                      maxName="ecMax"
                      label="EC"
                    />
                    <RangeFields
                      form={form}
                      minName="lightMin"
                      maxName="lightMax"
                      label="Light hours"
                    />
                  </div>
                </details>
              ) : null}
            </CardContent>
          </Card>

          <FarmLocationSelector
            form={form}
            farmLocations={farmLocations}
            selectedLocation={selectedLocation}
          />

          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="size-4 text-primary" aria-hidden="true" />
                3. When did it start?
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="plantedAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start date</FormLabel>
                    <FormControl>
                      <Input type="date" max={today} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="plantCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>4. How many plants?</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <DeviceConnectionCard
            form={form}
            groups={matchingDeviceGroups}
            devices={sensorDevices}
            cropBatches={cropBatches}
            deviceLoading={deviceLoading}
          />

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Notes</CardTitle>
              <CardDescription>Optional context for the crop detail page.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="justify-end border-t">
              <Button type="submit" disabled={createCrop.isPending}>
                {createCrop.isPending ? "Creating crop" : "Add crop"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>

      <EstimatePreview
        values={values}
        selectedPlant={selectedPlant}
        selectedLocation={selectedLocation}
        selectedDeviceGroup={selectedDeviceGroup}
        support={support}
      />
    </div>
  )
}

export function FarmLocationSelector({
  form,
  farmLocations,
  selectedLocation,
}: {
  form: AddCropFormApi
  farmLocations: FarmLocation[]
  selectedLocation?: FarmLocation
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="size-4 text-primary" aria-hidden="true" />
          2. Where is it growing?
        </CardTitle>
        <CardDescription>
          Choose a known rack and zone, or add one without leaving the setup.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="farmLocationId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rack and zone</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value)
                    if (value !== CUSTOM_LOCATION) {
                      const nextLocation = farmLocations.find(
                        (location) => location.id === value,
                      )
                      if (nextLocation?.defaultGrowingMethod) {
                        form.setValue("growingMethod", nextLocation.defaultGrowingMethod)
                      }
                    }
                  }}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose location" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {farmLocations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.label}
                      </SelectItem>
                    ))}
                    <SelectSeparator />
                    <SelectItem value={CUSTOM_LOCATION}>
                      Add new rack/zone
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="growingMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Growing method</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="hydroponic">Hydroponic</SelectItem>
                    <SelectItem value="soil">Soil</SelectItem>
                    <SelectItem value="aeroponic">Aeroponic</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>

        {form.watch("farmLocationId") === CUSTOM_LOCATION ? (
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="customRack"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rack name</FormLabel>
                  <FormControl>
                    <Input placeholder="Rack E" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="customZone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zone name</FormLabel>
                  <FormControl>
                    <Input placeholder="Zone 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ) : selectedLocation ? (
          <p className="text-sm text-muted-foreground">
            New crop will be added to {selectedLocation.rack} / {selectedLocation.zone}.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

export function DeviceConnectionCard({
  form,
  groups,
  devices,
  cropBatches,
  deviceLoading,
}: {
  form: AddCropFormApi
  groups: SensorGroup[]
  devices: SensorDevice[]
  cropBatches: { id: string; plantName: string }[]
  deviceLoading: boolean
}) {
  const selectedGroupId = form.watch("sensorGroupId")
  const selectedGroup = groups.find((group) => group.id === selectedGroupId)
  const assignedCrop = selectedGroup?.assignedBatchId
    ? cropBatches.find((crop) => crop.id === selectedGroup.assignedBatchId)
    : undefined

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <PlugZap className="size-4 text-primary" aria-hidden="true" />
          5. Connect devices
        </CardTitle>
        <CardDescription>
          Optional, but connected devices make estimates better.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {deviceLoading ? (
          <Skeleton className="h-20" />
        ) : null}
        <FormField
          control={form.control}
          name="sensorGroupId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Device group</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={NO_DEVICE_GROUP}>
                    No devices connected yet
                  </SelectItem>
                  {groups.length ? <SelectSeparator /> : null}
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                {groups.length
                  ? "Use devices already placed in this rack and zone."
                  : "No matching device group is available for this location."}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedGroupId === NO_DEVICE_GROUP ? (
          <Alert>
            <TriangleAlert className="size-4" aria-hidden="true" />
            <AlertTitle>Starter estimate only.</AlertTitle>
            <AlertDescription>
              You can add this crop now and connect devices later.
            </AlertDescription>
          </Alert>
        ) : null}

        {assignedCrop ? (
          <Alert>
            <TriangleAlert className="size-4" aria-hidden="true" />
            <AlertTitle>This device group is already connected.</AlertTitle>
            <AlertDescription>
              It is currently connected to {assignedCrop.plantName}. Creating
              this crop will move the device group here.
            </AlertDescription>
          </Alert>
        ) : null}

        {selectedGroup ? (
          <div className="rounded-md bg-muted/40 p-3 text-sm">
            <p className="font-medium">{selectedGroup.rack} / {selectedGroup.zone}</p>
            <p className="mt-1 text-muted-foreground">
              {selectedGroup.sensorIds.length} devices:{" "}
              {devices
                .filter((device) => selectedGroup.sensorIds.includes(device.id))
                .map((device) => device.name)
                .join(", ")}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

export function EstimatePreview({
  values,
  selectedPlant,
  selectedLocation,
  selectedDeviceGroup,
  support,
}: {
  values: AddCropFormValues
  selectedPlant?: PlantProfile
  selectedLocation?: FarmLocation
  selectedDeviceGroup?: SensorGroup
  support?: { maturityLevel: ModelMaturity; confidence: number }
}) {
  const typicalDays =
    values.plantProfileId === CUSTOM_PLANT
      ? values.customMaturityDays
      : selectedPlant?.defaultMaturityDays
  const plantedAt = values.plantedAt ? new Date(`${values.plantedAt}T00:00:00`) : undefined
  const readyDate =
    plantedAt && typicalDays ? addDays(plantedAt, Number(typicalDays)) : undefined
  const buffer = selectedPlant?.harvestWindowBufferDays ?? 3
  const reliability =
    support?.confidence ??
    (values.plantProfileId === CUSTOM_PLANT
      ? 45
      : selectedDeviceGroup
        ? 58
        : 46)

  return (
    <aside className="xl:sticky xl:top-5 xl:self-start">
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Leaf className="size-4 text-primary" aria-hidden="true" />
            6. Review starter estimate
          </CardTitle>
          <CardDescription>
            This preview updates before the crop is added.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {typicalDays && readyDate ? (
            <>
              <PreviewRow label="Starter estimate" value={`${typicalDays} days`} />
              <PreviewRow label="Expected ready date" value={formatDate(readyDate)} />
              <PreviewRow
                label="Ready window"
                value={`${formatDate(addDays(readyDate, -buffer))} - ${formatDate(
                  addDays(readyDate, buffer),
                )}`}
              />
              <PreviewRow label="Starting reliability" value={`${reliability}%`} />
              <PreviewRow
                label="Estimate quality"
                value={
                  values.plantProfileId === CUSTOM_PLANT
                    ? "Starter estimate"
                    : supportLabel(support?.maturityLevel ?? selectedPlant?.modelMaturity)
                }
              />
              <PreviewRow
                label="Location"
                value={
                  values.farmLocationId === CUSTOM_LOCATION
                    ? `${values.customRack || "New rack"} / ${values.customZone || "New zone"}`
                    : selectedLocation?.label ?? "Choose location"
                }
              />
              <PreviewRow
                label="Device group"
                value={selectedDeviceGroup?.name ?? "No devices connected yet"}
              />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Choose a plant and start date to see the starter ready window.
            </p>
          )}
        </CardContent>
      </Card>
    </aside>
  )
}

function ModelSupportBadge({
  maturity,
  confidence,
}: {
  maturity: ModelMaturity
  confidence?: number
}) {
  return (
    <Badge variant="outline">
      {supportLabel(maturity)}
      {confidence ? ` · ${confidence}% reliable` : ""}
    </Badge>
  )
}

function RangeFields({
  form,
  minName,
  maxName,
  label,
}: {
  form: AddCropFormApi
  minName: keyof AddCropFormValues
  maxName: keyof AddCropFormValues
  label: string
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <FormField
        control={form.control}
        name={minName}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{label} min</FormLabel>
            <FormControl>
              <Input type="number" step="0.1" {...field} />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={maxName}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{label} max</FormLabel>
            <FormControl>
              <Input type="number" step="0.1" {...field} />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  )
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  )
}

function AddCropSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-48" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    </div>
  )
}

function getMatchingDeviceGroups({
  selectedLocation,
  values,
  sensorGroups,
}: {
  selectedLocation?: FarmLocation
  values: AddCropFormValues
  sensorGroups: SensorGroup[]
}) {
  if (selectedLocation) {
    return sensorGroups.filter(
      (group) =>
        group.farmLocationId === selectedLocation.id ||
        (group.rack === selectedLocation.rack && group.zone === selectedLocation.zone),
    )
  }

  if (values.farmLocationId === CUSTOM_LOCATION && values.customRack && values.customZone) {
    return sensorGroups.filter(
      (group) => group.rack === values.customRack && group.zone === values.customZone,
    )
  }

  return []
}

function buildIdealRanges(input: AddCropFormValues): PlantIdealRanges | undefined {
  const ranges: PlantIdealRanges = {}

  addRange(ranges, "temperatureC", input.temperatureMin, input.temperatureMax)
  addRange(ranges, "ph", input.phMin, input.phMax)
  addRange(ranges, "ec", input.ecMin, input.ecMax)
  addRange(ranges, "lightHours", input.lightMin, input.lightMax)

  return Object.keys(ranges).length ? ranges : undefined
}

function addRange(
  ranges: PlantIdealRanges,
  key: keyof PlantIdealRanges,
  min?: number,
  max?: number,
) {
  if (typeof min === "number" && typeof max === "number") {
    ranges[key] = { min, max }
  }
}

function supportLabel(maturity?: ModelMaturity) {
  if (maturity === "adaptive") {
    return "Highly reliable"
  }

  if (maturity === "learning") {
    return "Getting better"
  }

  return "Starter estimate"
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date)
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10)
}
