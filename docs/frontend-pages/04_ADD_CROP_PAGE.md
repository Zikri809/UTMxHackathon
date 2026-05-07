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

The add crop page starts the main product loop. It should let the user create a crop batch and immediately show a starter harvest estimate that can later improve from growing conditions and harvest checks.

It also handles two real-world cases that the PoC should make explicit:

- The plant may not exist in the preset catalog.
- The crop can be connected to the devices that track its growing location.

## Primary User Questions

- What plant am I adding?
- What if this plant is not in the preset list?
- Where is it growing?
- What if my rack or zone is not listed?
- Which devices will track this crop?
- When did I plant it?
- When does the app initially think it will be ready?
- What happens after this crop is created?

## Data Dependencies

Use TanStack Query mutations:

```ts
const createCropBatch = useCreateCropBatch();
const createCropBatchWithDependencies = useCreateCropBatchWithDependencies();
const createCustomPlantProfile = useCreateCustomPlantProfile();
const createFarmLocation = useCreateFarmLocation();
```

Required selector data:

```ts
const plantProfiles = usePlantProfiles();
const farmLocations = useFarmLocations();
const sensorGroups = useSensorGroups();
const sensorDevices = useSensorDevices();
```

Optional:

```ts
const learningStats = useModelLearningStats();
```

Use learning stats if the form wants to show whether a selected plant has baseline, learning, or adaptive model support.

In visible UI, translate that support into:

- `Starter estimate`
- `Getting better`
- `Highly reliable`

## User-Friendly UX Rules

- Present the form as a guided setup, not one long technical form.
- Recommended steps: What are you growing, Where is it growing, When did it start, How many plants, Connect devices, Review estimate.
- Make device connection optional and clearly explain the tradeoff.
- Collapse advanced plant ranges by default under `Advanced growing details`.
- Do not require users to know pH, EC, light, or temperature ranges to add a crop.
- Use `starter estimate`, `ready window`, and `reliability` instead of baseline, prediction, and confidence.

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
- Plant count.

Optional:

- Device group or assigned devices.
- Variety.
- Custom plant name.
- Custom plant typical days to ready.
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
- Custom plant requires a name and typical days to ready.
- Ideal growing ranges are optional but recommended.
- If ideal ranges are omitted, the app uses conservative defaults and starts with lower reliability.
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
- Device group matching should use the selected location.

## Components To Build

- `AddCropForm`
- `EstimatePreview`
- `ModelSupportBadge`
- `SensorAssignmentCard` rendered as `DeviceConnectionCard`
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
- Typical days to ready is required for custom plants and must be positive.
- Planting date is required and cannot be in the far future.
- Rack is required.
- Zone is required.
- Custom rack and zone are required only when using "Add new rack/zone".
- Device group is optional but recommended.
- If the user chooses "No devices connected yet", show a warning that estimates will stay mostly starter estimates and provide a post-create "Connect devices" CTA.
- Plant count must be a positive number.
- Notes should have a reasonable length limit.

Use client-side validation. A lightweight schema with Zod is recommended if installed with shadcn form patterns.

## Live Estimate Preview

Before submit, show a preview once plant type and planting date are selected.

Preview should include:

- Typical days to ready.
- Starter ready date.
- Ready window.
- Starting reliability.
- Estimate quality if known.
- Device connection status.

Example:

```text
Starter estimate: 30 days
Ready window: Jun 4 - Jun 8
Starting reliability: 48%
Estimate quality: Starter
Device group: Rack A / Zone 1
```

For custom plants:

```text
Custom plant profile
Starter estimate: 42 days
Estimate quality: Starter
Reliability note: Record harvest results to improve future dates.
```

## Device Connection UI

The form should make device connection clear without making the user understand technical ownership rules.

Recommended behavior:

- After rack and zone are selected, show matching device groups.
- If one matching unconnected group exists, preselect it.
- If multiple groups match, ask the user to choose one with plain location labels.
- If the selected group is already connected to another active crop, show a warning and explain which crop.
- Allow "No devices connected yet" for demo flexibility, but explain that estimates will remain mostly starter estimates.

The created crop should store:

- `farmLocationId`
- `sensorGroupId`
- `assignedSensorIds`
- `rack`
- `zone`

This lets `getSensorReadings(batchId)` resolve readings deterministically. Use `farmLocationId` for stable matching when available; keep rack and zone as display and fallback labels.

## Submit Behavior

On submit:

- Prefer calling `useCreateCropBatchWithDependencies` so custom plant creation, custom location creation, and crop creation behave as one use-case.
- If implementing the simpler separate hooks, create custom plant first, create custom location second, then call `useCreateCropBatch`.
- Retrying after a failed crop creation must not duplicate custom plants or locations.
- Disable submit button while pending.
- Show loading text like "Creating crop".
- Invalidate crop list through mutation hook.
- Navigate to crop detail after success.

Recommended behavior:

- Navigate to `/crops/[batchId]` after successful creation.
- Show toast: "Crop added with a starter harvest estimate."
- If the crop has no device connection, include a "Connect devices" action to `/sensors?action=assign&batchId=[batchId]&returnTo=/crops/[batchId]`.

## Page Data Loading States

Before the form is usable:

- Show skeleton controls while plant profiles, farm locations, device groups, or devices are loading.
- If plant profiles fail, show an error with retry because plant selection is required.
- If farm locations fail, show an error with retry because rack and zone selection are required.
- If device data fails, keep the form usable with "No devices connected yet" and show an inline warning that device connection can happen later.
- If no device groups exist for the selected location, allow "No devices connected yet" and link to `/sensors` after crop creation.

## Error State

Use shadcn `Alert` near the form:

```text
Could not add crop.
```

Allow retry.

## Acceptance Criteria

- User can create a crop batch through a form.
- User can add a custom plant when the plant is not in the preset list.
- Custom plant starts with a starter estimate and lower reliability.
- User can add a farm location when the rack or zone is not listed.
- User can connect a device group or choose no devices yet.
- Form uses shadcn components and Tailwind layout.
- Create operation goes through `useCreateCropBatch`.
- Custom plant creation goes through `useCreateCustomPlantProfile`.
- Custom location creation goes through `useCreateFarmLocation`.
- Query cache invalidates after creation.
- New crop appears on Dashboard, Calendar, and Crops list.
- User can reach the created crop detail page.
- Visible copy avoids ML, baseline, prediction-mode, and sensor-assignment jargon.
