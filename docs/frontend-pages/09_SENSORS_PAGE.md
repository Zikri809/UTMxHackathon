# Sensors Page Build Spec

## Route And File

Route:

```text
/sensors
```

Next.js file:

```text
src/app/sensors/page.tsx
```

Recommended page component:

```text
src/components/sensors/sensors-page.tsx
```

## Purpose

The Sensors page explains and manages how sensor readings are connected to crop batches. The system should not imply that sensors automatically know which plant they belong to. Instead, readings are linked through explicit sensor devices, sensor groups, rack and zone placement, and optional crop batch assignment.

## Primary User Questions

- Which sensors are online?
- Where is each sensor physically located?
- Which crop batch is each sensor group assigned to?
- Are any readings ambiguous because multiple crops share the same rack or zone?
- Are any crops missing sensor assignment?
- Are any required sensor types missing for a crop?
- What if a rack or zone is not listed yet?

## Data Dependencies

Use TanStack Query hooks:

```ts
const sensorDevices = useSensorDevices();
const sensorGroups = useSensorGroups();
const cropBatches = useCropBatches();
const farmLocations = useFarmLocations();
const createFarmLocation = useCreateFarmLocation();
const updateFarmLocation = useUpdateFarmLocation();
const assignSensorGroup = useAssignSensorGroupToBatch();
```

Derived data:

- Assigned sensor groups.
- Unassigned sensor groups.
- Offline sensor devices.
- Crop batches without sensor assignment.
- Ambiguous rack/zone matches.
- Missing sensor types per crop.
- Farm locations without sensor groups.

## Sensor Ownership Model

The frontend should use this rule:

```text
batchId assignment > sensorGroup assignment > rack/zone fallback
```

Meaning:

1. If a sensor group has `assignedBatchId`, its readings belong to that crop batch.
2. If a crop has `sensorGroupId`, readings from that group belong to the crop.
3. If no direct assignment exists, the mock API can match readings by rack and zone.
4. If more than one active crop shares the same rack and zone, fallback is ambiguous and the UI must ask for assignment.

## Page Layout

Recommended structure:

```text
PageHeader
  title: Sensors
  subtitle: Device placement and crop assignment

Top summary row
  Online Devices
  Assigned Groups
  Unassigned Groups
  Crops Missing Sensors
  Missing Sensor Types

Main content
  Farm Location Table
  Sensor Group Table
  Sensor Device Table

Side panel or dialog
  Assign sensor group to crop batch
```

## Components To Build

- `SensorAssignmentCard`
- `SensorGroupTable`
- `SensorDeviceTable`
- `AssignSensorDialog`
- `FarmLocationSelector`
- `FarmLocationTable`
- `SensorStatusBadge`
- shadcn `Card`
- shadcn `Badge`
- shadcn `Table`
- shadcn `Dialog`
- shadcn `Select`
- shadcn `Button`
- shadcn `Alert`
- shadcn `Skeleton`

## Farm Location Table

Columns:

- Location label.
- Rack.
- Zone.
- Sensor group count.
- Active crop count.
- Status.
- Actions.

Actions:

- Add rack/zone.
- Edit location.
- View matching sensor groups.

Users should be able to create a missing rack or zone here, then use it in Add Crop and sensor assignment flows.

Editing a location should call `useUpdateFarmLocation` and refresh affected crop, sensor group, and sensor device displays.

## Sensor Group Table

Columns:

- Group name.
- Rack.
- Zone.
- Sensor count.
- Sensor types.
- Missing sensor types for assigned crop.
- Assigned crop batch.
- Assignment status.
- Actions.

Actions:

- Assign to crop.
- Change assignment.
- View crop if assigned.

Assignment status:

- Assigned.
- Unassigned.
- Ambiguous fallback.
- Offline devices.
- Missing required sensor type.

## Sensor Device Table

Columns:

- Device name.
- Sensor types.
- Rack.
- Zone.
- Group.
- Status.
- Assigned crop.

Sensor status:

- Online.
- Offline.
- Maintenance.

Missing sensor type behavior:

- Show missing metrics as `Unavailable`, not as broken charts.
- If a crop lacks pH, EC, light, or other expected readings, show which sensor type is missing.
- Explain that the prediction can still run, but confidence may be lower.

## Assign Sensor Dialog

The dialog should allow the user to assign a sensor group to an active crop batch.

Fields:

- Sensor group.
- Crop batch.

Helpful display:

- Show crop plant name, rack, zone, and status.
- Highlight matching rack/zone crops.
- Warn if assigning a group to a crop in a different rack/zone.
- Warn if the sensor group does not include expected sensor types for the crop.

On submit:

- Call `useAssignSensorGroupToBatch`.
- Invalidate sensor groups, sensor devices, crop batch, crop list, sensor readings, and prediction.
- Show success toast.

## Missing Sensor Assignment Panel

Show crop batches where:

- `sensorGroupId` is missing, or
- assigned sensor group is offline, or
- rack/zone fallback is ambiguous.

Each item should have:

- Crop name.
- Rack and zone.
- Current prediction confidence.
- "Assign sensors" action.

## Loading State

Use skeletons for:

- Summary cards.
- Sensor group table rows.
- Sensor device table rows.

## Empty State

If no sensor devices exist:

```text
No sensor devices are registered in the mock farm.
```

For the PoC, this should not happen with seed data, but the state should exist.

## Error State

Use shadcn `Alert` with retry.

## Acceptance Criteria

- Sensors page loads sensor devices, sensor groups, and crop batches through TanStack Query.
- Sensors page loads and can create farm locations through TanStack Query.
- User can edit farm locations without breaking existing crop and sensor displays.
- User can see which sensor group belongs to which crop.
- User can assign or change a sensor group assignment.
- Ambiguous rack/zone fallback is called out clearly.
- Missing sensor types are called out clearly.
- Crop Detail can explain sensor readings using the same assignment model.
- Assignment changes affect prediction and sensor readings after query invalidation.
