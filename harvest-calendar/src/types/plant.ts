import type { ModelMaturity } from "./domain"
import type { SensorType } from "./sensor"

export type PlantProfileSource = "catalog" | "custom"

export type MeasurementRange = {
  min: number
  max: number
}

export type PlantIdealRanges = {
  temperatureC?: MeasurementRange
  humidityPercent?: MeasurementRange
  ph?: MeasurementRange
  ec?: MeasurementRange
  lightHours?: MeasurementRange
  moisturePercent?: MeasurementRange
}

export type PlantProfile = {
  id: string
  name: string
  variety?: string
  source: PlantProfileSource
  defaultMaturityDays: number
  harvestWindowBufferDays: number
  idealRanges: PlantIdealRanges
  modelMaturity: ModelMaturity
  requiredSensorTypes?: SensorType[]
  createdAt?: string
  updatedAt?: string
}

export type CreateCustomPlantProfileInput = {
  name: string
  variety?: string
  defaultMaturityDays: number
  harvestWindowBufferDays?: number
  idealRanges?: PlantIdealRanges
  requiredSensorTypes?: SensorType[]
}

export type UpdatePlantProfileInput = {
  id: string
  name?: string
  variety?: string
  defaultMaturityDays?: number
  harvestWindowBufferDays?: number
  idealRanges?: PlantIdealRanges
  modelMaturity?: ModelMaturity
  requiredSensorTypes?: SensorType[]
}
