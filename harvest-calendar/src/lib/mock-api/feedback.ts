import type {
  HarvestFeedback,
  SubmitHarvestFeedbackInput,
  SubmitHarvestFeedbackResult,
} from "@/types/feedback"
import type { ModelLearningStats } from "@/types/learning"

import { createId, nowIso, readDemoData, updateDemoData, withMockDelay } from "./storage"

export async function getHarvestFeedback(batchId: string): Promise<HarvestFeedback[]> {
  return withMockDelay(
    readDemoData()
      .feedback.filter((feedback) => feedback.batchId === batchId)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()),
  )
}

export async function submitHarvestFeedback(
  input: SubmitHarvestFeedbackInput,
): Promise<SubmitHarvestFeedbackResult> {
  let result: SubmitHarvestFeedbackResult | undefined

  updateDemoData((state) => {
    const cropBatch = state.cropBatches.find((crop) => crop.id === input.batchId)
    const prediction = state.predictions.find((item) => item.batchId === input.batchId)

    if (!cropBatch) {
      throw new Error(`Crop batch ${input.batchId} was not found.`)
    }

    if (!prediction) {
      throw new Error(`Prediction for crop batch ${input.batchId} was not found.`)
    }

    const submittedAt = nowIso()
    const nextReviewAt =
      input.accuracy === "not_ready" && input.checkAgainInDays
        ? addDays(input.actualHarvestDate, input.checkAgainInDays)
        : undefined
    const feedback: HarvestFeedback = {
      id: createId("feedback"),
      batchId: input.batchId,
      predictedHarvestDate: input.predictedHarvestDate,
      actualHarvestDate: input.actualHarvestDate,
      accuracy: input.accuracy,
      daysOff: input.daysOff,
      checkAgainInDays: input.checkAgainInDays,
      nextReviewAt,
      qualityRating: input.qualityRating,
      notes: input.notes,
      submittedAt,
    }

    const updatedCrop =
      input.accuracy === "not_ready"
        ? {
            ...cropBatch,
            status: "growing" as const,
            predictedHarvestDate: nextReviewAt ?? cropBatch.predictedHarvestDate,
            predictedHarvestWindow: {
              start: addDays(nextReviewAt ?? cropBatch.predictedHarvestDate, -2),
              end: addDays(nextReviewAt ?? cropBatch.predictedHarvestDate, 2),
            },
            updatedAt: submittedAt,
          }
        : {
            ...cropBatch,
            status: "completed" as const,
            updatedAt: submittedAt,
          }

    const updatedPrediction =
      input.accuracy === "not_ready"
        ? {
            ...prediction,
            predictedHarvestDate: updatedCrop.predictedHarvestDate,
            windowStart: updatedCrop.predictedHarvestWindow.start,
            windowEnd: updatedCrop.predictedHarvestWindow.end,
            confidence: Math.max(40, prediction.confidence - 6),
            shiftDays: prediction.shiftDays + (input.checkAgainInDays ?? 2),
            explanation: "The latest harvest check says this crop needs more time.",
            contributingFactors: [
              ...prediction.contributingFactors,
              {
                label: "Harvest check",
                status: "neutral" as const,
                impact: "Grower asked to check again later",
              },
            ],
          }
        : {
            ...prediction,
            confidence: Math.min(95, prediction.confidence + 4),
            predictionMode: "learned" as const,
            explanation: "This estimate now includes the recorded harvest result.",
            contributingFactors: [
              ...prediction.contributingFactors,
              {
                label: "Harvest result",
                status: input.daysOff === 0 ? ("positive" as const) : ("neutral" as const),
                impact:
                  input.daysOff === 0
                    ? "The estimate matched the actual harvest date"
                    : `The result was ${Math.abs(input.daysOff)} days off`,
              },
            ],
          }

    state.feedback.push(feedback)
    state.cropBatches = state.cropBatches.map((crop) =>
      crop.id === input.batchId ? updatedCrop : crop,
    )
    state.predictions = state.predictions.map((item) =>
      item.batchId === input.batchId ? updatedPrediction : item,
    )

    if (input.accuracy !== "not_ready") {
      state.learningStats = applyCompletedFeedbackToLearningStats(
        state.learningStats,
        cropBatch.plantProfileId,
        feedback,
      )
    }

    const timelineEvent = {
      id: createId("event"),
      batchId: input.batchId,
      type: "harvest_check_recorded" as const,
      title: "Harvest check recorded",
      description:
        input.accuracy === "not_ready"
          ? "Crop needs more time before harvest."
          : "Harvest result recorded and crop marked complete.",
      createdAt: submittedAt,
    }

    state.timelineEvents.push(timelineEvent)

    result = {
      feedback,
      cropBatch: updatedCrop,
      prediction: updatedPrediction,
      learningStats: state.learningStats,
      timelineEvent,
    }
  })

  return withMockDelay(result!)
}

function applyCompletedFeedbackToLearningStats(
  existingStats: ModelLearningStats[],
  plantProfileId: string,
  feedback: HarvestFeedback,
) {
  return existingStats.map((stats) => {
    if (stats.plantProfileId !== plantProfileId) {
      return stats
    }

    const completedCycles = stats.completedCycles + 1
    const absoluteError = Math.abs(feedback.daysOff)
    const averageErrorAfterDays =
      stats.completedCycles > 0
        ? (stats.averageErrorAfterDays * stats.completedCycles + absoluteError) / completedCycles
        : absoluteError

    return {
      ...stats,
      completedCycles,
      averageErrorBeforeDays:
        stats.averageErrorBeforeDays > 0 ? stats.averageErrorBeforeDays : absoluteError + 2,
      averageErrorAfterDays: Number(averageErrorAfterDays.toFixed(1)),
      confidence: Math.min(95, stats.confidence + 3),
      maturityLevel: completedCycles >= 8 ? "adaptive" : "learning",
      lastUpdatedAt: nowIso(),
    } satisfies ModelLearningStats
  })
}

function addDays(value: string, days: number) {
  const date = new Date(value)
  date.setDate(date.getDate() + days)
  return date.toISOString()
}
