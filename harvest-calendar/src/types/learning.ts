import type { ModelMaturity } from "./domain"
import type { PlantProfileSource } from "./plant"

export type ModelLearningStats = {
  plantProfileId: string
  plantName: string
  source: PlantProfileSource
  completedCycles: number
  averageErrorBeforeDays: number
  averageErrorAfterDays: number
  confidence: number
  maturityLevel: ModelMaturity
  lastUpdatedAt?: string
}
