# Crops List Page Build Spec

## Route And File

Route:

```text
/crops
```

Next.js file:

```text
src/app/crops/page.tsx
```

Recommended page component:

```text
src/components/crops/crops-list-page.tsx
```

## Purpose

The crops page is the operational inventory of crop batches. It should help the user scan, filter, and open any batch quickly.

It should feel like an inventory board for farm work, not a data table for system internals.

## Primary User Questions

- What crop batches exist?
- Which crops are growing, ready soon, completed, or waiting for a harvest check?
- Which crops were cancelled, failed, or archived?
- Which crops belong to a rack or zone?
- Which crops need devices connected or reviewed?
- Which harvest estimates have low reliability?

## User-Friendly UX Rules

- Use `Harvest check` instead of feedback.
- Use `Expected ready date`, `Ready window`, and `Reliability`.
- Use `Device connection` instead of sensor assignment.
- Keep risky lifecycle actions in a More menu with confirmations.
- Do not show technical IDs unless needed for debugging.

## Data Dependencies

Use TanStack Query hooks:

```ts
const cropSummaries = useCropBatchSummaries();
const sensorGroups = useSensorGroups();
```

Derived data:

- Filtered crop list.
- Status counts.
- Plant type counts.
- Crops missing device connection.
- Sorted list by expected ready date or planted date.

## Page Layout

Recommended structure:

```text
PageHeader
  title: Crops
  action: Add Crop

Summary chips
  All
  Growing
  Ready Soon
  Harvest Check
  Completed
  Cancelled
  Failed
  Archived

Toolbar
  Search
  Plant type filter
  Device connection filter
  Rack/zone filter
  Sort select

Crop table or card grid
```

Desktop:

- Use shadcn `Table` for dense scanning.

Mobile:

- Use `CropCard` list.

## Components To Build

- `CropStatusTabs`
- `CropFilters`
- `CropTable`
- `CropRowActions`
- `CropCard`
- `PredictionBadge`
- `ConfidenceMeter`
- `HarvestWindow`
- `SensorAssignmentCard`
- shadcn `Tabs`
- shadcn `Table`
- shadcn `Input`
- shadcn `Select`
- shadcn `Button`
- shadcn `Badge`

## Table Columns

Columns:

- Crop.
- Variety.
- Rack/Zone.
- Planted.
- Starter date.
- Expected ready date.
- Reliability.
- Device connection.
- Status.
- Actions.

Actions:

- View.
- Connect devices if missing.
- Record harvest result if status is `feedback_needed`.
- More menu with confirmations for Edit, Archive, Mark failed, and Cancel.

Lifecycle-changing actions must show a confirmation dialog and call `useUpdateCropStatus`. Keep destructive or recovery flows available, but make Crop Detail Settings the richer place for editing and explaining these actions.

## Filters

Search should match:

- Plant type.
- Variety.
- Rack.
- Zone.

Filter controls:

- Status.
- Plant type.
- Rack or zone.
- Device connection: connected, needs connection, needs review.
- Include archived toggle.

Sort options:

- Expected ready date ascending.
- Planted date descending.
- Reliability ascending.
- Status priority.

## Status Priority

When sorting by status priority:

1. Harvest check needed.
2. Ready soon.
3. Attention needed if represented separately.
4. Growing.
5. Completed.
6. Failed.
7. Cancelled.
8. Archived.

## Loading State

Use skeleton table rows or card skeletons.

## Empty State

If no crops match filters:

- Show "No crop batches match these filters."
- Include "Clear filters" button.

If no crop batches exist at all:

- Show "No crop batches yet."
- Include "Add Crop" primary button.

## Error State

Use shadcn `Alert` with retry.

## Navigation

- `Add Crop` -> `/crops/new`
- Row click or View action -> `/crops/[batchId]`
- Connect devices action -> `/sensors?action=assign&batchId=[batchId]&returnTo=/crops`
- Record harvest result action -> `/crops/[batchId]?tab=feedback`

## Acceptance Criteria

- Crops list reads data through `useCropBatchSummaries`.
- List supports search, status filtering, and sorting.
- User can open any crop detail page.
- User can identify crops that need device connection.
- User can find archived, cancelled, and failed crops through filters.
- Status and harvest estimate display match Today and Harvest Plan.
- Empty, loading, and error states are implemented.
- Visible copy avoids ML, prediction-mode, and sensor-assignment jargon.
