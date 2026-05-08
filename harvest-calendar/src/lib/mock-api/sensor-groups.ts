import type {
  AssignSensorGroupInput,
  AssignSensorGroupResult,
  CreateSensorGroupInput,
  CreateSensorGroupResult,
  SensorGroup,
  SensorReading,
  SensorType,
} from "@/types/sensor"

import { createId, nowIso, readDemoData, updateDemoData, withMockDelay } from "./storage"

export async function getSensorGroups(): Promise<SensorGroup[]> {
  return withMockDelay(readDemoData().sensorGroups)
}

export async function createSensorGroup(
  input: CreateSensorGroupInput,
): Promise<CreateSensorGroupResult> {
  let result: CreateSensorGroupResult | undefined

  updateDemoData((state) => {
    const timestamp = nowIso()
    const location = input.farmLocationId
      ? state.farmLocations.find((item) => item.id === input.farmLocationId)
      : undefined
    const rack = location?.rack ?? input.rack
    const zone = location?.zone ?? input.zone
    const groupId = createId("group")
    const deviceId = createId("sensor")
    const sensorTypes = Array.from(new Set(input.sensorTypes))

    if (!sensorTypes.length) {
      throw new Error("At least one sensor metric is required.")
    }

    const sensorGroup: SensorGroup = {
      id: groupId,
      name: input.name,
      farmLocationId: location?.id ?? input.farmLocationId,
      rack,
      zone,
      sensorIds: [deviceId],
    }

    const sensorDevice = {
      id: deviceId,
      name: input.deviceName?.trim() || `${input.name} Sensor`,
      sensorTypes,
      farmLocationId: location?.id ?? input.farmLocationId,
      rack,
      zone,
      sensorGroupId: groupId,
      status: input.status ?? "online",
      lastSeenAt: timestamp,
    }

    state.sensorGroups.unshift(sensorGroup)
    state.sensorDevices.unshift(sensorDevice)
    state.sensorReadings.unshift(
      ...createStarterReadings({
        sensorId: deviceId,
        sensorGroupId: groupId,
        rack,
        zone,
        sensorTypes,
      }),
    )

    result = {
      sensorGroup,
      sensorDevices: [sensorDevice],
    }
  })

  return withMockDelay(result!)
}

export async function assignSensorGroupToBatch(
  input: AssignSensorGroupInput,
): Promise<AssignSensorGroupResult> {
  let result: AssignSensorGroupResult | undefined

  updateDemoData((state) => {
    const cropBatch = state.cropBatches.find((crop) => crop.id === input.batchId)
    const sensorGroup = state.sensorGroups.find((group) => group.id === input.sensorGroupId)

    if (!cropBatch) {
      throw new Error(`Crop batch ${input.batchId} was not found.`)
    }

    if (!sensorGroup) {
      throw new Error(`Sensor group ${input.sensorGroupId} was not found.`)
    }

    const previousAssignedBatchId = sensorGroup.assignedBatchId
    const unassignedSensorGroupIds = state.sensorGroups
      .filter((group) => group.assignedBatchId === input.batchId && group.id !== input.sensorGroupId)
      .map((group) => group.id)

    state.sensorGroups = state.sensorGroups.map((group) => {
      if (group.id === input.sensorGroupId) {
        return { ...group, assignedBatchId: input.batchId }
      }

      if (group.assignedBatchId === input.batchId) {
        return { ...group, assignedBatchId: undefined }
      }

      return group
    })

    state.cropBatches = state.cropBatches.map((crop) => {
      if (crop.id === previousAssignedBatchId && crop.id !== input.batchId) {
        return { ...crop, sensorGroupId: undefined, assignedSensorIds: [], updatedAt: nowIso() }
      }

      if (crop.id === input.batchId) {
        return {
          ...crop,
          farmLocationId: sensorGroup.farmLocationId ?? crop.farmLocationId,
          rack: sensorGroup.rack,
          zone: sensorGroup.zone,
          sensorGroupId: sensorGroup.id,
          assignedSensorIds: sensorGroup.sensorIds,
          updatedAt: nowIso(),
        }
      }

      return crop
    })

    state.sensorDevices = state.sensorDevices.map((device) => {
      if (device.sensorGroupId === input.sensorGroupId || sensorGroup.sensorIds.includes(device.id)) {
        return {
          ...device,
          assignedBatchId: input.batchId,
          farmLocationId: sensorGroup.farmLocationId ?? device.farmLocationId,
          rack: sensorGroup.rack,
          zone: sensorGroup.zone,
        }
      }

      if (previousAssignedBatchId && device.assignedBatchId === previousAssignedBatchId) {
        return { ...device, assignedBatchId: undefined }
      }

      return device
    })

    const updatedCrop = state.cropBatches.find((crop) => crop.id === input.batchId)!
    const updatedGroup = state.sensorGroups.find((group) => group.id === input.sensorGroupId)!

    state.timelineEvents.push({
      id: `event-devices-${input.batchId}-${Date.now()}`,
      batchId: input.batchId,
      type: "devices_connected",
      title: "Devices connected",
      description: `${updatedGroup.name} connected to ${updatedCrop.plantName}.`,
      createdAt: nowIso(),
    })

    result = {
      cropBatch: updatedCrop,
      sensorGroup: updatedGroup,
      previousAssignedBatchId,
      unassignedSensorGroupIds,
    }
  })

  return withMockDelay(result!)
}

function createStarterReadings({
  sensorId,
  sensorGroupId,
  rack,
  zone,
  sensorTypes,
}: {
  sensorId: string
  sensorGroupId: string
  rack: string
  zone: string
  sensorTypes: SensorType[]
}): SensorReading[] {
  const today = startOfDay(new Date())

  return Array.from({ length: 5 }, (_, index) => {
    const timestamp = addDays(today, -index)
    const reading: SensorReading = {
      id: createId("reading"),
      sensorId,
      sensorGroupId,
      rack,
      zone,
      timestamp: timestamp.toISOString(),
    }

    for (const sensorType of sensorTypes) {
      Object.assign(reading, getStarterMetric(sensorType, index))
    }

    return reading
  })
}

function getStarterMetric(sensorType: SensorType, index: number): Partial<SensorReading> {
  const drift = index * 0.2

  if (sensorType === "temperature") {
    return { temperatureC: Number((22.4 - drift).toFixed(1)) }
  }

  if (sensorType === "humidity") {
    return { humidityPercent: 61 + index }
  }

  if (sensorType === "ph") {
    return { ph: Number((6.3 + index * 0.03).toFixed(1)) }
  }

  if (sensorType === "ec") {
    return { ec: Number((1.6 - index * 0.04).toFixed(1)) }
  }

  if (sensorType === "light") {
    return { lightHours: Number((13.6 - index * 0.25).toFixed(1)) }
  }

  return { moisturePercent: 52 - index }
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate
}

function startOfDay(date: Date) {
  const nextDate = new Date(date)
  nextDate.setHours(0, 0, 0, 0)
  return nextDate
}
