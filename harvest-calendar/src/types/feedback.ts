import type { CropBatch } from "./crop"
import type { HarvestPrediction } from "./prediction"
import type { ModelLearningStats } from "./learning"

export type HarvestFeedbackAccuracy = "accurate" | "early" | "late" | "not_ready"

export type HarvestFeedback = {
  id: string
  batchId: string
  predictedHarvestDate: string
  actualHarvestDate: string
  accuracy: HarvestFeedbackAccuracy
  daysOff: number
  checkAgainInDays?: number
  nextReviewAt?: string
  qualityRating: 1 | 2 | 3 | 4 | 5
  notes?: string
  submittedAt: string
}

export type SubmitHarvestFeedbackInput = {
  batchId: string
  predictedHarvestDate: string
  actualHarvestDate: string
  accuracy: HarvestFeedbackAccuracy
  daysOff: number
  checkAgainInDays?: number
  qualityRating: 1 | 2 | 3 | 4 | 5
  notes?: string
}

export type CropTimelineEvent = {
  id: string
  batchId: string
  type: "created" | "status_changed" | "devices_connected" | "harvest_check_recorded"
  title: string
  description?: string
  createdAt: string
}

export type SubmitHarvestFeedbackResult = {
  feedback: HarvestFeedback
  cropBatch: CropBatch
  prediction: HarvestPrediction
  learningStats: ModelLearningStats[]
  timelineEvent: CropTimelineEvent
}
