import type { CropBatch } from "@/types/crop"
import type { CropTimelineEvent, HarvestFeedback } from "@/types/feedback"
import type { FarmLocation } from "@/types/location"
import type { ModelLearningStats } from "@/types/learning"
import type { PlantProfile } from "@/types/plant"
import type { HarvestPrediction } from "@/types/prediction"
import type { SensorDevice, SensorGroup, SensorReading } from "@/types/sensor"

export type DemoDataState = {
  farmLocations: FarmLocation[]
  plantProfiles: PlantProfile[]
  cropBatches: CropBatch[]
  sensorDevices: SensorDevice[]
  sensorGroups: SensorGroup[]
  sensorReadings: SensorReading[]
  predictions: HarvestPrediction[]
  feedback: HarvestFeedback[]
  learningStats: ModelLearningStats[]
  timelineEvents: CropTimelineEvent[]
}

const STORAGE_KEY = "harvest-calendar-demo-data:v1"
const DELAY_MS = 120

let memoryState: DemoDataState | undefined

export async function withMockDelay<T>(value: T): Promise<T> {
  await new Promise<void>((resolve) => windowSafeSetTimeout(resolve, DELAY_MS))
  return clone(value)
}

export function readDemoData(): DemoDataState {
  if (!canUseLocalStorage()) {
    memoryState ??= createSeedDemoData()
    return clone(memoryState)
  }

  const storedValue = window.localStorage.getItem(STORAGE_KEY)

  if (!storedValue) {
    const seedData = createSeedDemoData()
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData))
    return clone(seedData)
  }

  try {
    return clone(JSON.parse(storedValue) as DemoDataState)
  } catch {
    const seedData = createSeedDemoData()
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData))
    return clone(seedData)
  }
}

export function writeDemoData(state: DemoDataState) {
  const nextState = clone(state)

  if (!canUseLocalStorage()) {
    memoryState = nextState
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState))
}

export function updateDemoData(mutator: (state: DemoDataState) => void): DemoDataState {
  const state = readDemoData()
  mutator(state)
  writeDemoData(state)
  return clone(state)
}

export async function resetDemoData(): Promise<void> {
  const seedData = createSeedDemoData()

  if (!canUseLocalStorage()) {
    memoryState = seedData
  } else {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData))
  }

  await withMockDelay(undefined)
}

export function createId(prefix: string) {
  const timestamp = Date.now().toString(36)
  const randomValue =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)

  return `${prefix}_${timestamp}_${randomValue}`
}

export function nowIso() {
  return new Date().toISOString()
}

