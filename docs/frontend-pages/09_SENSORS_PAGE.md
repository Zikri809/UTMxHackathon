# Sensors / Devices & Locations Page Build Spec

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

The Devices & Locations page explains and manages which devices are connected to which crops and growing locations. The system should not imply that devices automatically know which plant they belong to.

In the UI, label this page `Devices & Locations`. It should feel like equipment placement and crop connection, not an IoT administration console.

## Primary User Questions

- Which devices are online?
- Where is each device physically located?
- Which crop is each device group connected to?
- Do any crops need device connection review?
- Are any crops missing expected condition readings?
- What if a rack or zone is not listed yet?

## User-Friendly UX Rules

- Use `Devices & Locations` as the visible page title.
- Use `Device group` instead of sensor group.
- Use `Connect devices` instead of assign sensors.
- Use `Needs review` instead of ambiguous fallback.
- Use `Not tracked` instead of unavailable sensor type.
- Keep the matching rule out of the first view; show it only under "Why this crop uses these readings".

## Data Dependencies

Use TanStack Query hooks:

```ts
const sensorDevices = useSensorDevices();
const sensorGroups = useSensorGroups();
const cropSummaries = useCropBatchSummaries();
const farmLocations = useFarmLocations();
const createFarmLocation = useCreateFarmLocation();
const updateFarmLocation = useUpdateFarmLocation();
const assignSensorGroup = useAssignSensorGroupToBatch();
```

Derived data:

- Connected device groups.
- Unconnected device groups.
- Offline devices.
- Crop batches without device connection.
- Ambiguous rack/zone matches.
- Missing condition metrics per crop.
- Farm locations without device groups.

## Device Connection Model

The technical implementation should use this rule:

```text
batchId assignment > sensorGroup assignment > rack/zone fallback
```

Meaning:

1. If a device group has `assignedBatchId`, its readings belong to that crop batch.
2. If a crop has `sensorGroupId`, readings from that group belong to the crop.
3. If no direct connection exists, the mock API can match readings by rack and zone.
4. If more than one active crop shares the same rack and zone, fallback needs review and the UI must ask the user to connect devices.

Visible UI should summarize this as:

```text
These devices are connected to this crop's growing location.
```

Implementation invariant:

- `CropBatch.sensorGroupId` and `SensorGroup.assignedBatchId` must be updated together through `assignSensorGroupToBatch`.
- A device group can be connected to only one active crop batch at a time.
- Reconnecting a group from one crop to another requires confirmation and disconnects the previous crop.
- Use `farmLocationId` as the stable matching key when available. Rack and zone are display and fallback labels.

## Page Layout

Recommended structure:

```text
PageHeader
  title: Devices & Locations
  subtitle: Equipment placement and crop connections

Top summary row
  Online Devices
  Connected Groups
  Unconnected Groups
  Crops Needing Devices
  Missing Metrics

Main content
  Farm Location Table
  Device Group Table
  Device Table

Side panel or dialog
  Connect device group to crop
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
- Device group count.
- Active crop count.
- Status.
- Actions.

Actions:

- Add rack/zone.
- Edit location.
- View matching device groups.

Users should be able to create a missing rack or zone here, then use it in Add Crop and device connection flows.

Editing a location should call `useUpdateFarmLocation` and refresh affected crop, device group, and device displays.

New locations can exist without device groups. Show those locations as placement-only until a device group is moved or created for that location. Device group creation is optional for the PoC; if it is not implemented, guide users to create the crop with "No devices connected yet" and connect devices later.

## Device Group Table

Columns:

- Group name.
- Rack.
- Zone.
- Device count.
- Metrics tracked.
- Missing metrics for connected crop.
- Connected crop.
- Connection status.
- Actions.

Actions:

- Connect to crop.
- Change connection.
- View crop if assigned.

Connection status:

- Connected.
- Unconnected.
- Needs review.
- Offline devices.
- Missing expected metric.

## Device Table

Columns:

- Device name.
- Metrics tracked.
- Rack.
- Zone.
- Group.
- Status.
- Connected crop.

Device status:

- Online.
- Offline.
- Maintenance.

Missing metric behavior:

- Show missing metrics as `Not tracked`, not as broken charts.
- If a crop lacks pH, EC, light, or other expected readings, show which metric is missing.
- Explain that the estimate can still run, but reliability may be lower.

## Connect Devices Dialog

The dialog should allow the user to connect a device group to an active crop batch.

Fields:

- Device group.
- Crop batch.

Helpful display:

- Show crop plant name, rack, zone, and status.
- Highlight matching rack/zone crops.
- Warn if connecting a group to a crop in a different rack/zone.
- Warn if the device group does not include expected metrics for the crop.

On submit:

- Call `useAssignSensorGroupToBatch`.
- Invalidate device groups, devices, crop batch, crop list, crop summaries, condition readings, and harvest estimate.
- If the group was previously assigned, invalidate the previous crop batch and its prediction as well.
- Show success toast: "Devices connected."
- Navigate back to the `returnTo` route if present.

## Missing Device Connection Panel

Show crop batches where:

- `sensorGroupId` is missing, or
- connected device group is offline, or
- rack/zone fallback is ambiguous.

Each item should have:

- Crop name.
- Rack and zone.
- Current estimate reliability.
- "Connect devices" action.

## Loading State

Use skeletons for:

- Summary cards.
- Device group table rows.
- Device table rows.

## Empty State

If no devices exist:

```text
No devices are registered in the demo farm.
```

For the PoC, this should not happen with seed data, but the state should exist.

## Error State

Use shadcn `Alert` with retry.

## Navigation

The Devices & Locations page must preserve connection context from other pages:

- `/sensors?batchId=[batchId]` highlights the crop's current device connection state.
- `/sensors?action=assign&batchId=[batchId]&returnTo=[encoded-route]` opens `ConnectDevicesDialog` with the crop preselected.
- View crop -> `/crops/[batchId]`.
- Add crop for a location -> `/crops/new?farmLocationId=[farmLocationId]`.
- After successful assignment, return to `returnTo` if it exists.

## Acceptance Criteria

- Devices & Locations loads devices, device groups, and crop summaries through TanStack Query.
- Devices & Locations loads and can create farm locations through TanStack Query.
- User can edit farm locations without breaking existing crop and sensor displays.
- User can see which device group is connected to which crop.
- User can connect or change a device group connection.
- Needs-review rack/zone fallback is called out clearly.
- Missing metrics are called out clearly.
- Crop Detail can explain condition readings using the same connection model.
- Connection changes affect estimates and condition readings after query invalidation.
- Visible copy avoids IoT, sensor-provenance, and assignment jargon.
