# Coherence Review And Flow Contracts

## Purpose

This document records the senior-review iteration across all frontend page specs. It resolves the main gaps found by the review council so implementation can proceed as one coherent frontend-only system with mocked backend services that can later be replaced by real API clients.

## Architecture Decision

The app remains frontend-only for the hackathon phase.

All domain reads and writes must follow this boundary:

```text
Page or component -> TanStack Query hook -> mock API command -> storage adapter or seed data
```

The mock API should be shaped like a real backend client:

- Return promises with small deterministic delays.
- Normalize responses before UI code sees them.
- Own multi-entity writes such as crop creation, feedback submission, and sensor assignment.
- Store demo writes through a storage adapter, not directly from UI components.
- Keep seed data immutable and layer local storage changes over it.
- Expose reset as a mock API command that clears demo writes and invalidates all query keys.

## Shared Domain Decisions

### Lifecycle Status Versus Derived Alerts

Use `CropBatch.status` only for lifecycle:

```text
growing
ready_soon
feedback_needed
completed
cancelled
failed
archived
```

Do not add `attention_needed`, `growing_well`, or `check_again_scheduled` as lifecycle statuses.

Represent those as derived display state:

```ts
type CropHealthState = "healthy" | "watch" | "attention";
type FeedbackState = "not_requested" | "awaiting_feedback" | "submitted" | "check_again_scheduled";
```

Rules:

- `attention` comes from sensor readings, missing sensors, low confidence, or negative prediction factors.
- `check_again_scheduled` comes from feedback metadata while the crop lifecycle remains `growing`.
- `ready_soon` and `feedback_needed` may be derived from dates for active crops, but terminal states always win.
- Cancelled, failed, and archived crops stay hidden from Dashboard and Calendar defaults.

### Prediction Summary For List Pages

Dashboard, Calendar, and Crops must not run one full prediction query per row.

Add a list-level summary contract:

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
  predictionMode: "generic_baseline" | "sensor_adjusted" | "learned";
  modelMaturity: "baseline" | "learning" | "adaptive";
};

