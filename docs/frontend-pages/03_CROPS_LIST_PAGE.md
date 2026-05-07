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

## Primary User Questions

- What crop batches exist?
- Which crops are growing, ready soon, completed, or waiting for feedback?
- Which crops were cancelled, failed, or archived?
- Which crops belong to a rack or zone?
- Which crops have missing or ambiguous sensor assignment?
- Which predictions are low confidence?

## Data Dependencies

Use TanStack Query hooks:

```ts
const cropBatches = useCropBatches();
const sensorGroups = useSensorGroups();
```

Derived data:

- Filtered crop list.
- Status counts.
- Plant type counts.
- Crops missing sensor assignment.
- Sorted list by predicted harvest date or planted date.

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
  Feedback Needed
  Completed
  Cancelled
  Failed
  Archived

Toolbar
  Search
  Plant type filter
  Sensor assignment filter
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
- Generic harvest.
- Current prediction.
- Confidence.
- Sensor assignment.
- Status.
- Actions.

Actions:

- View.
- Assign sensors if missing.
- Submit feedback if status is `feedback_needed`.
- Edit.
- Archive.
- Mark failed.
- Cancel.

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
- Sensor assignment: assigned, missing, ambiguous.
- Include archived toggle.

Sort options:

- Predicted harvest date ascending.
- Planted date descending.
- Confidence ascending.
- Status priority.

## Status Priority

When sorting by status priority:

1. Feedback needed.
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
- Assign sensors action -> `/sensors`
- Feedback action -> `/crops/[batchId]` with feedback section visible, or open `FeedbackModal` if implemented globally

## Acceptance Criteria

- Crops list reads data through `useCropBatches`.
- List supports search, status filtering, and sorting.
- User can open any crop detail page.
- User can identify crops that are missing sensor assignment.
- User can find archived, cancelled, and failed crops through filters.
- Status and prediction display match Dashboard and Calendar.
- Empty, loading, and error states are implemented.
