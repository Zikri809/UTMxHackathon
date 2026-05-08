import type { CropBatch } from "@/types/crop"
import type { PlantIdealRanges, PlantProfile } from "@/types/plant"
import type { HarvestPrediction, PredictionFactor } from "@/types/prediction"
import type { SensorReading } from "@/types/sensor"

export function calculatePrediction(
  cropBatch: CropBatch,
  plantProfile: PlantProfile,
  readings: SensorReading[] = [],
): HarvestPrediction {
  const factors = getPredictionFactors(plantProfile.idealRanges, readings)
  const negativeFactors = factors.filter((factor) => factor.status === "negative").length
  const hasReadings = readings.length > 0
  const shiftDays = hasReadings ? negativeFactors * 2 - getPositiveBonusDays(factors) : 0
  const confidence = clamp(
    hasReadings ? cropBatch.confidence - negativeFactors * 8 + factors.length : 46,
    35,
    92,
  )
  const predictedHarvestDate = addDays(cropBatch.genericHarvestDate, shiftDays)
  const bufferDays = plantProfile.harvestWindowBufferDays

  return {
    batchId: cropBatch.id,
    genericHarvestDate: cropBatch.genericHarvestDate,
    predictedHarvestDate,
    windowStart: addDays(predictedHarvestDate, -bufferDays),
    windowEnd: addDays(predictedHarvestDate, bufferDays),
    confidence,
    shiftDays,
    predictionMode: hasReadings ? "sensor_adjusted" : "generic_baseline",
    modelMaturity: plantProfile.modelMaturity,
    explanation: hasReadings
      ? "Recent device readings adjusted the starter estimate."
      : "This is a starter estimate until device readings are available.",
    contributingFactors: factors.length
      ? factors
      : [{ label: "Device data", status: "neutral", impact: "No recent readings available" }],
  }
}

function getPredictionFactors(
  idealRanges: PlantIdealRanges,
  readings: SensorReading[],
): PredictionFactor[] {
  const latestReading = [...readings].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )[0]

  if (!latestReading) {
    return []
  }

  return [
    getRangeFactor("Temperature", latestReading.temperatureC, idealRanges.temperatureC, "C"),
    getRangeFactor("Humidity", latestReading.humidityPercent, idealRanges.humidityPercent, "%"),
    getRangeFactor("pH", latestReading.ph, idealRanges.ph),
    getRangeFactor("EC", latestReading.ec, idealRanges.ec),
    getRangeFactor("Light", latestReading.lightHours, idealRanges.lightHours, " hours"),
    getRangeFactor("Moisture", latestReading.moisturePercent, idealRanges.moisturePercent, "%"),
  ].filter((factor): factor is PredictionFactor => Boolean(factor))
}

function getRangeFactor(
  label: string,
  value: number | undefined,
  range: { min: number; max: number } | undefined,
  suffix = "",
): PredictionFactor | undefined {
  if (value === undefined || !range) {
    return undefined
  }

  if (value < range.min || value > range.max) {
    return {
      label,
      status: "negative",
      impact: `${formatMetricValue(value, suffix)} is outside the ideal range`,
    }
  }

  return {
    label,
    status: "positive",
    impact: `${formatMetricValue(value, suffix)} is inside the ideal range`,
  }
}

function getPositiveBonusDays(factors: PredictionFactor[]) {
  return factors.filter((factor) => factor.status === "positive").length >= 4 ? 1 : 0
}

function addDays(value: string, days: number) {
  const date = new Date(value)
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function formatMetricValue(value: number, suffix: string) {
  return `${Number.isInteger(value) ? value : value.toFixed(1)}${suffix}`
}