type CropBatchSummary = CropBatch & {
  predictionSummary: PredictionSummary;
  sensorAssignmentState: SensorAssignmentState;
  cropHealthState: CropHealthState;
  feedbackState: FeedbackState;
};
```

Preferred API shape:

```ts
getCropBatchSummaries(): Promise<CropBatchSummary[]>
useCropBatchSummaries()
```

Keep `getPrediction(batchId)` and `useHarvestPrediction(batchId)` for Crop Detail, where full contributing factors and explanations are needed.

### Sensor Assignment Is Atomic

Sensor assignment has two visible references:

- `CropBatch.sensorGroupId`
- `SensorGroup.assignedBatchId`

The UI must never update one without the other.

Use one command:

```ts
assignSensorGroupToBatch(input: AssignSensorGroupInput): Promise<AssignSensorGroupResult>
```

Result:

```ts
type AssignSensorGroupResult = {
  cropBatch: CropBatch;
  sensorGroup: SensorGroup;
  previousAssignedBatchId?: string;
  unassignedSensorGroupIds: string[];
};
```

Rules:

- A sensor group can belong to only one active crop batch at a time.
- Reassigning a group requires a confirmation when it is already assigned.
- Reassignment unsets the previous crop batch's `sensorGroupId`.
- Assignment uses `farmLocationId` as the stable location link where available.
- Rack and zone are display fields and fallback labels, not the primary identity.

### Feedback Submission Is Atomic

Feedback mutates more than feedback history. It can update crop status, prediction, learning stats, and timeline events.

Use one command:

```ts
submitHarvestFeedback(input: SubmitHarvestFeedbackInput): Promise<SubmitHarvestFeedbackResult>
```

Result:

```ts
type SubmitHarvestFeedbackResult = {
  feedback: HarvestFeedback;
  cropBatch: CropBatch;
  prediction: HarvestPrediction;
  learningStats: ModelLearningStats[];
  timelineEvent: CropTimelineEvent;
};
```

Rules:

- `accurate`, `early`, and `late` complete the crop.
- `not_ready` keeps the crop active, schedules `nextReviewAt`, shifts prediction later, and sets feedback state to `check_again_scheduled`.
- Learning stats count only completed crops with valid feedback.
- Failed and cancelled crops do not train the model.

### Add Crop Multi-Step Writes

Add Crop may create a custom plant, create a farm location, and create a crop batch.

Implement it through one use-case command in the mock API layer:

```ts
createCropBatchWithDependencies(input: CreateCropBatchWithDependenciesInput): Promise<CreateCropBatchResult>
```

Rules:

- The command creates missing custom plant and location records before the crop.
- If crop creation fails, intermediate custom records are either rolled back or marked as draft and reused on retry.
- Retrying the same submitted form must not create duplicate custom plants or locations.
- Default success behavior is navigation to `/crops/[batchId]` with a toast.

### Shared Selectors

Put cross-page derived logic in shared selectors under `src/lib/domain/` or `src/lib/mock-api/selectors/`.

Required selectors:

```ts
getCropLifecycleState(crop, demoNow)
getCropHealthState(crop, prediction, readings, assignmentState)
getFeedbackState(crop, feedbackHistory, demoNow)
getSensorAssignmentState(crop, sensorGroups, sensorDevices)
getMissingSensorTypes(crop, plantProfile, sensorGroup, sensorDevices)
getHarvestWindowSummary(cropOrPrediction)
getStatusPriority(cropSummary)
```

Every page should use these selectors directly or consume data already normalized by the mock API through these selectors.

## Cross-Page Navigation Contracts

Use deep links for intent-preserving flows.

```text
Add Crop -> /crops/new
Crop Detail -> /crops/[batchId]
Record harvest result -> /crops/[batchId]?tab=feedback
Connect devices -> /sensors?action=assign&batchId=[batchId]&returnTo=[encoded-route]
View device connection -> /sensors?batchId=[batchId]
View Calendar Crop -> /calendar?batchId=[batchId]
View Improvements Plant -> /learning?plantProfileId=[plantProfileId]
```

Rules:

- All visible "Record harvest result" CTAs route to `/crops/[batchId]?tab=feedback`.
- Crop Detail opens the Harvest Check tab automatically when `tab=feedback`.
- All visible "Connect devices" CTAs route to `/sensors?action=assign&batchId=...`.
- Devices & Locations preselects the crop and opens the connect-devices dialog when `action=assign`.
- After connection, Devices & Locations navigates back to `returnTo` if present.

## User-Facing Labels

Routes and implementation names can remain stable. Visible labels should follow the user-friendly product plan:

```text
/dashboard -> Today
/calendar -> Harvest Plan
/sensors -> Devices & Locations
/learning -> Improvements
```

Visible action labels:

```text
Submit feedback -> Record harvest result
Assign sensors -> Connect devices
Prediction -> Harvest estimate
Confidence -> Reliability
Generic baseline -> Starter estimate
Sensor group -> Device group
```

The UI should not expose mock API, TanStack Query, ML, mutation, invalidation, sensor provenance, or prediction-mode vocabulary.

## Page-By-Page Coherence Notes

### Root

Use `redirect("/dashboard")` as the default implementation. Only render dashboard content at `/` if deployment requires it, and force Dashboard active navigation in that alias case.

### Dashboard

Dashboard consumes `useCropBatchSummaries`, `useSensorGroups`, and `useModelLearningStats`.

It should show active work only by default:

- Active crop lifecycle states.
- Health attention derived from sensor and prediction state.
- Feedback and check-again counts from `FeedbackState`.
- Device connection CTAs using the standard Devices & Locations deep link.

### Crops List

Crops is the inventory surface.

Default row actions:

- View.
- Connect devices when missing or needs review.
- Record harvest result when a harvest check is needed.
- More menu for Edit, Archive, Cancel, and Mark failed with confirmation dialogs.

Lifecycle-changing actions must call `useUpdateCropStatus` and show confirmations.

### Add Crop

Plant profiles, farm locations, device groups, and devices are required page data, even if device connection is optional.

Device connection is optional but recommended:

- If no devices are connected, create the crop with starter estimate reliability.
- Show a warning and a post-create "Connect devices" CTA.
- The crop remains visible on Dashboard, Calendar, and Crops with `sensorAssignmentState: "missing"`.

### Crop Detail

Crop Detail is the canonical place for harvest checks and detailed estimate explanation.

Missing or needs-review device connection must not dead-end:

- Show connection warning.
- Route to `/sensors?action=assign&batchId=[batchId]&returnTo=/crops/[batchId]`.

Settings can edit crop fields, but device reconnection should use the same Devices & Locations flow unless a local connection dialog is implemented.

### Calendar

Calendar consumes `useCropBatchSummaries`, not full prediction queries per crop row.

Calendar drawer actions:

- View details -> `/crops/[batchId]`
- Record harvest result -> `/crops/[batchId]?tab=feedback`
- Connect devices -> `/sensors?action=assign&batchId=[batchId]&returnTo=/calendar`

### Learning

Improvements consumes `useModelLearningStats`, with optional harvest check history and crop summaries.

Navigation:

- Add crop for starter/custom plant -> `/crops/new`
- Open recent harvest-check crop -> `/crops/[batchId]?tab=feedback`
- Filter to a plant via `/learning?plantProfileId=[plantProfileId]`

Custom profile editing must use `useUpdatePlantProfile`, validate maturity days and ideal ranges, and invalidate plant profiles, affected summaries, predictions, and learning stats.

### Devices & Locations

Devices & Locations owns connection and location/device-placement clarity.

It must support:

- `batchId` query param to highlight a crop's connection state.
- `action=assign` to open device connection directly.
- `returnTo` to send users back after a successful assignment.

New farm locations can exist without device groups. Display them as placement-only until a device group is moved or created for that location.

For the PoC, device group creation is optional. If not implemented, clearly show that no group exists for the new location and route users back to crop creation with "No devices connected yet" available.

## Demo Path After Iteration

Primary demo path:

```text
/dashboard
-> /crops/new
-> /crops/[batchId]
-> /sensors?batchId=[batchId]
-> /calendar?batchId=[batchId]
-> /crops/[seeded-spinach-id]?tab=feedback
-> /learning?plantProfileId=[spinach-profile-id]
```

The Devices & Locations stop is now a concrete verification step: it shows how the new crop is connected to a device group, or opens connection if the crop was created without devices.
