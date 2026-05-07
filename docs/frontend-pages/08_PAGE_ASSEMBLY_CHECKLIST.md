# Page Assembly Checklist

## Purpose

This checklist ensures the individual page specs assemble into one working frontend rather than isolated screens.

## Required Routes

```text
/ -> redirects to /dashboard
/dashboard
/calendar
/crops
/crops/new
/crops/[batchId]
/sensors
/learning
```

## Shared Data Flow

All pages must use this chain:

```text
Page -> TanStack Query hook -> mock API function -> local storage or seed data
```

Pages must not import seed data directly.

## Shared Query Hooks

Required hooks:

```ts
usePlantProfiles()
useCreateCustomPlantProfile()
useUpdatePlantProfile()
useFarmLocations()
useCreateFarmLocation()
useUpdateFarmLocation()
useCropBatches()
useCropBatch(batchId)
useCreateCropBatch()
useUpdateCropBatch()
useUpdateCropStatus()
useSensorDevices()
useSensorGroups()
useAssignSensorGroupToBatch()
useSensorReadings(batchId)
useHarvestPrediction(batchId)
useSubmitHarvestFeedback()
useModelLearningStats()
useResetDemoData()
```

## Cross-Page Behavior

Creating a crop from `/crops/new` must update:

- `/dashboard`
- `/calendar`
- `/crops`
- `/crops/[batchId]`

Editing a crop from `/crops/[batchId]` must update:

- `/dashboard`
- `/calendar`
- `/crops`
- current `/crops/[batchId]`
- sensor readings and prediction if location or sensor assignment changes

Creating a custom plant from `/crops/new` must update:

- plant selector options
- `/learning`
- future crop creation estimates

Assigning a sensor group must update:

- `/sensors`
- `/crops/[batchId]`
- prediction and sensor readings for that crop

Creating or editing a farm location must update:

- Add Crop location selector
- `/sensors`
- affected crop and sensor assignment displays

Submitting feedback from `/crops/[batchId]` must update:

- `/dashboard`
- `/calendar`
- `/crops`
- `/learning`
- current `/crops/[batchId]`

Resetting demo data must update:

- every route
- all query caches
- local storage-backed seed state

## Shared Status Labels

Use the same status values everywhere:

```text
growing
ready_soon
feedback_needed
completed
cancelled
failed
archived
```

Use the same prediction modes everywhere:

```text
generic_baseline
sensor_adjusted
learned
```

Use the same model maturity values everywhere:

```text
baseline
learning
adaptive
```

Use the same sensor assignment values everywhere:

```text
assigned
missing
ambiguous
offline
```

Use the same sensor metric availability values everywhere:

```text
available
unavailable
offline
not_required
```

## Shared Visual Language

Status colors:

- Generic baseline: blue.
- Sensor adjusted or healthy: green.
- Ready soon: amber.
- Feedback needed: orange.
- Completed: gray.

Core shadcn/ui usage:

- Forms use shadcn `Form`, `Input`, `Select`, `Button`.
- Dialogs use shadcn `Dialog`.
- Side panels use shadcn `Drawer`.
- Data summaries use shadcn `Card`, `Badge`, `Progress`.
- Lists and dense data use shadcn `Table`.
- Loading states use shadcn `Skeleton`.

## Minimum Demo Path

The app is demo-ready when this path works:

1. Open `/dashboard`.
2. Click "Add Crop".
3. Create a new lettuce crop and assign a sensor group.
4. Land on the new crop detail page.
5. See generic estimate, predicted harvest date, confidence, and sensor data.
6. Open `/calendar` and see the crop.
7. Open seeded spinach crop with `feedback_needed` status.
8. Submit feedback.
9. Open `/learning`.
10. See updated learning stats.
11. Reset demo data and confirm seed state returns.

Optional extended demo:

1. Add a custom plant not in the preset catalog.
2. Enter a generic maturity estimate.
3. Assign an available sensor group.
4. Show that the crop starts as baseline and appears in Learning after feedback.

## Minimum Components

Build these before polishing:

- `AppShell`
- `PageHeader`
- `CropCard`
- `PredictionBadge`
- `ConfidenceMeter`
- `HarvestWindow`
- `SensorMetricCard`
- `SensorTrendChart`
- `SensorAssignmentCard`
- `FeedbackModal`
- `LearningModelCard`

## Final Acceptance Criteria

- Every route renders.
- Navigation works across all pages.
- Mock API is isolated from UI.
- TanStack Query handles all reads and writes.
- shadcn/ui components provide the base UI.
- Tailwind controls layout and domain-specific styling.
- Custom plants can be created and reused.
- Farm locations can be created and reused.
- Crops can be edited, archived, cancelled, or marked failed.
- `Not ready yet` feedback keeps a crop active and schedules another check.
- Demo reset restores seed data.
- Sensor readings can be traced to a crop through explicit assignment.
- The demo user journey works in under 5 minutes.
