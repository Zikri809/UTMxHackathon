# Add Crop Page Build Spec

## Route And File

Route:

```text
/crops/new
```

Next.js file:

```text
src/app/crops/new/page.tsx
```

Recommended page component:

```text
src/components/crops/add-crop-page.tsx
```

## Purpose

The add crop page starts the main product loop. It should let the user create a crop batch and immediately show a generic harvest estimate that can later improve from sensor data and feedback.

It also handles two real-world cases that the PoC should make explicit:

- The plant may not exist in the preset catalog.
- The crop must be linked to the sensor group or devices that will produce its readings.

## Primary User Questions

- What plant am I adding?
- What if this plant is not in the preset list?
- Where is it growing?
- What if my rack or zone is not listed?
- Which sensors will track this crop?
- When did I plant it?
- When does the app initially think it will be ready?
- What happens after this crop is created?

## Data Dependencies

Use TanStack Query mutation:

```ts
const createCropBatch = useCreateCropBatch();
const createCustomPlantProfile = useCreateCustomPlantProfile();
const createFarmLocation = useCreateFarmLocation();
```

Optional:

```ts
const plantProfiles = usePlantProfiles();
const farmLocations = useFarmLocations();
const sensorGroups = useSensorGroups();
const sensorDevices = useSensorDevices();
const learningStats = useModelLearningStats();
```

Use learning stats if the form wants to show whether a selected plant has baseline, learning, or adaptive model support.

## Page Layout

Recommended structure:

```text
PageHeader
  title: Add Crop
  back action: Crops

Two-column layout
  Left: AddCropForm
  Right: Live Estimate Preview

After submit
  Success state with created batch estimate
```

Mobile:

- Form first.
- Estimate preview below form.

## Form Fields

Required:

- Plant type.
- Planting date.
- Growing method.
- Rack.
- Zone.
- Sensor group or assigned sensor devices.
- Plant count.

Optional:

- Variety.
- Custom plant name.
- Custom plant generic maturity days.
- Custom plant ideal temperature range.
- Custom plant ideal pH range.
- Custom plant ideal EC range.
- Custom plant ideal light hours.
- Custom rack name.
- Custom zone name.
- Notes.

Plant type options for demo:

- Butterhead Lettuce.
- Thai Basil.
- Spinach.
- Kale.

Plant selector behavior:

- Include "Add custom plant" at the bottom of the plant selector.
- When selected, reveal custom plant fields.
- Custom plant requires a name and generic maturity days.
- Ideal growing ranges are optional but recommended.
- If ideal ranges are omitted, the mock model uses conservative defaults and starts with lower confidence.
- After submit, the custom plant profile is saved and appears as a selectable plant in future sessions.

Growing method options:

- Hydroponic.
- Soil.
- Aeroponic.

Location selector behavior:

- Show existing farm locations from `useFarmLocations`.
- Include "Add new rack/zone" when the location is not listed.
- Creating a new location should call `useCreateFarmLocation`.
- New locations should be immediately selectable without leaving the form.
- Sensor group matching should use the selected location.

## Components To Build

- `AddCropForm`
- `EstimatePreview`
- `ModelSupportBadge`
- `SensorAssignmentCard`
- `FarmLocationSelector`
- `HarvestWindow`
- shadcn `Form`
- shadcn `Input`
- shadcn `Select`
- shadcn `Calendar`
- shadcn `Popover`
- shadcn `Button`
- shadcn `Card`
- shadcn `Alert`

## Validation Rules

- Plant type is required.
- Custom plant name is required only when using "Add custom plant".
- Custom maturity days is required for custom plants and must be positive.
- Planting date is required and cannot be in the far future.
- Rack is required.
- Zone is required.
- Custom rack and zone are required only when using "Add new rack/zone".
- Sensor group is required unless the user explicitly chooses "No sensor assigned yet".
- Plant count must be a positive number.
- Notes should have a reasonable length limit.

Use client-side validation. A lightweight schema with Zod is recommended if installed with shadcn form patterns.

## Live Estimate Preview

Before submit, show a preview once plant type and planting date are selected.

Preview should include:

- Generic maturity range.
- Generic harvest date.
- Expected harvest window.
- Initial confidence.
- Model maturity level if known.
- Sensor assignment status.

Example:

```text
Generic estimate: 30 days
Expected harvest window: Jun 4 - Jun 8
Starting confidence: 48%
Model mode: Baseline
Sensor group: Rack A / Zone 1
```

For custom plants:

```text
Custom plant profile
Generic estimate: 42 days
Model mode: Baseline
Confidence note: Lower confidence until harvest feedback is collected.
```

## Sensor Assignment UI

The form should make sensor ownership explicit.

Recommended behavior:

- After rack and zone are selected, show matching sensor groups.
- If one matching unassigned group exists, preselect it.
- If multiple groups match, require the user to choose one.
- If the selected group is already assigned to another active crop, show a warning.
- Allow "No sensor assigned yet" for demo flexibility, but explain that predictions will remain mostly generic.

The created crop should store:

- `sensorGroupId`
- `assignedSensorIds`
- `rack`
- `zone`

This lets `getSensorReadings(batchId)` resolve readings deterministically.

## Submit Behavior

On submit:

- If custom plant is selected, call `useCreateCustomPlantProfile` first.
- If custom location is selected, call `useCreateFarmLocation` before creating the crop.
- Call `useCreateCropBatch`.
- Disable submit button while pending.
- Show loading text like "Creating crop".
- Invalidate crop list through mutation hook.
- Show success state or navigate to crop detail.

Recommended behavior:

- Navigate to `/crops/[batchId]` after successful creation.
- Show toast: "Crop batch created with a generic harvest estimate."

## Error State

Use shadcn `Alert` near the form:

```text
Could not create crop batch.
```

Allow retry.

## Acceptance Criteria

- User can create a crop batch through a form.
- User can add a custom plant when the plant is not in the preset list.
- Custom plant starts with a baseline estimate and lower confidence.
- User can add a farm location when the rack or zone is not listed.
- User can assign a sensor group or choose no sensor yet.
- Form uses shadcn components and Tailwind layout.
- Create operation goes through `useCreateCropBatch`.
- Custom plant creation goes through `useCreateCustomPlantProfile`.
- Custom location creation goes through `useCreateFarmLocation`.
- Query cache invalidates after creation.
- New crop appears on Dashboard, Calendar, and Crops list.
- User can reach the created crop detail page.
