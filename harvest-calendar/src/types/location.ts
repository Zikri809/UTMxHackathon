import type { GrowingMethod } from "./domain"

export type FarmLocationStatus = "active" | "archived"

export type FarmLocation = {
  id: string
  rack: string
  zone: string
  label: string
  description?: string
  defaultGrowingMethod?: GrowingMethod
  status: FarmLocationStatus
  createdAt?: string
  updatedAt?: string
}

export type CreateFarmLocationInput = {
  rack: string
  zone: string
  label?: string
  description?: string
  defaultGrowingMethod?: GrowingMethod
}

export type UpdateFarmLocationInput = {
  id: string
  rack?: string
  zone?: string
  label?: string
  description?: string
  defaultGrowingMethod?: GrowingMethod
  status?: FarmLocationStatus
}
