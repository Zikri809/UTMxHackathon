# Dashboard Page Build Spec

## Route And File

Route:

```text
/dashboard
```

Next.js file:

```text
src/app/dashboard/page.tsx
```

Recommended page component:

```text
src/components/dashboard/dashboard-page.tsx
```

## Purpose

The dashboard is the first working screen. It should instantly show that Harvest Calendar is more than a calendar: it combines crop batches, harvest predictions, sensor health, and model learning updates.

## Primary User Questions

- What crops are active right now?
- What needs harvesting soon?
- Which crop needs attention?
- Which crops are missing sensor assignment?
- Are predictions generic or learned?
- Has the system learned from recent feedback?

## Data Dependencies

Use TanStack Query hooks:

```ts
const cropBatches = useCropBatches();
const sensorGroups = useSensorGroups();
const learningStats = useModelLearningStats();
```

Derived data:

- Active crop count.
- Ready soon count.
- Feedback needed count.
- Check again scheduled count.
- Average prediction confidence.
- Next harvest batch.
- Crops with attention status.
- Crops missing sensor assignment.
- Crops with cancelled, failed, or archived status should be excluded from default active dashboard lists.

## Page Layout

Recommended structure:

```text
PageHeader
  title: Dashboard
  action: Add Crop

Top stat row
  Active Batches
  Ready Soon
  Feedback Needed
  Avg Confidence

Main grid
  Left: Active Crop Cards
  Right: Upcoming Harvests + Recent Learning + Sensor Assignment

Bottom
  Sensor Attention Summary
```

Desktop:

- Two-column layout.
- Crop list should take more space than summary panels.

Mobile:

- Single-column stack.
- Stat cards in a two-column grid.

## Components To Build

Use existing/shared components where possible:

- `PageHeader`
- `StatCard`
- `CropCard`
- `PredictionBadge`
- `ConfidenceMeter`
- `HarvestWindow`
- `InsightList`
- shadcn `Card`
- shadcn `Button`
- shadcn `Badge`
- shadcn `Skeleton`

## Crop Card Requirements

Each crop card should show:

- Plant type and variety.
- Rack or zone.
- Planted date.
- Generic harvest date.
- Current predicted harvest date.
- Prediction shift in days.
- Confidence meter.
- Status badge.
- Sensor assignment badge.

Card actions:

- Click card opens `/crops/[batchId]`.
- "Feedback" action appears only when status is `feedback_needed`.

## Dashboard Stats

Suggested stats:

```text
Active Batches
Ready Soon
Feedback Needed
Average Confidence
```

Visual behavior:

- Feedback needed should use attention styling.
- Average confidence should use a progress indicator.
- Ready soon should highlight harvest urgency.

## Upcoming Harvests Panel

Show crops sorted by predicted harvest date.

Each row:

- Crop name.
- Predicted date.
- Harvest window.
- Confidence badge.
- Status.

Clicking a row opens crop detail.

## Recent Learning Panel

Show two or three learning updates derived from `ModelLearningStats`.

Examples:

```text
Lettuce model is adaptive after 124 completed cycles.
Spinach prediction error improved from 4.6 to 2.1 days.
Basil is still learning and uses hybrid predictions.
```

This panel should make the ML feedback loop visible without requiring a separate explanation.

## Sensor Assignment Panel

Show a compact list of crops that need sensor setup.

Each row:

- Crop name.
- Rack and zone.
- Current prediction confidence.
- Assignment status: assigned, missing, or ambiguous.
- Action: "Assign sensors" linking to `/sensors`.

This keeps the sensor-to-crop mapping visible in the main journey without making the dashboard a device-management screen.

## Loading State

Use shadcn `Skeleton` components:

- Skeleton stat cards.
- Skeleton crop cards.
- Skeleton side panel rows.

Do not show an empty dashboard while query loading.

## Empty State

If no crop batches exist:

- Show a concise empty state.
- Primary action: "Add first crop".
- Explain in one sentence that the app will create a generic harvest estimate.

## Error State

Show shadcn `Alert`:

```text
Could not load dashboard data.
```

Action:

- Retry button that calls query `refetch`.

## Navigation

From dashboard:

- `Add Crop` -> `/crops/new`
- Crop card -> `/crops/[batchId]`
- Assign sensors -> `/sensors`
- Calendar preview link -> `/calendar`
- Learning panel link -> `/learning`

## Demo Reset

Include a small reset action in a low-priority menu.

Behavior:

- Opens `DemoResetDialog`.
- Calls `useResetDemoData`.
- Restores seeded crops, plant profiles, farm locations, sensor groups, and learning stats.
- Shows a success toast.

## Acceptance Criteria

- Dashboard loads from TanStack Query hooks.
- Dashboard never imports seed data directly.
- User can navigate to add crop, crop detail, calendar, and learning.
- Feedback-needed crop is visible without scrolling on desktop demo data.
- Cancelled, failed, and archived crops are hidden from default active dashboard views.
- Loading, empty, and error states exist.
