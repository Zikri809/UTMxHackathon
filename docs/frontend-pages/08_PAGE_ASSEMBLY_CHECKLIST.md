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

Visible navigation labels:

```text
/dashboard -> Today
/calendar -> Harvest Plan
/crops -> Crops
/sensors -> Devices & Locations
/learning -> Improvements
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
useCropBatchSummaries()
useCropBatch(batchId)
useCreateCropBatch()
useCreateCropBatchWithDependencies()
useUpdateCropBatch()
useUpdateCropStatus()
useSensorDevices()
useSensorGroups()
useAssignSensorGroupToBatch()
useSensorReadings(batchId)
useHarvestPrediction(batchId)
useHarvestFeedback(batchId)
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
- plant, location, and sensor selectors if dependencies were created inline

Editing a crop from `/crops/[batchId]` must update:

- `/dashboard`
- `/calendar`
- `/crops`
- current `/crops/[batchId]`
- condition readings and harvest estimate if location or device connection changes

Creating a custom plant from `/crops/new` must update:

- plant selector options
- `/learning`
- future crop creation estimates

Connecting a device group must update:

- `/sensors`
- `/crops/[batchId]`
- `/dashboard`
- `/calendar`
- `/crops`
- harvest estimate and condition readings for that crop
- previous connected crop if the device group was reconnected

Creating or editing a farm location must update:

- Add Crop location selector
- `/sensors`
- affected crop and device connection displays

Recording a harvest result from `/crops/[batchId]` must update:

- `/dashboard`
- `/calendar`
- `/crops`
- `/learning`
- current `/crops/[batchId]`
- crop harvest-check history
- crop timeline event display

Resetting demo data must update:

- every route
- all query caches
- local storage-backed seed state

## Shared Status Labels

Use the same lifecycle status values everywhere:

```text
growing
ready_soon
feedback_needed
completed
cancelled
failed
archived
```

Use these values only for lifecycle. Do not add `attention_needed`, `growing_well`, `generic_baseline`, or `check_again_scheduled` to `CropBatch.status`.

Use the same crop health values everywhere:

```text
healthy
watch
attention
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

Use the same device connection values everywhere:

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

Use the same feedback state values everywhere:

```text
not_requested
awaiting_feedback
submitted
check_again_scheduled
```

Derived-state ownership:

- Lifecycle dates, health, feedback state, assignment state, missing sensor types, and status priority must come from shared selectors.
- Terminal statuses `completed`, `cancelled`, `failed`, and `archived` always override date-derived active states.
- `check_again_scheduled` means feedback metadata has a future `nextReviewAt`; lifecycle remains `growing`.
- `attention` means sensor, confidence, or assignment state needs review; lifecycle remains whatever the crop's actual lifecycle state is.

## Shared Deep Links

Use these route contracts for cross-page actions:

```text
Record harvest result -> /crops/[batchId]?tab=feedback
Connect devices -> /sensors?action=assign&batchId=[batchId]&returnTo=[encoded-route]
View device connection -> /sensors?batchId=[batchId]
Calendar focus -> /calendar?batchId=[batchId]
Improvements plant focus -> /learning?plantProfileId=[plantProfileId]
```

All pages that expose harvest-check or device-connection CTAs must preserve crop context with these links.

## Shared Visual Language

Status colors:

- Starter estimate: blue.
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

## Shared User-Facing Language

Use plain operational labels in visible UI:

```text
harvest estimate, not prediction
expected ready date, not predicted harvest date
ready window, not harvest window when shown to users
reliability, not confidence
starter estimate, not generic baseline
updated from conditions, not sensor adjusted
device group, not sensor group
connect devices, not assign sensors
harvest check, not feedback
improvements, not model learning
```

Do not show these words in normal UI:

```text
ML
machine learning
mock API
TanStack Query
mutation
query invalidation
sensor provenance
generic_baseline
model maturity
```

## Minimum Demo Path

The app is demo-ready when this path works:

1. Open `/dashboard`.
2. Click "Add Crop".
3. Create a new lettuce crop and connect a device group.
4. Land on the new crop detail page.
5. See starter estimate, expected ready date, reliability, and growing conditions.
6. Open `/calendar` and see the crop.
7. Open seeded spinach crop with `feedback_needed` status.
8. Record harvest result.
9. Open `/learning`.
10. See updated improvement stats.
11. Reset demo data and confirm seed state returns.

Optional extended demo:

1. Add a custom plant not in the preset catalog.
2. Enter typical days to ready.
3. Connect an available device group.
4. Show that the crop starts with a starter estimate and appears in Improvements after a harvest check.

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
- `Not ready yet` harvest check keeps a crop active and schedules another check.
- Demo reset restores seed data.
- Condition readings can be traced to a crop through explicit device connection.
- The demo user journey works in under 5 minutes.
- The demo user journey can be understood without explaining ML, backend mocking, query hooks, or device connection internals.
- Every warning tells the user what to do next in plain language.
