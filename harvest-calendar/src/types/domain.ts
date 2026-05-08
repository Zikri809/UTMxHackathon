export type GrowingMethod = "hydroponic" | "soil" | "aeroponic"

export type CropLifecycleStatus =
  | "growing"
  | "ready_soon"
  | "feedback_needed"
  | "completed"
  | "cancelled"
  | "failed"
  | "archived"

export type CropHealthState = "healthy" | "watch" | "attention"

export type FeedbackState =
  | "not_requested"
  | "awaiting_feedback"
  | "submitted"
  | "check_again_scheduled"

export type SensorAssignmentState = "assigned" | "missing" | "ambiguous" | "offline"

export type PredictionMode = "generic_baseline" | "sensor_adjusted" | "learned"

export type ModelMaturity = "baseline" | "learning" | "adaptive"

export type MetricAvailability = "available" | "unavailable" | "offline" | "not_required"

export type StatusPriority = "critical" | "action" | "watch" | "normal" | "done" | "hidden"

export type HarvestWindowSummary = {
  start: string
  end: string
  expectedDate: string
  label: string
  daysUntilStart: number
  daysUntilEnd: number
  isOverdue: boolean
}

export const predictionModeLabels: Record<PredictionMode, string> = {
  generic_baseline: "Starter estimate",
  sensor_adjusted: "Updated from conditions",
  learned: "Improved estimate",
}

export const modelMaturityLabels: Record<ModelMaturity, string> = {
  baseline: "Starter estimate",
  learning: "Getting better",
  adaptive: "Improved from past harvests",
}

export const cropLifecycleLabels: Record<CropLifecycleStatus, string> = {
  growing: "On track",
  ready_soon: "Ready soon",
  feedback_needed: "Harvest check needed",
  completed: "Completed",
  cancelled: "Cancelled",
  failed: "Marked failed",
  archived: "Archived",
}

export const cropHealthLabels: Record<CropHealthState, string> = {
  healthy: "On track",
  watch: "Keep watch",
  attention: "Needs attention",
}

export const feedbackStateLabels: Record<FeedbackState, string> = {
  not_requested: "No harvest check needed",
  awaiting_feedback: "Harvest check needed",
  submitted: "Harvest result recorded",
  check_again_scheduled: "Check again scheduled",
}

export const sensorAssignmentLabels: Record<SensorAssignmentState, string> = {
  assigned: "Devices connected",
  missing: "Connect devices",
  ambiguous: "Needs device connection",
  offline: "Devices offline",
}

export const metricAvailabilityLabels: Record<MetricAvailability, string> = {
  available: "Tracked",
  unavailable: "Not tracked",
  offline: "Device offline",
  not_required: "Not required",
}

export function getPredictionModeLabel(mode: PredictionMode) {
  return predictionModeLabels[mode]
}

export function getModelMaturityLabel(maturity: ModelMaturity) {
  return modelMaturityLabels[maturity]
}

export function getCropLifecycleLabel(status: CropLifecycleStatus) {
  return cropLifecycleLabels[status]
}

export function getCropHealthLabel(state: CropHealthState) {
  return cropHealthLabels[state]
}

export function getFeedbackStateLabel(state: FeedbackState) {
  return feedbackStateLabels[state]
}

export function getSensorAssignmentLabel(state: SensorAssignmentState) {
  return sensorAssignmentLabels[state]
}

export function getMetricAvailabilityLabel(availability: MetricAvailability) {
  return metricAvailabilityLabels[availability]
}
