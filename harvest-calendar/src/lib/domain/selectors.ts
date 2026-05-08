import type { CropBatch, CropBatchSummary } from "@/types/crop"
import type {
  CropHealthState,
  CropLifecycleStatus,
  FeedbackState,
  HarvestWindowSummary,
  SensorAssignmentState,
  StatusPriority,
} from "@/types/domain"
import {
  getCropHealthLabel,
  getCropLifecycleLabel,
  getFeedbackStateLabel,
  getMetricAvailabilityLabel,
  getModelMaturityLabel,
  getPredictionModeLabel,
  getSensorAssignmentLabel,
} from "@/types/domain"
import type { HarvestFeedback } from "@/types/feedback"
import type { PlantProfile, PlantIdealRanges } from "@/types/plant"
import type { HarvestPrediction } from "@/types/prediction"
import type { SensorDevice, SensorGroup, SensorReading, SensorType } from "@/types/sensor"

const SOON_DAYS = 3
const LOW_RELIABILITY = 50
const WATCH_RELIABILITY = 70

const terminalLifecycleStates: CropLifecycleStatus[] = [
  "completed",
  "cancelled",
  "failed",
  "archived",
]

const sensorTypeByIdealRangeKey: Record<keyof PlantIdealRanges, SensorType> = {
  temperatureC: "temperature",
  humidityPercent: "humidity",
  ph: "ph",
  ec: "ec",
  lightHours: "light",
  moisturePercent: "moisture",
}

export const displayLabelHelpers = {
  getCropHealthLabel,
  getCropLifecycleLabel,
  getFeedbackStateLabel,
  getMetricAvailabilityLabel,
  getModelMaturityLabel,
  getPredictionModeLabel,
  getSensorAssignmentLabel,
}

export function getCropLifecycleState(
  crop: CropBatch,
  demoNow: string | Date = new Date(),
): CropLifecycleStatus {
  if (terminalLifecycleStates.includes(crop.status)) {
    return crop.status
  }

  if (crop.status === "feedback_needed" || crop.status === "ready_soon") {
    return crop.status
  }

  const now = toDate(demoNow)
  const windowStart = toDate(crop.predictedHarvestWindow.start)
  const windowEnd = toDate(crop.predictedHarvestWindow.end)
  const daysUntilStart = differenceInCalendarDays(windowStart, now)

  if (now > endOfDay(windowEnd)) {
    return "feedback_needed"
  }

  if (daysUntilStart <= SOON_DAYS) {
    return "ready_soon"
  }

  return "growing"
}

export function getCropHealthState(
  crop: CropBatch,
  prediction: HarvestPrediction | undefined,
  readings: SensorReading[],
  assignmentState: SensorAssignmentState,
): CropHealthState {
  if (crop.status === "cancelled" || crop.status === "failed" || crop.status === "archived") {
    return "attention"
  }

  if (assignmentState === "missing" || assignmentState === "ambiguous" || assignmentState === "offline") {
    return "attention"
  }

  const confidence = prediction?.confidence ?? crop.confidence
  const hasNegativeFactor = prediction?.contributingFactors.some(
    (factor) => factor.status === "negative",
  )

  if (confidence < LOW_RELIABILITY || hasNegativeFactor || hasConcerningReading(readings)) {
    return "attention"
  }

  if (confidence < WATCH_RELIABILITY || prediction?.predictionMode === "generic_baseline") {
    return "watch"
  }

  return "healthy"
}

export function getFeedbackState(
  crop: CropBatch,
  feedbackHistory: HarvestFeedback[],
  demoNow: string | Date = new Date(),
): FeedbackState {
  const latestFeedback = getLatestFeedback(feedbackHistory)

  if (latestFeedback && latestFeedback.accuracy !== "not_ready") {
    return "submitted"
  }

  if (latestFeedback?.accuracy === "not_ready") {
    const nextReviewAt = getNextReviewAt(latestFeedback)

    if (nextReviewAt && toDate(nextReviewAt) > toDate(demoNow)) {
      return "check_again_scheduled"
    }

    return "awaiting_feedback"
  }

  if (getCropLifecycleState(crop, demoNow) === "feedback_needed") {
    return "awaiting_feedback"
  }

  return "not_requested"
}

export function getSensorAssignmentState(
  crop: CropBatch,
  sensorGroups: SensorGroup[],
  sensorDevices: SensorDevice[],
): SensorAssignmentState {
  const sensorGroup = crop.sensorGroupId
    ? sensorGroups.find((group) => group.id === crop.sensorGroupId)
    : getFallbackSensorGroup(crop, sensorGroups)

  if (!sensorGroup) {
    return crop.sensorGroupId ? "missing" : getFallbackAssignmentState(crop, sensorGroups)
  }

  if (sensorGroup.assignedBatchId && sensorGroup.assignedBatchId !== crop.id) {
    return "ambiguous"
  }

  const devices = getDevicesForGroup(sensorGroup, sensorDevices)

  if (devices.length === 0) {
    return "missing"
  }

  if (devices.every((device) => device.status !== "online")) {
    return "offline"
  }

  return "assigned"
}

export function getMissingSensorTypes(
  _crop: CropBatch,
  plantProfile: PlantProfile,
  sensorGroup: SensorGroup | undefined,
  sensorDevices: SensorDevice[],
): SensorType[] {
  const requiredSensorTypes = getRequiredSensorTypes(plantProfile)

  if (!sensorGroup) {
    return requiredSensorTypes
  }

  const availableSensorTypes = new Set(
    getDevicesForGroup(sensorGroup, sensorDevices)
      .filter((device) => device.status === "online")
      .flatMap((device) => device.sensorTypes),
  )

  return requiredSensorTypes.filter((sensorType) => !availableSensorTypes.has(sensorType))
}

