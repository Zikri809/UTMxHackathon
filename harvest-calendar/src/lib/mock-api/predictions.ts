import type { HarvestPrediction, PredictionSummary } from "@/types/prediction"

import { calculatePrediction } from "../mock-ml/calculate-prediction"
import { readDemoData, updateDemoData, withMockDelay } from "./storage"

export async function getPrediction(batchId: string): Promise<HarvestPrediction> {
  const state = readDemoData()
  const cropBatch = state.cropBatches.find((crop) => crop.id === batchId)

  if (!cropBatch) {
    throw new Error(`Crop batch ${batchId} was not found.`)
  }

  const storedPrediction = state.predictions.find((prediction) => prediction.batchId === batchId)

  if (storedPrediction) {
    return withMockDelay(storedPrediction)
  }

  const plantProfile = state.plantProfiles.find((profile) => profile.id === cropBatch.plantProfileId)
  const readings = state.sensorReadings.filter((reading) => reading.batchId === batchId)

  if (!plantProfile) {
    throw new Error(`Plant profile ${cropBatch.plantProfileId} was not found.`)
  }

  const prediction = calculatePrediction(cropBatch, plantProfile, readings)

  updateDemoData((nextState) => {
    nextState.predictions.push(prediction)
  })

  return withMockDelay(prediction)
}

export function toPredictionSummary(prediction: HarvestPrediction): PredictionSummary {
  return {
    batchId: prediction.batchId,
    genericHarvestDate: prediction.genericHarvestDate,
    predictedHarvestDate: prediction.predictedHarvestDate,
    predictedHarvestWindow: {
      start: prediction.windowStart,
      end: prediction.windowEnd,
    },
    confidence: prediction.confidence,
    shiftDays: prediction.shiftDays,
    predictionMode: prediction.predictionMode,
    modelMaturity: prediction.modelMaturity,
  }
}
