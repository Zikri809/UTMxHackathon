# Crop Detail Page Build Spec

## Route And File

Route:

```text
/crops/[batchId]
```

Next.js file:

```text
src/app/crops/[batchId]/page.tsx
```

Recommended page component:

```text
src/components/crops/crop-detail-page.tsx
```

## Purpose

Crop Detail is the most important proof-of-concept page. It explains how the harvest prediction is made, how sensor readings are affecting it, and how user feedback closes the learning loop.

## Primary User Questions

- When is this crop expected to be ready?
- How is that different from the generic estimate?
- How confident is the prediction?
- Which sensor conditions are helping or hurting?
- Which sensor group is feeding readings into this crop?
- Can I submit harvest feedback?

## Data Dependencies

Use TanStack Query hooks:

```ts
const crop = useCropBatch(batchId);
const sensorGroups = useSensorGroups();
const readings = useSensorReadings(batchId);
const prediction = useHarvestPrediction(batchId);
const feedbackMutation = useSubmitHarvestFeedback();
const updateCrop = useUpdateCropBatch();
const updateCropStatus = useUpdateCropStatus();
```

Derived data:

- Current sensor readings.
- Sensor averages.
- Sensor status compared with ideal ranges.
- Timeline events.
- Feedback availability.

## Page Layout

Recommended structure:

```text
PageHeader
  title: Crop name
  subtitle: Rack, zone, planted date
  actions: Back, Submit Feedback if available

Prediction hero row
  Current Prediction
  Generic Estimate
  Confidence
  Status

Main content tabs
  Overview
  Sensors
  Assignment
  Timeline
  Feedback
  Settings
```

Desktop:

- Prediction panel spans full width.
- Sensor metrics appear in a grid.
- Charts and explanation sit side-by-side.

Mobile:

- Prediction panel stacks.
- Tabs remain accessible.

## Components To Build

- `CropDetailHeader`
- `PredictionSummaryPanel`
- `PredictionExplanation`
- `ConfidenceMeter`
- `SensorMetricCard`
- `SensorTrendChart`
- `SensorAssignmentCard`
- `InsightList`
- `GrowthTimeline`
- `FeedbackModal`
- `EditCropDialog`
- `CropStatusActions`
- `HarvestWindow`
- shadcn `Tabs`
- shadcn `Card`
- shadcn `Badge`
- shadcn `Progress`
- shadcn `Dialog`
- shadcn `Skeleton`
- shadcn `Alert`

## Prediction Summary

Show:

- Current predicted harvest date.
- Harvest window.
- Generic harvest date.
- Days shifted from generic estimate.
- Confidence score.
- Model mode: baseline, learning, or adaptive.

Example copy:

```text
Prediction shifted 2 days earlier than the generic estimate.
Stable pH and warmer average temperature increased confidence.
```

## Prediction Explanation

Use `HarvestPrediction.contributingFactors`.

Each factor should show:

- Label.
- Positive, neutral, or negative status.
- Human-readable impact.

Examples:

- Stable pH: confidence increased.
- Low light: harvest may shift later.
- Warm temperature: growth may accelerate.

This section matters because the app should feel explainable, not like a black box.

## Sensor Tab

Show metric cards:

- Temperature.
- Humidity.
- pH.
- EC.
- Light exposure.
- Moisture if available.

Each metric card:

- Current reading.
- Ideal range.
- Status.
- Trend.
- Prediction impact.

Missing sensor type behavior:

- If a sensor type is not available in the assigned group, show the metric as `Unavailable`.
- Do not render an empty chart for unavailable metrics.
- Explain whether the missing metric lowers confidence.

Charts:

- Use Recharts line charts.
- Keep charts compact.
- Allow metric switching with tabs or segmented buttons.

## Assignment Tab Or Panel

Show how the app knows which sensor readings belong to this crop.

Required content:

- Assigned sensor group name.
- Rack and zone.
- Sensor device list.
- Sensor device status.
- Sensor types available.
- Explanation of matching rule.

Example:

```text
Readings are linked through Sensor Group Rack C / Zone 1.
This group is assigned to Spinach Batch SP-104, so its readings are used before rack/zone fallback.
```

If no sensor group is assigned:

- Show warning state.
- Explain that the prediction is mostly generic.
- Provide action to assign a sensor group if `useAssignSensorGroupToBatch` is implemented on this page.

If assignment is ambiguous:

- Show attention state.
- Explain that multiple active crops share the same rack/zone.
- Ask the user to assign a sensor group to this crop.

## Timeline Tab

Timeline events:

- Planted.
- Generic estimate created.
- Sensor readings started.
- Prediction updated.
- Ready soon.
- Feedback submitted.
- Completed.

Use this to tell the crop journey visually.

## Feedback Flow

Show feedback CTA when:

- `crop.status === "feedback_needed"`, or
- demo mode allows feedback, or
- user clicks "Mark harvest result".

Feedback fields:

- Accuracy: accurate, ready earlier, ready later, not ready yet.
- Days off.
- Actual harvest date.
- Check again in days, required only for `not_ready`.
- Quality rating.
- Notes.

On submit:

- Call `useSubmitHarvestFeedback`.
- Invalidate crop, crops list, prediction, and learning stats.
- Show confirmation message.

If feedback is `not_ready`:

- Keep crop status as `growing`.
- Shift predicted harvest date later by `checkAgainInDays`.
- Add a timeline event.
- Show "Check again scheduled" confirmation instead of completed-harvest copy.

Confirmation example:

```text
Feedback saved. The spinach model learned from this crop cycle.
```

## Settings Tab

The user should be able to recover from mistakes.

Supported actions:

- Edit planting date.
- Edit plant count.
- Edit rack/zone.
- Edit notes.
- Change sensor assignment.
- Mark crop as cancelled.
- Mark crop as failed.
- Archive crop.

Rules:

- Completed, cancelled, failed, and archived crops should not be editable except notes and archive/restore actions.
- Changing rack/zone should prompt the user to review sensor assignment.
- Archiving hides the crop from default Dashboard and Calendar views.
- Cancelled means the crop was created by mistake.
- Failed means the crop was real but lost before harvest.

## Loading State

Use skeletons for:

- Header.
- Prediction cards.
- Sensor cards.
- Chart area.

## Not Found State

If `getCropBatch(batchId)` cannot find the crop:

- Show "Crop batch not found."
- Link back to `/crops`.

## Error State

Use shadcn `Alert` with retry.

## Acceptance Criteria

- Crop detail loads crop, prediction, and sensor readings through TanStack Query.
- Page explains prediction shift from generic estimate.
- Sensor readings are visible as metrics and at least one chart.
- Missing sensor types are shown as unavailable.
- Page shows which sensor group or devices are assigned to the crop.
- If no sensor is assigned, the page explains the impact on confidence.
- Feedback can be submitted from this page.
- `Not ready yet` feedback keeps the crop active and schedules another check.
- User can edit, cancel, fail, or archive the crop from this page.
- Submitting feedback updates the Learning page data.
- Loading, error, and not found states exist.
