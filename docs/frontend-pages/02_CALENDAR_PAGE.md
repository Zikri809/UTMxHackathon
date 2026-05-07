# Calendar / Harvest Plan Page Build Spec

## Route And File

Route:

```text
/calendar
```

Next.js file:

```text
src/app/calendar/page.tsx
```

Recommended page component:

```text
src/components/calendar/calendar-page.tsx
```

## Purpose

The calendar turns harvest estimates into an operational plan. In the UI, label this page `Harvest Plan`. It should show what work is expected this week or month and which dates need review.

## Primary User Questions

- What will be ready this week or month?
- Which harvest dates are reliable?
- Which dates changed because of growing conditions?
- Which crops need devices connected?
- Which crop needs a harvest check?

## User-Friendly UX Rules

- Use `Harvest Plan` as the visible page title.
- Use `Expected ready date`, `Ready window`, and `Reliability`.
- Use `Updated from conditions` instead of sensor-adjusted.
- Use `Needs device connection` instead of missing sensor assignment.
- Use `Record harvest result` instead of feedback.
- The page should show expected work, not feel like a technical scheduler.

## Data Dependencies

Use TanStack Query hooks:

```ts
const cropSummaries = useCropBatchSummaries();
const sensorGroups = useSensorGroups();
```

Derived data:

- Calendar events from `predictedHarvestDate`.
- Harvest windows from `predictedHarvestWindow`.
- Month groups.
- Week groups.
- Status filters.
- Device connection filters.
- Archived, cancelled, and failed crop filtering.
- Crop focus from optional `batchId` query param.

## Page Layout

Recommended structure:

```text
PageHeader
  title: Harvest Plan
  action: Add Crop

Toolbar
  Month selector
  View toggle: Month / Week / List
  Filters: Plant type, Status, Rack
  Device connection filter

Calendar content
  Month grid or week view

Side drawer or detail panel
  Selected crop summary
```

## Calendar Views

### Month View

Show a standard month grid.

Each date cell:

- Date number.
- Crop harvest chips.
- Maximum visible chips before showing "+N more".

Crop chip content:

- Plant name.
- Reliability indicator.
- Status color.

### Week View

Show seven days with more room for crop details.

Useful for demo because it makes harvest windows easier to see.

### List View

Show crops sorted by predicted harvest date.

Columns:

- Crop.
- Rack or zone.
- Starter date.
- Expected ready date.
- Ready window.
- Reliability.
- Status.

Use shadcn `Table` for this.

## Components To Build

- `CalendarView`
- `CalendarToolbar`
- `CalendarEventChip`
- `HarvestWindow`
- `PredictionBadge`
- `ConfidenceMeter`
- `CropSummaryDrawer`
- shadcn `Calendar`
- shadcn `Tabs`
- shadcn `Select`
- shadcn `Badge`
- shadcn `Drawer`
- shadcn `Table`

## Status Coloring

Use consistent colors:

- Starter estimate: blue.
- Updated from conditions: green.
- Ready soon: amber.
- Feedback needed: orange.
- Completed: gray.
- Needs device connection: outlined orange warning.
- Cancelled, failed, and archived: hidden by default, visible via filters.

Do not rely on color alone. Include short status labels.

## Interactions

Click crop event:

- Opens a drawer with crop summary.
- Drawer includes "Open crop" button.

Click "Open crop":

- Navigates to `/crops/[batchId]`.

Click "Record harvest result":

- Navigates to `/crops/[batchId]?tab=feedback`.

Click "Connect devices":

- Navigates to `/sensors?action=assign&batchId=[batchId]&returnTo=/calendar`.

Click "Add Crop":

- Navigates to `/crops/new`.

Filters:

- Plant type filter.
- Status filter.
- Rack or zone filter.
- Device connection filter.
- Include archived/cancelled/failed toggle.
- Clear filters button.

## Selected Crop Drawer

Show:

- Crop name.
- Rack and zone.
- Starter date.
- Expected ready date.
- Ready window.
- Reliability.
- Conditions summary.
- Device connection status.
- Primary action: "View details".
- Device action if connection is missing.
- Harvest check action if status is `feedback_needed`.

## Loading State

Use skeletons for:

- Calendar toolbar.
- Calendar grid.
- List rows.

## Empty State

If no crop batches exist:

```text
No harvests scheduled yet.
```

Primary action:

```text
Add Crop
```

## Error State

Use shadcn `Alert` with retry.

## Acceptance Criteria

- Calendar reads crop summaries through TanStack Query.
- Month, week, or list view exists; ideally all three if time allows.
- Clicking a crop leads to crop details.
- Feedback-needed crops are visually distinct.
- Missing device connection is visible on affected crop events or rows.
- Cancelled, failed, and archived crops are hidden by default and available through filters.
- Filters work without changing the underlying mock data.
- Calendar uses the same status and reliability logic as Today and Crop Detail.
- Visible copy avoids ML, prediction-mode, and sensor-assignment jargon.
