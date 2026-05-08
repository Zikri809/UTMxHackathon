import type { SensorDevice, SensorReading } from "@/types/sensor"

import { readDemoData, withMockDelay } from "./storage"

export async function getSensorDevices(): Promise<SensorDevice[]> {
  return withMockDelay(readDemoData().sensorDevices)
}

export async function getSensorReadings(batchId: string): Promise<SensorReading[]> {
  const state = readDemoData()
  const cropBatch = state.cropBatches.find((crop) => crop.id === batchId)
  const sensorGroupId = cropBatch?.sensorGroupId

  return withMockDelay(
    state.sensorReadings.filter(
      (reading) => reading.batchId === batchId || reading.sensorGroupId === sensorGroupId,
    ),
  )
}
