# App Foundation Build Spec

## Route And Files

This spec supports the whole frontend rather than one visible page.

Next.js files:

```text
src/app/layout.tsx
src/app/providers.tsx
src/app/globals.css
src/app/sensors/page.tsx
src/components/layout/app-shell.tsx
src/components/layout/sidebar-nav.tsx
src/components/layout/top-nav.tsx
src/lib/query/client.ts
src/lib/query/keys.ts
src/lib/query/hooks.ts
src/lib/domain/selectors.ts
src/lib/mock-api/
src/lib/mock-ml/
src/types/
```

## Purpose

Create the shared structure that allows every page to work together as a single frontend app. This includes routing, navigation, TanStack Query, shadcn/ui setup, Tailwind tokens, mock API boundaries, shared domain types, custom plant profiles, and sensor-to-crop assignment.

## Required Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- Recharts
- Lucide React
- date-fns
- local storage for mocked persistence

## Layout Behavior

The app should open directly into the product experience. Do not build a marketing landing page.

Default behavior:

- `/` redirects to `/dashboard`, or renders the same dashboard content.
- All main routes use `AppShell`.
- `AppShell` contains `SidebarNav`, `TopNav`, and a main content area.
- Desktop uses a fixed sidebar.
- Mobile uses a top bar with a drawer menu.
- Main content width should support dense dashboard layouts without feeling stretched.

## Global Navigation

Navigation items:

```text
Today -> /dashboard
Harvest Plan -> /calendar
Crops -> /crops
Devices & Locations -> /sensors
Improvements -> /learning
```

Use Lucide icons:

- Today: `LayoutDashboard`
- Harvest Plan: `CalendarDays`
- Crops: `Sprout`
- Devices & Locations: `RadioTower` or `Activity`
- Improvements: `TrendingUp`

Navigation rules:

- Highlight the active route.
- Keep "Add Crop" visible as a primary action in the top nav or dashboard header.
- Page transitions should not reset all mock state because TanStack Query and local storage should hold the app together.

## User-Facing Language Rules

Implementation docs can use technical terms. Visible product copy should use grower-friendly wording:

```text
prediction -> harvest estimate
predicted harvest date -> expected ready date
harvest window -> ready window
confidence -> reliability
generic baseline -> starter estimate
sensor adjusted -> updated from conditions
sensor group -> device group
sensor assignment -> connect devices
feedback -> harvest check
model learning -> improvements
```

Do not show these terms in normal UI copy:

- mocked API
- TanStack Query
- mutation
- invalidation
- ML
- machine learning
- sensor provenance
- generic_baseline
- model maturity

Technical detail can appear in developer docs and comments. Product screens should lead with what the grower can do next.

## Providers

`src/app/providers.tsx` should be a client component.

Responsibilities:

- Create `QueryClient`.
- Wrap app with `QueryClientProvider`.
- Configure default query behavior.
- Include shadcn/toast provider if using `sonner`.

Suggested defaults:

```ts
queries: {
  staleTime: 30_000,
  refetchOnWindowFocus: false,
  retry: 1
}
```

## Domain Types

Create shared types:

```text
src/types/location.ts
src/types/crop.ts
src/types/plant.ts
src/types/sensor.ts
src/types/prediction.ts
src/types/feedback.ts
src/types/learning.ts
```

Core types:

- `CropBatch`
- `CropBatchSummary`
- `CreateCropBatchInput`
- `CreateCropBatchWithDependenciesInput`
- `FarmLocation`
- `PlantProfile`
- `SensorDevice`
- `SensorGroup`
- `SensorReading`
- `HarvestPrediction`
- `PredictionSummary`
- `HarvestFeedback`
- `SubmitHarvestFeedbackInput`
- `SubmitHarvestFeedbackResult`
- `ModelLearningStats`

Shared derived state types:

```ts
type CropHealthState = "healthy" | "watch" | "attention";
type FeedbackState = "not_requested" | "awaiting_feedback" | "submitted" | "check_again_scheduled";
type SensorAssignmentState = "assigned" | "missing" | "ambiguous" | "offline";
type PredictionMode = "generic_baseline" | "sensor_adjusted" | "learned";
type ModelMaturity = "baseline" | "learning" | "adaptive";
```

Use `CropBatch.status` only for lifecycle state. Do not store `attention_needed`, `growing_well`, `generic_baseline`, or `check_again_scheduled` as crop statuses. Those are derived display states from sensor health, prediction mode, and feedback metadata.

List pages should use a normalized summary type so they do not run one full prediction query per crop:

```ts
type PredictionSummary = {
  batchId: string;
  genericHarvestDate: string;
  predictedHarvestDate: string;
  predictedHarvestWindow: {
    start: string;
    end: string;
  };
  confidence: number;
  shiftDays: number;
  predictionMode: PredictionMode;
  modelMaturity: ModelMaturity;
};

type CropBatchSummary = CropBatch & {
  predictionSummary: PredictionSummary;
  sensorAssignmentState: SensorAssignmentState;
  cropHealthState: CropHealthState;
  feedbackState: FeedbackState;
};
```

