# Dashboard / Today Page Build Spec

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

The dashboard is the daily starting point. In the UI, label this page `Today`. It should show what needs action now: ready-soon crops, harvest checks, attention items, and crops that need devices connected.

It should feel like a grower's morning checklist, not a technical status wall.

## Primary User Questions

- What crops are active right now?
- What needs harvesting soon?
- Which crop needs attention?
- Which crops need devices connected?
- Which harvest estimates are starter estimates and which have been improved?
- Did recent harvest checks improve future planning?

## User-Friendly UX Rules

- Use `Today` as the visible page title.
- Use `Expected ready date`, `Ready window`, and `Reliability` instead of prediction/confidence language.
- Use `Connect devices` instead of assign sensors.
- Use `Record harvest result` instead of feedback.
- Keep technical explanation out of the dashboard; link to details when needed.
- Show one clear next action per attention item.

## Data Dependencies

Use TanStack Query hooks:

```ts
const cropSummaries = useCropBatchSummaries();
const sensorGroups = useSensorGroups();
const learningStats = useModelLearningStats();
```

Derived data:

- Active crop count.
- Ready soon count.
- Feedback needed count.
- Check again scheduled count from derived `FeedbackState`.
- Average estimate reliability.
- Next harvest batch.
- Crops with derived `cropHealthState: "attention"`.
- Crops missing device connections.
- Crops with cancelled, failed, or archived status should be excluded from default active dashboard lists.

## Page Layout

Recommended structure:

```text
PageHeader
  title: Today
  action: Add Crop

Top stat row
  Active Batches
  Ready Soon
  Harvest Checks
  Avg Reliability

Main grid
  Left: Active Crop Cards
  Right: Upcoming Harvests + Recent Improvements + Device Connections

Bottom
  Attention Summary
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
- Starter ready date.
- Expected ready date.
- Date change in days.
- Reliability meter.
- Status badge.
- Device connection badge.

Card actions:

- Click card opens `/crops/[batchId]`.
- "Record harvest result" action appears only when status is `feedback_needed`.

## Dashboard Stats

Suggested stats:

```text
Active Batches
Ready Soon
Harvest Checks
Average Reliability
```

Visual behavior:

- Feedback needed should use attention styling.
- Average reliability should use a progress indicator.
- Ready soon should highlight harvest urgency.

## Upcoming Harvests Panel

Show crops sorted by predicted harvest date.

Each row:

- Crop name.
- Expected ready date.
- Ready window.
- Reliability badge.
- Status.

Clicking a row opens crop detail.

## Recent Improvements Panel

Show two or three learning updates derived from `ModelLearningStats`.

Examples:

```text
Lettuce estimates are highly reliable after 124 completed cycles.
Spinach average miss improved from 4.6 to 2.1 days.
Basil estimates are getting better as more harvest checks are recorded.
```

This panel should show that past harvest checks improve future estimates without requiring an explanation of machine learning.

## Device Connection Panel

Show a compact list of crops that need sensor setup.

Each row:

- Crop name.
- Rack and zone.
- Current estimate reliability.
- Connection status: connected, needs connection, or needs review.
- Action: "Connect devices" linking to `/sensors?action=assign&batchId=[batchId]&returnTo=/dashboard`.

This keeps the sensor-to-crop mapping visible in the main journey without making the dashboard a device-management screen.

Visible labels should use:

- `Device connection` instead of sensor assignment.
- `Connected`, `Needs connection`, `Needs review`, and `Offline` instead of assigned, missing, ambiguous, and offline.
- `Connect devices` as the action label.

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
- Explain in one sentence that the app will create a starter harvest estimate.

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
- Connect devices -> `/sensors?action=assign&batchId=[batchId]&returnTo=/dashboard`
- Record harvest result -> `/crops/[batchId]?tab=feedback`
- Harvest Plan preview link -> `/calendar`
- Improvements panel link -> `/learning`

## Demo Reset

Include a small reset action in a low-priority menu.

Behavior:

- Opens `DemoResetDialog`.
- Calls `useResetDemoData`.
- Restores seeded crops, plant profiles, farm locations, device groups, and improvement stats.
- Shows a success toast.

## Acceptance Criteria

- Dashboard loads from TanStack Query hooks.
- Dashboard uses `useCropBatchSummaries` for prediction, lifecycle, health, feedback, and assignment display.
- Dashboard never imports seed data directly.
- User can navigate to add crop, crop detail, calendar, and learning.
- Feedback-needed crop is visible without scrolling on desktop demo data.
- Cancelled, failed, and archived crops are hidden from default active dashboard views.
- Loading, empty, and error states exist.
- Visible copy uses grower-friendly labels and does not mention ML, mock data, query hooks, or sensor assignment internals.
