import type { ModelMaturity, PredictionMode } from "./domain"

export type PredictionFactorStatus = "positive" | "neutral" | "negative"

export type PredictionFactor = {
  label: string
  status: PredictionFactorStatus
  impact: string
}

export type HarvestPrediction = {
  batchId: string
  genericHarvestDate: string
  predictedHarvestDate: string
  windowStart: string
  windowEnd: string
  confidence: number
  shiftDays: number
  predictionMode: PredictionMode
  modelMaturity: ModelMaturity
  explanation: string
  contributingFactors: PredictionFactor[]
}

export type PredictionSummary = {
  batchId: string
  genericHarvestDate: string
  predictedHarvestDate: string
  predictedHarvestWindow: {
    start: string
    end: string
  }
  confidence: number
  shiftDays: number
  predictionMode: PredictionMode
  modelMaturity: ModelMaturity
}