Farm location identity:

- `farmLocationId` is the stable relationship between crops, sensor groups, and sensor devices.
- `rack` and `zone` remain display labels and fallback labels.
- Editing rack or zone labels must not break historical crop or sensor matching.

## Mock API Contract

All page data must be fetched through TanStack Query hooks. Pages and components should not import seed data directly.

Required mock API functions:

```ts
getFarmLocations(): Promise<FarmLocation[]>
createFarmLocation(input: CreateFarmLocationInput): Promise<FarmLocation>
updateFarmLocation(input: UpdateFarmLocationInput): Promise<FarmLocation>
getPlantProfiles(): Promise<PlantProfile[]>
createCustomPlantProfile(input: CreateCustomPlantProfileInput): Promise<PlantProfile>
updatePlantProfile(input: UpdatePlantProfileInput): Promise<PlantProfile>
getCropBatches(): Promise<CropBatch[]>
getCropBatchSummaries(): Promise<CropBatchSummary[]>
getCropBatch(batchId: string): Promise<CropBatch>
createCropBatch(input: CreateCropBatchInput): Promise<CropBatch>
createCropBatchWithDependencies(input: CreateCropBatchWithDependenciesInput): Promise<CreateCropBatchResult>
updateCropBatch(input: UpdateCropBatchInput): Promise<CropBatch>
updateCropStatus(input: UpdateCropStatusInput): Promise<CropBatch>
getSensorDevices(): Promise<SensorDevice[]>
getSensorGroups(): Promise<SensorGroup[]>
assignSensorGroupToBatch(input: AssignSensorGroupInput): Promise<AssignSensorGroupResult>
getSensorReadings(batchId: string): Promise<SensorReading[]>
getPrediction(batchId: string): Promise<HarvestPrediction>
getHarvestFeedback(batchId: string): Promise<HarvestFeedback[]>
submitHarvestFeedback(input: SubmitHarvestFeedbackInput): Promise<SubmitHarvestFeedbackResult>
getModelLearningStats(): Promise<ModelLearningStats[]>
resetDemoData(): Promise<void>
```

Multi-entity mock commands must be atomic from the UI's point of view:

- `createCropBatchWithDependencies` creates or reuses custom plant and farm location records, then creates the crop. Retrying the same form must not duplicate custom records.
- `assignSensorGroupToBatch` updates `CropBatch.sensorGroupId` and `SensorGroup.assignedBatchId` together and returns the updated crop, updated group, and previous assignment metadata.
- `submitHarvestFeedback` returns the saved feedback plus updated crop, prediction, learning stats, and timeline event.

Required query hooks:

