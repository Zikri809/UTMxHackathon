# Calendar Page Build Spec

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

The calendar turns harvest predictions into a planning tool. It should show harvest windows, prediction confidence, crop status, and whether a date is generic or sensor-adjusted.

## Primary User Questions

- What will be ready this week or month?
- Which harvest dates are confident?
- Which dates changed because of sensor readings?
- Which harvest predictions are missing sensor assignment?
- Which crop needs feedback?

## Data Dependencies

Use TanStack Query hooks:

```ts
const cropBatches = useCropBatches();
const sensorGroups = useSensorGroups();
```

Derived data:

- Calendar events from `predictedHarvestDate`.
- Harvest windows from `predictedHarvestWindow`.
- Month groups.
- Week groups.
- Status filters.
- Sensor assignment filters.
- Archived, cancelled, and failed crop filtering.

## Page Layout

Recommended structure:

```text
PageHeader
  title: Harvest Calendar
  action: Add Crop

Toolbar
  Month selector
  View toggle: Month / Week / List
  Filters: Plant type, Status, Rack
  Sensor assignment filter

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
- Confidence indicator.
- Status color.

### Week View

Show seven days with more room for crop details.

Useful for demo because it makes harvest windows easier to see.

### List View

Show crops sorted by predicted harvest date.

Columns:

- Crop.
- Rack or zone.
- Generic date.
- Predicted date.
- Harvest window.
- Confidence.
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

- Generic baseline: blue.
- Sensor adjusted: green.
- Ready soon: amber.
- Feedback needed: orange.
- Completed: gray.
- Missing sensor assignment: outlined orange warning.
- Cancelled, failed, and archived: hidden by default, visible via filters.

Do not rely on color alone. Include short status labels.

## Interactions

Click crop event:

- Opens a drawer with crop summary.
- Drawer includes "Open crop" button.

Click "Open crop":

- Navigates to `/crops/[batchId]`.

Click "Add Crop":

- Navigates to `/crops/new`.

Filters:

- Plant type filter.
- Status filter.
- Rack or zone filter.
- Sensor assignment filter.
- Include archived/cancelled/failed toggle.
- Clear filters button.

## Selected Crop Drawer

Show:

- Crop name.
- Rack and zone.
- Generic harvest date.
- Current prediction.
- Harvest window.
- Confidence.
- Sensor summary.
- Sensor assignment status.
- Primary action: "View details".
- Sensor action if assignment is missing.
- Feedback action if status is `feedback_needed`.

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

- Calendar reads crop batches through TanStack Query.
- Month, week, or list view exists; ideally all three if time allows.
- Clicking a crop leads to crop details.
- Feedback-needed crops are visually distinct.
- Missing sensor assignment is visible on affected crop events or rows.
- Cancelled, failed, and archived crops are hidden by default and available through filters.
- Filters work without changing the underlying mock data.
- Calendar uses the same status and confidence logic as Dashboard and Crop Detail.
