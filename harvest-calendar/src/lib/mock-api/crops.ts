import type {
  CreateCropBatchInput,
  CreateCropBatchResult,
  CreateCropBatchWithDependenciesInput,
  CropBatch,
  CropBatchSummary,
  UpdateCropBatchInput,
  UpdateCropStatusInput,
} from "@/types/crop"

import {
  getCropHealthState,
  getFeedbackState,
  getSensorAssignmentState,
} from "@/lib/domain/selectors"
import { calculatePrediction } from "@/lib/mock-ml/calculate-prediction"
import type { FarmLocation } from "@/types/location"
import type { PlantProfile } from "@/types/plant"

import { toPredictionSummary } from "./predictions"
import { createId, nowIso, readDemoData, updateDemoData, withMockDelay } from "./storage"

export async function getCropBatches(): Promise<CropBatch[]> {
  return withMockDelay(readDemoData().cropBatches)
}

export async function getCropBatchSummaries(): Promise<CropBatchSummary[]> {
  const state = readDemoData()

  const summaries = state.cropBatches.map((cropBatch) => {
    const prediction =
      state.predictions.find((item) => item.batchId === cropBatch.id) ??
      calculatePrediction(
        cropBatch,
        state.plantProfiles.find((profile) => profile.id === cropBatch.plantProfileId)!,
        state.sensorReadings.filter((reading) => reading.batchId === cropBatch.id),
      )
    const sensorAssignmentState = getSensorAssignmentState(
      cropBatch,
      state.sensorGroups,
      state.sensorDevices,
    )
    const feedbackHistory = state.feedback.filter((feedback) => feedback.batchId === cropBatch.id)

    return {
      ...cropBatch,
      predictionSummary: toPredictionSummary(prediction),
      sensorAssignmentState,
      cropHealthState: getCropHealthState(
        cropBatch,
        prediction,
        state.sensorReadings.filter((reading) => reading.batchId === cropBatch.id),
        sensorAssignmentState,
      ),
      feedbackState: getFeedbackState(cropBatch, feedbackHistory),
    }
  })

  return withMockDelay(summaries)
}

export async function getCropBatch(batchId: string): Promise<CropBatch> {
  const cropBatch = readDemoData().cropBatches.find((crop) => crop.id === batchId)

  if (!cropBatch) {
    throw new Error(`Crop batch ${batchId} was not found.`)
  }

  return withMockDelay(cropBatch)
}

export async function createCropBatch(input: CreateCropBatchInput): Promise<CropBatch> {
  let cropBatch: CropBatch | undefined

  updateDemoData((state) => {
    cropBatch = createCropFromInput(input, state)
    const plantProfile = state.plantProfiles.find(
      (profile) => profile.id === cropBatch!.plantProfileId,
    )!
    const readings = state.sensorReadings.filter((reading) => reading.batchId === cropBatch!.id)

    state.cropBatches.push(cropBatch)
    state.predictions.push(calculatePrediction(cropBatch, plantProfile, readings))

    if (input.sensorGroupId) {
      state.sensorGroups = state.sensorGroups.map((group) =>
        group.id === input.sensorGroupId ? { ...group, assignedBatchId: cropBatch!.id } : group,
      )
      state.sensorDevices = state.sensorDevices.map((device) =>
        device.sensorGroupId === input.sensorGroupId
          ? { ...device, assignedBatchId: cropBatch!.id }
          : device,
      )
    }

    state.timelineEvents.push({
      id: `event-created-${cropBatch.id}`,
      batchId: cropBatch.id,
      type: "created",
      title: "Crop batch created",
      createdAt: cropBatch.createdAt ?? nowIso(),
    })
  })

  return withMockDelay(cropBatch!)
}