```ts
useFarmLocations()
useCreateFarmLocation()
useUpdateFarmLocation()
usePlantProfiles()
useCreateCustomPlantProfile()
useUpdatePlantProfile()
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

Required query keys:

```ts
farmLocations: ["farm-locations"]
plantProfiles: ["plant-profiles"]
cropBatches: ["crop-batches"]
cropBatchSummaries: ["crop-batch-summaries"]
cropBatch: ["crop-batches", batchId]
sensorDevices: ["sensor-devices"]
sensorGroups: ["sensor-groups"]
sensorReadings: ["sensor-readings", batchId]
prediction: ["predictions", batchId]
harvestFeedback: ["harvest-feedback", batchId]
learningStats: ["learning-stats"]
```

## Cache And Mutation Rules

`useCreateFarmLocation`:

- Calls `createFarmLocation`.
- Invalidates `farmLocations`.
- Invalidates location selectors on Add Crop and Devices & Locations.

`useUpdateFarmLocation`:

- Calls `updateFarmLocation`.
- Invalidates `farmLocations`, `cropBatches`, `sensorGroups`, and `sensorDevices`.

`useCreateCustomPlantProfile`:

- Calls `createCustomPlantProfile`.
- Invalidates `plantProfiles`.
- Invalidates `learningStats`.
- Allows the Add Crop form to immediately select the new plant.

`useUpdatePlantProfile`:

- Calls `updatePlantProfile`.
- Invalidates `plantProfiles`, affected crop batches, affected predictions, and `learningStats`.

`useCreateCropBatch`:

- Calls `createCropBatch`.
- Invalidates `cropBatches`.
- Invalidates `cropBatchSummaries`.
- Invalidates `learningStats` if new crop changes baseline model display.
- Navigates to `/crops/[batchId]` and shows a success toast.

`useCreateCropBatchWithDependencies`:

- Calls `createCropBatchWithDependencies`.
- Creates or reuses custom plant and farm location records before crop creation.
- Avoids duplicate custom records on retry.
- Invalidates `plantProfiles`, `farmLocations`, `cropBatches`, `cropBatchSummaries`, `sensorGroups`, `sensorDevices`, and `learningStats`.
- Navigates to `/crops/[batchId]` and shows a success toast.

`useUpdateCropBatch`:

- Calls `updateCropBatch`.
- Invalidates the crop batch, crop list, crop summaries, sensor readings, prediction, and calendar-derived views.

`useUpdateCropStatus`:

- Calls `updateCropStatus`.
- Used for archive, cancel, failed, and manual status changes.
- Invalidates crop batch, crop list, crop summaries, dashboard, calendar, and learning stats.

`useAssignSensorGroupToBatch`:

- Calls `assignSensorGroupToBatch`.
- Treats assignment as an atomic update of the crop and sensor group.
- Invalidates `sensorGroups`.
- Invalidates `sensorDevices`.
- Invalidates `cropBatch(batchId)`.
- Invalidates `cropBatches`.
- Invalidates `cropBatchSummaries`.
- Invalidates `sensorReadings(batchId)`.
- Invalidates `prediction(batchId)`.

`useSubmitHarvestFeedback`:

- Calls `submitHarvestFeedback`.
- Invalidates `cropBatch(batchId)`.
- Invalidates `cropBatches`.
- Invalidates `cropBatchSummaries`.
- Invalidates `prediction(batchId)`.
- Invalidates `harvestFeedback(batchId)`.
- Invalidates `learningStats`.
- Shows success toast or confirmation panel.

## Shared Selectors

Create shared selectors under `src/lib/domain/selectors.ts` or equivalent:

```ts
getCropLifecycleState(crop, demoNow)
getCropHealthState(crop, prediction, readings, assignmentState)
getFeedbackState(crop, feedbackHistory, demoNow)
getSensorAssignmentState(crop, sensorGroups, sensorDevices)
getMissingSensorTypes(crop, plantProfile, sensorGroup, sensorDevices)
getHarvestWindowSummary(cropOrPrediction)
getStatusPriority(cropSummary)
```

Today, Harvest Plan, Crops, Crop Detail, Devices & Locations, and Improvements must use the same selectors directly or consume summaries generated from these selectors.

`useResetDemoData`:

- Calls `resetDemoData`.
- Clears local storage demo writes.
- Invalidates all query keys.

## shadcn/ui Components

Install and use at minimum:

```text
button
card
badge
dialog
drawer
form
input
select
tabs
table
calendar
popover
progress
skeleton
alert
separator
sonner
```

Keep shadcn components in:

```text
src/components/ui/
```

Domain components should wrap shadcn primitives instead of duplicating base controls.

## Shared Components

Build these early:

```text
AppShell
PageHeader
StatCard
CropCard
PredictionBadge
ConfidenceMeter
HarvestWindow
SensorMetricCard
SensorTrendChart
SensorAssignmentCard
InsightList
FeedbackModal
LearningModelCard
DemoResetDialog
FarmLocationSelector
```

Shared components should accept technical values but render plain labels by default. For example, `PredictionBadge` can receive `predictionMode: "generic_baseline"` but should display "Starter estimate" unless the component is in a developer/debug context.

## Seed Demo Data

The mock API should start with these crop lifecycle and display states:

- Butterhead Lettuce: lifecycle `growing`, health `healthy`, prediction 2 days earlier, 76 percent confidence.
- Thai Basil: lifecycle `growing`, health `attention`, low light, prediction 2 days later, 61 percent confidence.
- Spinach: lifecycle `feedback_needed`, high reliability, used for demo harvest-check flow.
- Kale: lifecycle `growing`, prediction mode `generic_baseline`, low confidence, new crop.

Seed plant profiles:

- Catalog profiles: Butterhead Lettuce, Thai Basil, Spinach, Kale.
- Custom profiles should be stored in local storage and returned by `usePlantProfiles`.

Seed device groups:

- Rack A / Zone 1: assigned to Butterhead Lettuce.
- Rack B / Zone 2: assigned to Thai Basil.
- Rack C / Zone 1: assigned to Spinach.
- Rack D / Zone 3: unassigned and available for new crops.

Seed farm locations:

- Rack A / Zone 1.
- Rack B / Zone 2.
- Rack C / Zone 1.
- Rack D / Zone 3.

## Visual Direction

Use an operational dashboard style:

- Light neutral background.
- Deep green primary action.
- Green for healthy.
- Amber for watch.
- Orange/red for attention.
- Blue for generic baseline.
- Gray for completed.

Avoid oversized hero sections. The first screen should be useful immediately.

Use progressive disclosure:

- First layer: what needs action.
- Second layer: one short reason.
- Third layer: details such as charts, device groups, exact readings, or estimate quality.

Avoid dense explanatory paragraphs in the main view.

## Acceptance Criteria

- The app runs with `npm run dev`.
- `/` and every main route render inside the same shell.
- TanStack Query provider wraps all interactive pages.
- Mock API is the only source of domain data.
- shadcn/ui components are used for forms, dialogs, buttons, cards, tabs, and skeletons.
- User-created crops and feedback survive refresh through local storage.
- Custom plant profiles survive refresh through local storage.
- Farm locations survive refresh through local storage.
- Device group connection survives refresh through local storage.
- Demo reset restores seed crop, plant, location, and sensor data.
