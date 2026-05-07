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

Crop Detail is the most important proof-of-concept page. It should answer: is this crop on track, why did the ready date change, and what should the grower do next?

The page can be explainable without sounding technical. Keep detailed device and estimate logic available, but make the first view action-oriented.

## Primary User Questions

- When is this crop expected to be ready?
- How is that different from the starter estimate?
- How reliable is the estimate?
- Which growing conditions are helping or hurting?
- Which devices are tracking this crop?
- Can I record the harvest result?

## User-Friendly UX Rules

- Use `Expected ready date`, `Ready window`, and `Reliability`.
- Use `View why this changed` instead of showing prediction logic immediately.
- Use `Conditions` instead of Sensors.
- Use `Devices` instead of Assignment.
- Use `History` instead of Timeline.
- Use `Harvest Check` instead of Feedback.
- Keep charts compact and below the main decision.

## Data Dependencies

Use TanStack Query hooks:

```ts
const crop = useCropBatch(batchId);
const sensorGroups = useSensorGroups();
const readings = useSensorReadings(batchId);
const prediction = useHarvestPrediction(batchId);
const feedbackHistory = useHarvestFeedback(batchId);
const feedbackMutation = useSubmitHarvestFeedback();
const updateCrop = useUpdateCropBatch();
const updateCropStatus = useUpdateCropStatus();
const assignSensorGroup = useAssignSensorGroupToBatch(); // only if assignment is implemented locally
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
  actions: Back, Record harvest result if available

Estimate hero row
  Expected Ready Date
  Starter Estimate
  Reliability
  Status

Main content tabs
  Overview
  Conditions
  Devices
  History
  Harvest Check
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

## Estimate Summary

Show:

- Expected ready date.
- Ready window.
- Starter ready date.
- Days changed from starter estimate.
- Reliability score.
- Estimate quality: starter, getting better, or highly reliable.

Example copy:

```text
Expected ready date moved 2 days earlier than the starter estimate.
Stable pH and warmer average temperature made this estimate more reliable.
```

## Estimate Explanation

Use `HarvestPrediction.contributingFactors`.

Each factor should show:

- Label.
- Positive, neutral, or negative status.
- Human-readable impact.

Examples:

- Stable pH: estimate is more reliable.
- Low light: harvest may shift later.
- Warm temperature: growth may accelerate.

This section matters because the app should feel explainable, not like a black box.

Visible section label should be `View why this changed`.

## Conditions Tab

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
- Estimate impact.

Missing device metric behavior:

- If a metric is not available in the connected device group, show it as `Not tracked`.
- Do not render an empty chart for unavailable metrics.
- Explain whether the missing metric lowers reliability.

Charts:

- Use Recharts line charts.
- Keep charts compact.
- Allow metric switching with tabs or segmented buttons.

## Devices Tab Or Panel

Show which devices are tracking this crop and where those readings come from.

Required content:

- Connected device group name.
- Rack and zone.
- Device list.
- Device status.
- Metrics available.
- Plain-language explanation of which location is connected to the crop.

Example:

```text
Device group Rack C / Zone 1 is connected to this spinach crop.
Those readings are used for this crop's ready-date estimate.
```

If no device group is connected:

- Show warning state.
- Explain that the estimate is mostly a starter estimate.
- Provide action to `/sensors?action=assign&batchId=[batchId]&returnTo=/crops/[batchId]` unless `useAssignSensorGroupToBatch` is implemented locally.

If connection needs review:

- Show attention state.
- Explain that multiple active crops share the same rack/zone.
- Ask the user to connect a device group to this crop.
- Provide the same connection deep link to Devices & Locations with the crop preselected.

## History Tab

Timeline events:

- Planted.
- Starter estimate created.
- Device readings started.
- Estimate updated.
- Ready soon.
- Harvest result recorded.
- Completed.

Use this to tell the crop journey visually.

## Harvest Check Flow

Show harvest check CTA when:

- `crop.status === "feedback_needed"`, or
- demo mode allows feedback, or
- user clicks "Record harvest result".

Harvest check fields:

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
- Treat the response as an atomic result containing feedback, updated crop, updated prediction, updated learning stats, and a timeline event.

If harvest check is `not_ready`:

- Keep crop status as `growing`.
- Shift expected ready date later by `checkAgainInDays`.
- Add a timeline event.
- Show "Check again scheduled" confirmation instead of completed-harvest copy.

Confirmation example:

```text
Harvest result saved. Future spinach estimates will use this result.
```

## Settings Tab

The user should be able to recover from mistakes.

Supported actions:

- Edit planting date.
- Edit plant count.
- Edit rack/zone.
- Edit notes.
- Change device connection.
- Mark crop as cancelled.
- Mark crop as failed.
- Archive crop.

Rules:

- Completed, cancelled, failed, and archived crops should not be editable except notes and archive/restore actions.
- Changing rack/zone should prompt the user to review device connection.
- Device connection changes should route to `/sensors?action=assign&batchId=[batchId]&returnTo=/crops/[batchId]` unless a local connection dialog is implemented.
- Archiving hides the crop from default Dashboard and Calendar views.
- Cancelled means the crop was created by mistake.
- Failed means the crop was real but lost before harvest.

## Loading State

Use skeletons for:

- Header.
- Estimate cards.
- Condition cards.
- Chart area.

## Not Found State

If `getCropBatch(batchId)` cannot find the crop:

- Show "Crop batch not found."
- Link back to `/crops`.

## Error State

Use shadcn `Alert` with retry.

## Acceptance Criteria

- Crop detail loads crop, estimate, and condition readings through TanStack Query.
- Page explains ready-date changes from the starter estimate.
- Growing conditions are visible as metrics and at least one chart.
- Missing device metrics are shown as not tracked.
- Page shows which device group or devices are connected to the crop.
- If no devices are connected, the page explains the impact on reliability.
- Harvest checks can be submitted from this page.
- `Not ready yet` feedback keeps the crop active and schedules another check.
- User can edit, cancel, fail, or archive the crop from this page.
- Recording a harvest result updates the Improvements page data.
- Loading, error, and not found states exist.
- Visible copy avoids ML, model, prediction-mode, and sensor-assignment jargon.