export async function createCropBatchWithDependencies(
  input: CreateCropBatchWithDependenciesInput,
): Promise<CreateCropBatchResult> {
  let result: CreateCropBatchResult | undefined

  updateDemoData((state) => {
    const plantProfile = findExistingPlantProfile(input, state) ?? createCustomPlantProfile(input, state)

    if (!plantProfile) {
      throw new Error("A plant profile or custom plant profile input is required.")
    }

    const farmLocation = findExistingFarmLocation(input, state) ?? createFarmLocation(input, state)
    const cropBatch = createCropFromInput(
      {
        ...input.crop,
        plantProfileId: plantProfile.id,
        farmLocationId: farmLocation?.id,
        rack: input.crop.rack ?? farmLocation?.rack ?? "Unassigned rack",
        zone: input.crop.zone ?? farmLocation?.zone ?? "Unassigned zone",
      },
      state,
    )
    const readings = state.sensorReadings.filter((reading) => reading.batchId === cropBatch.id)

    state.cropBatches.push(cropBatch)
    state.predictions.push(calculatePrediction(cropBatch, plantProfile, readings))

    if (cropBatch.sensorGroupId) {
      state.sensorGroups = state.sensorGroups.map((group) =>
        group.id === cropBatch.sensorGroupId
          ? { ...group, assignedBatchId: cropBatch.id }
          : group.assignedBatchId === cropBatch.id
            ? { ...group, assignedBatchId: undefined }
            : group,
      )
      state.sensorDevices = state.sensorDevices.map((device) =>
        device.sensorGroupId === cropBatch.sensorGroupId
          ? { ...device, assignedBatchId: cropBatch.id }
          : device,
      )
    }

    state.timelineEvents.push({
      id: `event-created-${cropBatch.id}`,
      batchId: cropBatch.id,
      type: "created",
      title: "Crop batch created",
      createdAt: cropBatch.createdAt ?? nowIso(),
    })

    result = {
      cropBatch,
      plantProfile,
      farmLocation,
    }
  })

  return withMockDelay(result!)
}

export async function updateCropBatch(input: UpdateCropBatchInput): Promise<CropBatch> {
  let updatedCrop: CropBatch | undefined

  updateDemoData((state) => {
    const cropBatch = state.cropBatches.find((crop) => crop.id === input.id)

    if (!cropBatch) {
      throw new Error(`Crop batch ${input.id} was not found.`)
    }

    const plantProfileId = input.plantProfileId ?? cropBatch.plantProfileId
    const plantProfile = state.plantProfiles.find((profile) => profile.id === plantProfileId)

    if (!plantProfile) {
      throw new Error(`Plant profile ${plantProfileId} was not found.`)
    }

    updatedCrop = {
      ...cropBatch,
      ...input,
      plantProfileId,
      plantName: plantProfile.name,
      updatedAt: nowIso(),
    }

    state.cropBatches = state.cropBatches.map((crop) =>
      crop.id === input.id ? updatedCrop! : crop,
    )

    state.predictions = state.predictions.map((prediction) =>
      prediction.batchId === input.id
        ? calculatePrediction(
            updatedCrop!,
            plantProfile,
            state.sensorReadings.filter((reading) => reading.batchId === input.id),
          )
        : prediction,
    )
  })

  return withMockDelay(updatedCrop!)
}

export async function updateCropStatus(input: UpdateCropStatusInput): Promise<CropBatch> {
  let updatedCrop: CropBatch | undefined

  updateDemoData((state) => {
    const cropBatch = state.cropBatches.find((crop) => crop.id === input.id)

    if (!cropBatch) {
      throw new Error(`Crop batch ${input.id} was not found.`)
    }

    updatedCrop = {
      ...cropBatch,
      status: input.status,
      updatedAt: nowIso(),
    }

    state.cropBatches = state.cropBatches.map((crop) =>
      crop.id === input.id ? updatedCrop! : crop,
    )
    state.timelineEvents.push({
      id: `event-status-${input.id}-${Date.now()}`,
      batchId: input.id,
      type: "status_changed",
      title: "Crop status changed",
      description: `Status changed to ${input.status}.`,
      createdAt: nowIso(),
    })
  })

  return withMockDelay(updatedCrop!)
}

