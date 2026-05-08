import type {
  CropHealthState,
  CropLifecycleStatus,
  FeedbackState,
  GrowingMethod,
  SensorAssignmentState,
} from "./domain"
import type { FarmLocation, CreateFarmLocationInput } from "./location"
import type { CreateCustomPlantProfileInput, PlantProfile } from "./plant"
import type { PredictionSummary } from "./prediction"

export type CropBatch = {
  id: string
  plantProfileId: string
  plantName: string
  variety?: string
  plantedAt: string
  growingMethod: GrowingMethod
  farmLocationId?: string
  rack: string
  zone: string
  sensorGroupId?: string
  assignedSensorIds: string[]
  plantCount: number
  status: CropLifecycleStatus
  genericHarvestDate: string
  predictedHarvestDate: string
  predictedHarvestWindow: {
    start: string
    end: string
  }
  confidence: number
  predictionShiftDays: number
  notes?: string
  createdAt?: string
  updatedAt?: string
}

export type CropBatchSummary = CropBatch & {
  predictionSummary: PredictionSummary
  sensorAssignmentState: SensorAssignmentState
  cropHealthState: CropHealthState
  feedbackState: FeedbackState
}

export type CreateCropBatchInput = {
  plantProfileId: string
  plantedAt: string
  growingMethod: GrowingMethod
  farmLocationId?: string
  rack: string
  zone: string
  sensorGroupId?: string
  assignedSensorIds?: string[]
  plantCount: number
  notes?: string
}

export type CreateCropBatchWithDependenciesInput = {
  crop: Omit<CreateCropBatchInput, "plantProfileId" | "farmLocationId" | "rack" | "zone"> & {
    plantProfileId?: string
    farmLocationId?: string
    rack?: string
    zone?: string
  }
  customPlantProfile?: CreateCustomPlantProfileInput
  farmLocation?: CreateFarmLocationInput
}

export type CreateCropBatchResult = {
  cropBatch: CropBatch
  plantProfile: PlantProfile
  farmLocation?: FarmLocation
}

export type UpdateCropBatchInput = {
  id: string
  plantProfileId?: string
  plantedAt?: string
  growingMethod?: GrowingMethod
  farmLocationId?: string
  rack?: string
  zone?: string
  sensorGroupId?: string
  assignedSensorIds?: string[]
  plantCount?: number
  notes?: string
}

export type UpdateCropStatusInput = {
  id: string
  status: CropLifecycleStatus
}
