import type { AssignSensorGroupInput, AssignSensorGroupResult, SensorGroup } from "@/types/sensor"

import { nowIso, readDemoData, updateDemoData, withMockDelay } from "./storage"

export async function getSensorGroups(): Promise<SensorGroup[]> {
  return withMockDelay(readDemoData().sensorGroups)
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
