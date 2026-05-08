import type { MetricAvailability } from "./domain"
import type { CropBatch } from "./crop"

export type SensorType = "temperature" | "humidity" | "ph" | "ec" | "light" | "moisture"

export type SensorDeviceStatus = "online" | "offline" | "maintenance"

export type SensorDevice = {
  id: string
  name: string
  sensorTypes: SensorType[]
  farmLocationId?: string
  rack: string
  zone: string
  sensorGroupId?: string
  assignedBatchId?: string
  status: SensorDeviceStatus
  lastSeenAt?: string
}

export type SensorGroup = {
  id: string
  name: string
  farmLocationId?: string
  rack: string
  zone: string
  sensorIds: string[]
  assignedBatchId?: string
}

export type SensorReading = {
  id: string
  sensorId: string
  sensorGroupId?: string
  batchId?: string
  rack: string
  zone: string
  timestamp: string
  temperatureC?: number
  humidityPercent?: number
  ph?: number
  ec?: number
  lightHours?: number
  moisturePercent?: number
}

export type AssignSensorGroupInput = {
  batchId: string
  sensorGroupId: string
}

export type AssignSensorGroupResult = {
  cropBatch: CropBatch
  sensorGroup: SensorGroup
  previousAssignedBatchId?: string
  unassignedSensorGroupIds: string[]
}

export type SensorMetricAvailability = {
  sensorType: SensorType
  availability: MetricAvailability
}
