import type { CreateFarmLocationInput, FarmLocation, UpdateFarmLocationInput } from "@/types/location"

import { createId, nowIso, readDemoData, updateDemoData, withMockDelay } from "./storage"

export async function getFarmLocations(): Promise<FarmLocation[]> {
  return withMockDelay(readDemoData().farmLocations)
}

export async function createFarmLocation(input: CreateFarmLocationInput): Promise<FarmLocation> {
  const timestamp = nowIso()
  const farmLocation: FarmLocation = {
    id: createId("loc"),
    rack: input.rack,
    zone: input.zone,
    label: input.label ?? `${input.rack} / ${input.zone}`,
    description: input.description,
    defaultGrowingMethod: input.defaultGrowingMethod,
    status: "active",
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  updateDemoData((state) => {
    state.farmLocations.push(farmLocation)
  })

  return withMockDelay(farmLocation)
}

export async function updateFarmLocation(input: UpdateFarmLocationInput): Promise<FarmLocation> {
  let updatedLocation: FarmLocation | undefined

  updateDemoData((state) => {
    const location = state.farmLocations.find((item) => item.id === input.id)

    if (!location) {
      throw new Error(`Farm location ${input.id} was not found.`)
    }

    updatedLocation = {
      ...location,
      ...input,
      label: input.label ?? location.label,
      updatedAt: nowIso(),
    }

    state.farmLocations = state.farmLocations.map((item) =>
      item.id === input.id ? updatedLocation! : item,
    )
  })

  return withMockDelay(updatedLocation!)
}

export function findOrCreateFarmLocation(
  input: CreateFarmLocationInput | undefined,
): FarmLocation | undefined {
  if (!input) {
    return undefined
  }

  const state = readDemoData()
  const existingLocation = state.farmLocations.find(
    (location) =>
      normalize(location.rack) === normalize(input.rack) &&
      normalize(location.zone) === normalize(input.zone),
  )

  if (existingLocation) {
    return existingLocation
  }

  const timestamp = nowIso()
  const farmLocation: FarmLocation = {
    id: createId("loc"),
    rack: input.rack,
    zone: input.zone,
    label: input.label ?? `${input.rack} / ${input.zone}`,
    description: input.description,
    defaultGrowingMethod: input.defaultGrowingMethod,
    status: "active",
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  updateDemoData((nextState) => {
    nextState.farmLocations.push(farmLocation)
  })

  return farmLocation
}

function normalize(value: string) {
  return value.trim().toLowerCase()
}