export function getHarvestWindowSummary(
  cropOrPrediction: CropBatch | HarvestPrediction,
  demoNow: string | Date = new Date(),
): HarvestWindowSummary {
  const window = getWindow(cropOrPrediction)
  const start = toDate(window.start)
  const end = toDate(window.end)
  const now = toDate(demoNow)

  return {
    start: window.start,
    end: window.end,
    expectedDate: window.expectedDate,
    label: `${formatShortDate(start)} - ${formatShortDate(end)}`,
    daysUntilStart: differenceInCalendarDays(start, now),
    daysUntilEnd: differenceInCalendarDays(end, now),
    isOverdue: now > endOfDay(end),
  }
}

export function getStatusPriority(cropSummary: CropBatchSummary): StatusPriority {
  if (cropSummary.status === "archived" || cropSummary.status === "cancelled") {
    return "hidden"
  }

  if (cropSummary.status === "completed") {
    return "done"
  }

  if (cropSummary.status === "failed" || cropSummary.cropHealthState === "attention") {
    return "critical"
  }

  if (
    cropSummary.feedbackState === "awaiting_feedback" ||
    getCropLifecycleState(cropSummary) === "feedback_needed"
  ) {
    return "action"
  }

  if (getCropLifecycleState(cropSummary) === "ready_soon") {
    return "action"
  }

  if (
    cropSummary.cropHealthState === "watch" ||
    cropSummary.feedbackState === "check_again_scheduled"
  ) {
    return "watch"
  }

  return "normal"
}

function getFallbackAssignmentState(
  crop: CropBatch,
  sensorGroups: SensorGroup[],
): SensorAssignmentState {
  const matchingGroups = getMatchingSensorGroups(crop, sensorGroups)

  if (matchingGroups.length === 0) {
    return "missing"
  }

  if (matchingGroups.length > 1) {
    return "ambiguous"
  }

  return "assigned"
}

function getFallbackSensorGroup(crop: CropBatch, sensorGroups: SensorGroup[]) {
  const matchingGroups = getMatchingSensorGroups(crop, sensorGroups)

  return matchingGroups.length === 1 ? matchingGroups[0] : undefined
}

function getMatchingSensorGroups(crop: CropBatch, sensorGroups: SensorGroup[]) {
  return sensorGroups.filter((group) => {
    if (crop.farmLocationId && group.farmLocationId) {
      return group.farmLocationId === crop.farmLocationId
    }

    return group.rack === crop.rack && group.zone === crop.zone
  })
}

function getDevicesForGroup(sensorGroup: SensorGroup, sensorDevices: SensorDevice[]) {
  const sensorIds = new Set(sensorGroup.sensorIds)

  return sensorDevices.filter(
    (device) => sensorIds.has(device.id) || device.sensorGroupId === sensorGroup.id,
  )
}

function getRequiredSensorTypes(plantProfile: PlantProfile) {
  if (plantProfile.requiredSensorTypes?.length) {
    return Array.from(new Set(plantProfile.requiredSensorTypes))
  }

  return Object.entries(plantProfile.idealRanges)
    .filter(([, range]) => Boolean(range))
    .map(([key]) => sensorTypeByIdealRangeKey[key as keyof PlantIdealRanges])
}

function getLatestFeedback(feedbackHistory: HarvestFeedback[]) {
  return [...feedbackHistory].sort(
    (a, b) => toDate(b.submittedAt).getTime() - toDate(a.submittedAt).getTime(),
  )[0]
}

function getNextReviewAt(feedback: HarvestFeedback) {
  if (feedback.nextReviewAt) {
    return feedback.nextReviewAt
  }

  if (!feedback.checkAgainInDays) {
    return undefined
  }

  const reviewDate = toDate(feedback.actualHarvestDate)
  reviewDate.setDate(reviewDate.getDate() + feedback.checkAgainInDays)

  return reviewDate.toISOString()
}

function getWindow(cropOrPrediction: CropBatch | HarvestPrediction) {
  if ("predictedHarvestWindow" in cropOrPrediction) {
    return {
      start: cropOrPrediction.predictedHarvestWindow.start,
      end: cropOrPrediction.predictedHarvestWindow.end,
      expectedDate: cropOrPrediction.predictedHarvestDate,
    }
  }

  return {
    start: cropOrPrediction.windowStart,
    end: cropOrPrediction.windowEnd,
    expectedDate: cropOrPrediction.predictedHarvestDate,
  }
}

function hasConcerningReading(readings: SensorReading[]) {
  return readings.some((reading) => {
    return (
      reading.temperatureC !== undefined && (reading.temperatureC < 10 || reading.temperatureC > 35)
    )
  })
}

function toDate(value: string | Date) {
  return value instanceof Date ? new Date(value) : new Date(value)
}

function differenceInCalendarDays(left: Date, right: Date) {
  return Math.round((startOfDay(left).getTime() - startOfDay(right).getTime()) / 86_400_000)
}

function startOfDay(date: Date) {
  const nextDate = new Date(date)
  nextDate.setHours(0, 0, 0, 0)
  return nextDate
}

function endOfDay(date: Date) {
  const nextDate = new Date(date)
  nextDate.setHours(23, 59, 59, 999)
  return nextDate
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date)
}