function createSeedDemoData(): DemoDataState {
  const today = startOfDay(new Date())
  const now = today.toISOString()

  const farmLocations: FarmLocation[] = [
    createLocation("loc-rack-a-zone-1", "Rack A", "Zone 1", "Rack A / Zone 1"),
    createLocation("loc-rack-b-zone-2", "Rack B", "Zone 2", "Rack B / Zone 2"),
    createLocation("loc-rack-c-zone-1", "Rack C", "Zone 1", "Rack C / Zone 1"),
    createLocation("loc-rack-d-zone-3", "Rack D", "Zone 3", "Rack D / Zone 3"),
  ]

  const plantProfiles: PlantProfile[] = [
    {
      id: "plant-butterhead-lettuce",
      name: "Butterhead Lettuce",
      source: "catalog",
      defaultMaturityDays: 45,
      harvestWindowBufferDays: 3,
      idealRanges: {
        temperatureC: { min: 17, max: 23 },
        humidityPercent: { min: 55, max: 75 },
        ph: { min: 5.8, max: 6.5 },
        ec: { min: 1.2, max: 1.8 },
        lightHours: { min: 12, max: 16 },
      },
      modelMaturity: "learning",
      requiredSensorTypes: ["temperature", "humidity", "ph", "ec", "light"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "plant-thai-basil",
      name: "Thai Basil",
      source: "catalog",
      defaultMaturityDays: 35,
      harvestWindowBufferDays: 3,
      idealRanges: {
        temperatureC: { min: 21, max: 29 },
        humidityPercent: { min: 50, max: 70 },
        ph: { min: 5.8, max: 6.8 },
        lightHours: { min: 14, max: 18 },
      },
      modelMaturity: "learning",
      requiredSensorTypes: ["temperature", "humidity", "ph", "light"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "plant-spinach",
      name: "Spinach",
      source: "catalog",
      defaultMaturityDays: 40,
      harvestWindowBufferDays: 2,
      idealRanges: {
        temperatureC: { min: 15, max: 22 },
        humidityPercent: { min: 55, max: 75 },
        ph: { min: 6, max: 7 },
        ec: { min: 1.4, max: 2 },
        lightHours: { min: 10, max: 14 },
      },
      modelMaturity: "adaptive",
      requiredSensorTypes: ["temperature", "humidity", "ph", "ec", "light"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "plant-kale",
      name: "Kale",
      source: "catalog",
      defaultMaturityDays: 55,
      harvestWindowBufferDays: 4,
      idealRanges: {
        temperatureC: { min: 16, max: 24 },
        humidityPercent: { min: 50, max: 70 },
        ph: { min: 6, max: 7.2 },
        moisturePercent: { min: 45, max: 65 },
      },
      modelMaturity: "baseline",
      requiredSensorTypes: ["temperature", "humidity", "moisture"],
      createdAt: now,
      updatedAt: now,
    },
  ]

  const cropBatches: CropBatch[] = [
    createCrop({
      id: "batch-butterhead-lettuce",
      plantProfileId: "plant-butterhead-lettuce",
      plantName: "Butterhead Lettuce",
      plantedAt: addDays(today, -31),
      location: farmLocations[0],
      sensorGroupId: "group-rack-a-zone-1",
      sensorIds: ["sensor-a-climate", "sensor-a-water"],
      plantCount: 48,
      status: "growing",
      genericHarvestDate: addDays(today, 14),
      predictedHarvestDate: addDays(today, 12),
      confidence: 76,
      predictionShiftDays: -2,
    }),
    createCrop({
      id: "batch-thai-basil",
      plantProfileId: "plant-thai-basil",
      plantName: "Thai Basil",
      plantedAt: addDays(today, -22),
      location: farmLocations[1],
      sensorGroupId: "group-rack-b-zone-2",
      sensorIds: ["sensor-b-climate", "sensor-b-light"],
      plantCount: 36,
      status: "growing",
      genericHarvestDate: addDays(today, 13),
      predictedHarvestDate: addDays(today, 15),
      confidence: 61,
      predictionShiftDays: 2,
      notes: "Light exposure has been lower than target.",
    }),
    createCrop({
      id: "batch-spinach-harvest-check",
      plantProfileId: "plant-spinach",
      plantName: "Spinach",
      plantedAt: addDays(today, -43),
      location: farmLocations[2],
      sensorGroupId: "group-rack-c-zone-1",
      sensorIds: ["sensor-c-climate", "sensor-c-water"],
      plantCount: 52,
      status: "feedback_needed",
      genericHarvestDate: addDays(today, -3),
      predictedHarvestDate: addDays(today, -1),
      confidence: 88,
      predictionShiftDays: 2,
    }),
    createCrop({
      id: "batch-kale-starter",
      plantProfileId: "plant-kale",
      plantName: "Kale",
      plantedAt: addDays(today, -8),
      location: farmLocations[3],
      sensorIds: [],
      plantCount: 24,
      status: "growing",
      genericHarvestDate: addDays(today, 47),
      predictedHarvestDate: addDays(today, 47),
      confidence: 46,
      predictionShiftDays: 0,
      notes: "Starter estimate until devices are connected.",
    }),
  ]

  const sensorGroups: SensorGroup[] = [
    createGroup("group-rack-a-zone-1", "Rack A / Zone 1 Devices", farmLocations[0], [
      "sensor-a-climate",
      "sensor-a-water",
    ], "batch-butterhead-lettuce"),
    createGroup("group-rack-b-zone-2", "Rack B / Zone 2 Devices", farmLocations[1], [
      "sensor-b-climate",
      "sensor-b-light",
    ], "batch-thai-basil"),
    createGroup("group-rack-c-zone-1", "Rack C / Zone 1 Devices", farmLocations[2], [
      "sensor-c-climate",
      "sensor-c-water",
    ], "batch-spinach-harvest-check"),
    createGroup("group-rack-d-zone-3", "Rack D / Zone 3 Devices", farmLocations[3], [
      "sensor-d-climate",
      "sensor-d-water",
    ]),
  ]

  const sensorDevices: SensorDevice[] = [
    createDevice("sensor-a-climate", "Rack A Climate", ["temperature", "humidity", "light"], farmLocations[0], "group-rack-a-zone-1", "batch-butterhead-lettuce"),
    createDevice("sensor-a-water", "Rack A Water", ["ph", "ec"], farmLocations[0], "group-rack-a-zone-1", "batch-butterhead-lettuce"),
    createDevice("sensor-b-climate", "Rack B Climate", ["temperature", "humidity"], farmLocations[1], "group-rack-b-zone-2", "batch-thai-basil"),
    createDevice("sensor-b-light", "Rack B Light", ["light"], farmLocations[1], "group-rack-b-zone-2", "batch-thai-basil"),
    createDevice("sensor-c-climate", "Rack C Climate", ["temperature", "humidity", "light"], farmLocations[2], "group-rack-c-zone-1", "batch-spinach-harvest-check"),
    createDevice("sensor-c-water", "Rack C Water", ["ph", "ec"], farmLocations[2], "group-rack-c-zone-1", "batch-spinach-harvest-check"),
    createDevice("sensor-d-climate", "Rack D Climate", ["temperature", "humidity"], farmLocations[3], "group-rack-d-zone-3"),
    createDevice("sensor-d-water", "Rack D Moisture", ["moisture", "ph"], farmLocations[3], "group-rack-d-zone-3"),
  ]

  const sensorReadings: SensorReading[] = [
    createReading("reading-butterhead", "sensor-a-climate", "group-rack-a-zone-1", "batch-butterhead-lettuce", farmLocations[0], today, {
      temperatureC: 20.4,
      humidityPercent: 64,
      ph: 6.2,
      ec: 1.5,
      lightHours: 14.5,
    }),
    createReading("reading-thai-basil", "sensor-b-light", "group-rack-b-zone-2", "batch-thai-basil", farmLocations[1], today, {
      temperatureC: 24.6,
      humidityPercent: 58,
      lightHours: 9.2,
    }),
    createReading("reading-spinach", "sensor-c-climate", "group-rack-c-zone-1", "batch-spinach-harvest-check", farmLocations[2], today, {
      temperatureC: 18.1,
      humidityPercent: 67,
      ph: 6.4,
      ec: 1.7,
      lightHours: 12.3,
    }),
  ]

  const predictions: HarvestPrediction[] = [
    createPrediction(cropBatches[0], "sensor_adjusted", "learning", "Steady climate and nutrient readings moved the ready date earlier.", [
      { label: "Temperature", status: "positive", impact: "Inside the ideal range" },
      { label: "Water chemistry", status: "positive", impact: "pH and EC are stable" },
    ]),
    createPrediction(cropBatches[1], "sensor_adjusted", "learning", "Low light has slowed the estimate slightly.", [
      { label: "Light", status: "negative", impact: "Below target for Thai Basil" },
      { label: "Temperature", status: "positive", impact: "Warm enough for steady growth" },
    ]),
    createPrediction(cropBatches[2], "learned", "adaptive", "Past spinach checks make this estimate reliable. A harvest result is due.", [
      { label: "Past harvests", status: "positive", impact: "Similar batches were ready around this date" },
      { label: "Recent readings", status: "positive", impact: "Conditions stayed consistent" },
    ]),
    createPrediction(cropBatches[3], "generic_baseline", "baseline", "This is a starter estimate until device readings are available.", [
      { label: "Device data", status: "neutral", impact: "No device group connected yet" },
    ]),
  ]

  const feedback: HarvestFeedback[] = []

  const learningStats: ModelLearningStats[] = [
    {
      plantProfileId: "plant-butterhead-lettuce",
      plantName: "Butterhead Lettuce",
      source: "catalog",
      completedCycles: 6,
      averageErrorBeforeDays: 4.2,
      averageErrorAfterDays: 2.1,
      confidence: 76,
      maturityLevel: "learning",
      lastUpdatedAt: now,
    },
    {
      plantProfileId: "plant-thai-basil",
      plantName: "Thai Basil",
      source: "catalog",
      completedCycles: 4,
      averageErrorBeforeDays: 3.5,
      averageErrorAfterDays: 2.8,
      confidence: 61,
      maturityLevel: "learning",
      lastUpdatedAt: now,
    },
    {
      plantProfileId: "plant-spinach",
      plantName: "Spinach",
      source: "catalog",
      completedCycles: 9,
      averageErrorBeforeDays: 3.8,
      averageErrorAfterDays: 1.2,
      confidence: 88,
      maturityLevel: "adaptive",
      lastUpdatedAt: now,
    },
    {
      plantProfileId: "plant-kale",
      plantName: "Kale",
      source: "catalog",
      completedCycles: 0,
      averageErrorBeforeDays: 0,
      averageErrorAfterDays: 0,
      confidence: 46,
      maturityLevel: "baseline",
      lastUpdatedAt: now,
    },
  ]

  const timelineEvents = cropBatches.map((cropBatch) => ({
    id: `event-created-${cropBatch.id}`,
    batchId: cropBatch.id,
    type: "created" as const,
    title: "Crop batch created",
    createdAt: cropBatch.createdAt ?? now,
  }))

  return {
    farmLocations,
    plantProfiles,
    cropBatches,
    sensorDevices,
    sensorGroups,
    sensorReadings,
    predictions,
    feedback,
    learningStats,
    timelineEvents,
  }
}

function createLocation(id: string, rack: string, zone: string, label: string): FarmLocation {
  const timestamp = new Date().toISOString()

  return {
    id,
    rack,
    zone,
    label,
    defaultGrowingMethod: "hydroponic",
    status: "active",
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

function createCrop(input: {
  id: string
  plantProfileId: string
  plantName: string
  plantedAt: Date
  location: FarmLocation
  sensorGroupId?: string
  sensorIds: string[]
  plantCount: number
  status: CropBatch["status"]
  genericHarvestDate: Date
  predictedHarvestDate: Date
  confidence: number
  predictionShiftDays: number
  notes?: string
}): CropBatch {
  const timestamp = new Date().toISOString()
  const windowStart = addDays(input.predictedHarvestDate, -2)
  const windowEnd = addDays(input.predictedHarvestDate, 2)

  return {
    id: input.id,
    plantProfileId: input.plantProfileId,
    plantName: input.plantName,
    plantedAt: input.plantedAt.toISOString(),
    growingMethod: "hydroponic",
    farmLocationId: input.location.id,
    rack: input.location.rack,
    zone: input.location.zone,
    sensorGroupId: input.sensorGroupId,
    assignedSensorIds: input.sensorIds,
    plantCount: input.plantCount,
    status: input.status,
    genericHarvestDate: input.genericHarvestDate.toISOString(),
    predictedHarvestDate: input.predictedHarvestDate.toISOString(),
    predictedHarvestWindow: {
      start: windowStart.toISOString(),
      end: windowEnd.toISOString(),
    },
    confidence: input.confidence,
    predictionShiftDays: input.predictionShiftDays,
    notes: input.notes,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

function createGroup(
  id: string,
  name: string,
  location: FarmLocation,
  sensorIds: string[],
  assignedBatchId?: string,
): SensorGroup {
  return {
    id,
    name,
    farmLocationId: location.id,
    rack: location.rack,
    zone: location.zone,
    sensorIds,
    assignedBatchId,
  }
}

function createDevice(
  id: string,
  name: string,
  sensorTypes: SensorDevice["sensorTypes"],
  location: FarmLocation,
  sensorGroupId: string,
  assignedBatchId?: string,
): SensorDevice {
  return {
    id,
    name,
    sensorTypes,
    farmLocationId: location.id,
    rack: location.rack,
    zone: location.zone,
    sensorGroupId,
    assignedBatchId,
    status: "online",
    lastSeenAt: new Date().toISOString(),
  }
}

function createReading(
  id: string,
  sensorId: string,
  sensorGroupId: string,
  batchId: string,
  location: FarmLocation,
  timestamp: Date,
  metrics: Pick<
    SensorReading,
    "temperatureC" | "humidityPercent" | "ph" | "ec" | "lightHours" | "moisturePercent"
  >,
): SensorReading {
  return {
    id,
    sensorId,
    sensorGroupId,
    batchId,
    rack: location.rack,
    zone: location.zone,
    timestamp: timestamp.toISOString(),
    ...metrics,
  }
}

function createPrediction(
  cropBatch: CropBatch,
  predictionMode: HarvestPrediction["predictionMode"],
  modelMaturity: HarvestPrediction["modelMaturity"],
  explanation: string,
  contributingFactors: HarvestPrediction["contributingFactors"],
): HarvestPrediction {
  return {
    batchId: cropBatch.id,
    genericHarvestDate: cropBatch.genericHarvestDate,
    predictedHarvestDate: cropBatch.predictedHarvestDate,
    windowStart: cropBatch.predictedHarvestWindow.start,
    windowEnd: cropBatch.predictedHarvestWindow.end,
    confidence: cropBatch.confidence,
    shiftDays: cropBatch.predictionShiftDays,
    predictionMode,
    modelMaturity,
    explanation,
    contributingFactors,
  }
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

function canUseLocalStorage() {
  return typeof window !== "undefined" && "localStorage" in window
}

function windowSafeSetTimeout(callback: () => void, delay: number) {
  if (typeof window !== "undefined") {
    return window.setTimeout(callback, delay)
  }

  return setTimeout(callback, delay)
}

function clone<T>(value: T): T {
  if (value === undefined) {
    return value
  }

  return JSON.parse(JSON.stringify(value)) as T
}
