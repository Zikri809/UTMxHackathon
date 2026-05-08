import type {
  CreateCustomPlantProfileInput,
  PlantProfile,
  UpdatePlantProfileInput,
} from "@/types/plant"

import { createId, nowIso, readDemoData, updateDemoData, withMockDelay } from "./storage"

export async function getPlantProfiles(): Promise<PlantProfile[]> {
  return withMockDelay(readDemoData().plantProfiles)
}

export async function createCustomPlantProfile(
  input: CreateCustomPlantProfileInput,
): Promise<PlantProfile> {
  const plantProfile = buildCustomPlantProfile(input)

  updateDemoData((state) => {
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
      lastUpdatedAt: plantProfile.createdAt,
    })
  })

  return withMockDelay(plantProfile)
}

export async function updatePlantProfile(input: UpdatePlantProfileInput): Promise<PlantProfile> {
  let updatedProfile: PlantProfile | undefined

  updateDemoData((state) => {
    const plantProfile = state.plantProfiles.find((item) => item.id === input.id)

    if (!plantProfile) {
      throw new Error(`Plant profile ${input.id} was not found.`)
    }

    updatedProfile = {
      ...plantProfile,
      ...input,
      updatedAt: nowIso(),
    }

    state.plantProfiles = state.plantProfiles.map((item) =>
      item.id === input.id ? updatedProfile! : item,
    )

    state.cropBatches = state.cropBatches.map((cropBatch) =>
      cropBatch.plantProfileId === input.id
        ? { ...cropBatch, plantName: updatedProfile!.name, updatedAt: nowIso() }
        : cropBatch,
    )

    state.learningStats = state.learningStats.map((stats) =>
      stats.plantProfileId === input.id
        ? {
            ...stats,
            plantName: updatedProfile!.name,
            maturityLevel: updatedProfile!.modelMaturity,
            lastUpdatedAt: nowIso(),
          }
        : stats,
    )
  })

  return withMockDelay(updatedProfile!)
}

export function findOrCreateCustomPlantProfile(
  input: CreateCustomPlantProfileInput | undefined,
): PlantProfile | undefined {
  if (!input) {
    return undefined
  }

  const state = readDemoData()
  const existingProfile = state.plantProfiles.find(
    (profile) =>
      profile.source === "custom" &&
      normalize(profile.name) === normalize(input.name) &&
      normalize(profile.variety ?? "") === normalize(input.variety ?? ""),
  )

  if (existingProfile) {
    return existingProfile
  }

  const plantProfile = buildCustomPlantProfile(input)

  updateDemoData((nextState) => {
    nextState.plantProfiles.push(plantProfile)
    nextState.learningStats.push({
      plantProfileId: plantProfile.id,
      plantName: plantProfile.name,
      source: "custom",
      completedCycles: 0,
      averageErrorBeforeDays: 0,
      averageErrorAfterDays: 0,
      confidence: 45,
      maturityLevel: "baseline",
      lastUpdatedAt: plantProfile.createdAt,
    })
  })

  return plantProfile
}

function buildCustomPlantProfile(input: CreateCustomPlantProfileInput): PlantProfile {
  const timestamp = nowIso()

  return {
    id: createId("plant"),
    name: input.name,
    variety: input.variety,
    source: "custom",
    defaultMaturityDays: input.defaultMaturityDays,
    harvestWindowBufferDays: input.harvestWindowBufferDays ?? 3,
    idealRanges: input.idealRanges ?? {},
    modelMaturity: "baseline",
    requiredSensorTypes: input.requiredSensorTypes,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

function normalize(value: string) {
  return value.trim().toLowerCase()
}