function createCropFromInput(input: CreateCropBatchInput, state: ReturnType<typeof readDemoData>) {
  const plantProfile = state.plantProfiles.find((profile) => profile.id === input.plantProfileId)

  if (!plantProfile) {
    throw new Error(`Plant profile ${input.plantProfileId} was not found.`)
  }

  const farmLocation = input.farmLocationId
    ? state.farmLocations.find((location) => location.id === input.farmLocationId)
    : undefined
  const plantedAt = new Date(input.plantedAt)
  const genericHarvestDate = addDays(plantedAt, plantProfile.defaultMaturityDays)
  const timestamp = nowIso()
  const sensorGroup = input.sensorGroupId
    ? state.sensorGroups.find((group) => group.id === input.sensorGroupId)
    : undefined
  const assignedSensorIds = input.assignedSensorIds ?? sensorGroup?.sensorIds ?? []

  return {
    id: createId("batch"),
    plantProfileId: plantProfile.id,
    plantName: plantProfile.name,
    variety: plantProfile.variety,
    plantedAt: plantedAt.toISOString(),
    growingMethod: input.growingMethod,
    farmLocationId: farmLocation?.id ?? input.farmLocationId,
    rack: farmLocation?.rack ?? input.rack,
    zone: farmLocation?.zone ?? input.zone,
    sensorGroupId: input.sensorGroupId,
    assignedSensorIds,
    plantCount: input.plantCount,
    status: "growing",
    genericHarvestDate,
    predictedHarvestDate: genericHarvestDate,
    predictedHarvestWindow: {
      start: addDays(genericHarvestDate, -plantProfile.harvestWindowBufferDays),
      end: addDays(genericHarvestDate, plantProfile.harvestWindowBufferDays),
    },
    confidence: assignedSensorIds.length ? 58 : 46,
    predictionShiftDays: 0,
    notes: input.notes,
    createdAt: timestamp,
    updatedAt: timestamp,
  } satisfies CropBatch
}

function findExistingPlantProfile(
  input: CreateCropBatchWithDependenciesInput,
  state: ReturnType<typeof readDemoData>,
) {
  if (input.crop.plantProfileId) {
    return state.plantProfiles.find((profile) => profile.id === input.crop.plantProfileId)
  }

  if (!input.customPlantProfile) {
    return undefined
  }

  return state.plantProfiles.find(
    (profile) =>
      profile.source === "custom" &&
      normalize(profile.name) === normalize(input.customPlantProfile!.name) &&
      normalize(profile.variety ?? "") === normalize(input.customPlantProfile!.variety ?? ""),
  )
}

function createCustomPlantProfile(
  input: CreateCropBatchWithDependenciesInput,
  state: ReturnType<typeof readDemoData>,
): PlantProfile | undefined {
  if (!input.customPlantProfile) {
    return undefined
  }

  const timestamp = nowIso()
  const plantProfile: PlantProfile = {
    id: createId("plant"),
    name: input.customPlantProfile.name,
    variety: input.customPlantProfile.variety,
    source: "custom",
    defaultMaturityDays: input.customPlantProfile.defaultMaturityDays,
    harvestWindowBufferDays: input.customPlantProfile.harvestWindowBufferDays ?? 3,
    idealRanges: input.customPlantProfile.idealRanges ?? {},
    modelMaturity: "baseline",
    requiredSensorTypes: input.customPlantProfile.requiredSensorTypes,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  state.plantProfiles.push(plantProfile)
  state.learningStats.push({
    plantProfileId: plantProfile.id,
    plantName: plantProfile.name,
    source: "custom",
    completedCycles: 0,
    averageErrorBeforeDays: 0,
    averageErrorAfterDays: 0,
    confidence: 45,
    maturityLevel: "baseline",
    lastUpdatedAt: timestamp,
  })

  return plantProfile
}

function findExistingFarmLocation(
  input: CreateCropBatchWithDependenciesInput,
  state: ReturnType<typeof readDemoData>,
) {
  if (input.crop.farmLocationId) {
    return state.farmLocations.find((location) => location.id === input.crop.farmLocationId)
  }

  if (!input.farmLocation) {
    return undefined
  }

  return state.farmLocations.find(
    (location) =>
      normalize(location.rack) === normalize(input.farmLocation!.rack) &&
      normalize(location.zone) === normalize(input.farmLocation!.zone),
  )
}

function createFarmLocation(
  input: CreateCropBatchWithDependenciesInput,
  state: ReturnType<typeof readDemoData>,
): FarmLocation | undefined {
  if (!input.farmLocation) {
    return undefined
  }

  const timestamp = nowIso()
  const farmLocation: FarmLocation = {
    id: createId("loc"),
    rack: input.farmLocation.rack,
    zone: input.farmLocation.zone,
    label: input.farmLocation.label ?? `${input.farmLocation.rack} / ${input.farmLocation.zone}`,
    description: input.farmLocation.description,
    defaultGrowingMethod: input.farmLocation.defaultGrowingMethod,
    status: "active",
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  state.farmLocations.push(farmLocation)

  return farmLocation
}

function normalize(value: string) {
  return value.trim().toLowerCase()
}

function addDays(value: string | Date, days: number) {
  const date = value instanceof Date ? new Date(value) : new Date(value)
  date.setDate(date.getDate() + days)
  return date.toISOString()
}
