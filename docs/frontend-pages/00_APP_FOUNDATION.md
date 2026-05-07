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
Dashboard -> /dashboard
Calendar -> /calendar
Crops -> /crops
Sensors -> /sensors
Learning -> /learning
```

Use Lucide icons:

- Dashboard: `LayoutDashboard`
- Calendar: `CalendarDays`
- Crops: `Sprout`
- Sensors: `RadioTower` or `Activity`
- Learning: `BrainCircuit` or `TrendingUp`

Navigation rules:

- Highlight the active route.
- Keep "Add Crop" visible as a primary action in the top nav or dashboard header.
- Page transitions should not reset all mock state because TanStack Query and local storage should hold the app together.

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
- `CreateCropBatchInput`
- `FarmLocation`
- `PlantProfile`
- `SensorDevice`
- `SensorGroup`
- `SensorReading`
- `HarvestPrediction`
- `HarvestFeedback`
- `SubmitHarvestFeedbackInput`
- `ModelLearningStats`

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
getCropBatch(batchId: string): Promise<CropBatch>
createCropBatch(input: CreateCropBatchInput): Promise<CropBatch>
updateCropBatch(input: UpdateCropBatchInput): Promise<CropBatch>
updateCropStatus(input: UpdateCropStatusInput): Promise<CropBatch>
getSensorDevices(): Promise<SensorDevice[]>
getSensorGroups(): Promise<SensorGroup[]>
assignSensorGroupToBatch(input: AssignSensorGroupInput): Promise<SensorGroup>
getSensorReadings(batchId: string): Promise<SensorReading[]>
getPrediction(batchId: string): Promise<HarvestPrediction>
submitHarvestFeedback(input: SubmitHarvestFeedbackInput): Promise<HarvestFeedback>
getModelLearningStats(): Promise<ModelLearningStats[]>
resetDemoData(): Promise<void>
```

Required query hooks:

```ts
useFarmLocations()
useCreateFarmLocation()
useUpdateFarmLocation()
usePlantProfiles()
useCreateCustomPlantProfile()
useUpdatePlantProfile()
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

Required query keys:

```ts
farmLocations: ["farm-locations"]
plantProfiles: ["plant-profiles"]
cropBatches: ["crop-batches"]
cropBatch: ["crop-batches", batchId]
sensorDevices: ["sensor-devices"]
sensorGroups: ["sensor-groups"]
sensorReadings: ["sensor-readings", batchId]
prediction: ["predictions", batchId]
learningStats: ["learning-stats"]
```

## Cache And Mutation Rules

`useCreateFarmLocation`:

- Calls `createFarmLocation`.
- Invalidates `farmLocations`.
- Invalidates location selectors on Add Crop and Sensors.

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
- Invalidates `learningStats` if new crop changes baseline model display.
- Navigates to `/crops/[batchId]` or shows a success screen with a "View crop" action.

`useUpdateCropBatch`:

- Calls `updateCropBatch`.
- Invalidates the crop batch, crop list, sensor readings, prediction, and calendar-derived views.

`useUpdateCropStatus`:

- Calls `updateCropStatus`.
- Used for archive, cancel, failed, and manual status changes.
- Invalidates crop batch, crop list, dashboard, calendar, and learning stats.

`useAssignSensorGroupToBatch`:

- Calls `assignSensorGroupToBatch`.
- Invalidates `sensorGroups`.
- Invalidates `sensorDevices`.
- Invalidates `cropBatch(batchId)`.
- Invalidates `cropBatches`.
- Invalidates `sensorReadings(batchId)`.
- Invalidates `prediction(batchId)`.

`useSubmitHarvestFeedback`:

- Calls `submitHarvestFeedback`.
- Invalidates `cropBatch(batchId)`.
- Invalidates `cropBatches`.
- Invalidates `prediction(batchId)`.
- Invalidates `learningStats`.
- Shows success toast or confirmation panel.

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

## Seed Demo Data

The mock API should start with these crop states:

- Butterhead Lettuce: growing well, prediction 2 days earlier, 76 percent confidence.
- Thai Basil: attention needed, low light, prediction 2 days later, 61 percent confidence.
- Spinach: feedback needed, high confidence, used for demo feedback flow.
- Kale: baseline estimate only, low confidence, new crop.

Seed plant profiles:

- Catalog profiles: Butterhead Lettuce, Thai Basil, Spinach, Kale.
- Custom profiles should be stored in local storage and returned by `usePlantProfiles`.

Seed sensor groups:

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

## Acceptance Criteria

- The app runs with `npm run dev`.
- `/` and every main route render inside the same shell.
- TanStack Query provider wraps all interactive pages.
- Mock API is the only source of domain data.
- shadcn/ui components are used for forms, dialogs, buttons, cards, tabs, and skeletons.
- User-created crops and feedback survive refresh through local storage.
- Custom plant profiles survive refresh through local storage.
- Farm locations survive refresh through local storage.
- Sensor group assignment survives refresh through local storage.
- Demo reset restores seed crop, plant, location, and sensor data.
