# Learning / Improvements Page Build Spec

## Route And File

Route:

```text
/learning
```

Next.js file:

```text
src/app/learning/page.tsx
```

Recommended page component:

```text
src/components/learning/learning-page.tsx
```

## Purpose

The Improvements page shows that harvest estimates get better as real harvest results are recorded. In the UI, label this page `Improvements`.

It should communicate business value without AI jargon: repeated crop cycles reduce the average miss between expected ready dates and actual harvest results.

## Primary User Questions

- Which plants have enough history for better estimates?
- Which custom plants still use starter estimates?
- How much has ready-date accuracy improved?
- Did my harvest check improve future planning?

## User-Friendly UX Rules

- Use `Improvements` as the visible page title.
- Use `Starter`, `Getting better`, and `Highly reliable` as primary labels.
- Use `Average miss` instead of prediction error.
- Use `Harvest checks` instead of feedback.
- Avoid "model", "ML", "adaptive", and "baseline" in primary UI copy.
- Keep technical maturity values available only in implementation data.

## Data Dependencies

Use TanStack Query hook:

```ts
const learningStats = useModelLearningStats();
```

Optional:

```ts
const cropSummaries = useCropBatchSummaries();
const feedbackHistory = useHarvestFeedback(selectedBatchId); // only when showing one crop's feedback details
const updatePlantProfile = useUpdatePlantProfile();
```

Use crop summaries if showing recent feedback history or completed crop counts.

Improvement stats should only treat `completed` crops with harvest checks as examples for future estimates. `cancelled`, `failed`, and `archived` crops should not improve estimate accuracy unless they already had valid harvest checks before archival.

## Page Layout

Recommended structure:

```text
PageHeader
  title: Improvements
  subtitle: Harvest estimates getting better over time

Top summary row
  Total completed cycles
  Average miss reduced
  Highly reliable plants
  Plants getting better

Main grid
  Plant improvement cards
  Accuracy improvement chart

Bottom
  Starter vs improved estimate comparison
  Recent harvest checks
```

## Components To Build

- `LearningModelCard`
- `AccuracyTrendChart`
- `ModelMaturityBadge`
- `FeedbackHistoryList`
- `GenericVsLearnedComparison`
- `EditPlantProfileDialog`
- shadcn `Card`
- shadcn `Badge`
- shadcn `Progress`
- shadcn `Table`
- shadcn `Tabs`
- shadcn `Skeleton`

## Estimate Quality Levels

Use three levels:

```text
Starter
Getting better
Highly reliable
```

Starter:

- Uses typical days to ready.
- Lower reliability.
- Not enough harvest checks yet.
- Custom plants start here after the user provides typical days to ready.

Getting better:

- Combines starter estimate, growing conditions, and early harvest checks.
- Medium reliability.

Highly reliable:

- Uses plant-specific harvest history.
- Higher reliability.
- Lower average miss.

## Plant Improvement Cards

Each card should show:

- Plant type.
- Source: catalog or custom.
- Estimate quality.
- Completed crop cycles.
- Average miss before improvements.
- Average miss now.
- Reliability.
- Short improvement note.

Example:

```text
Lettuce
Highly reliable
124 completed cycles
Average miss reduced from 5.2 days to 1.8 days
Reliability: 86%
```

## Accuracy Improvement Chart

Use Recharts.

Chart options:

- Bar chart comparing before vs now for each plant.
- Line chart showing mocked error improvement over time.

Recommended for MVP:

- Bar chart because it is fast and easy to understand.

## Starter Vs Improved Comparison

Show a simple comparison table:

Columns:

- Feature.
- Starter estimate.
- Improved estimate.

Rows:

- Inputs used.
- Reliability.
- Personalization.
- Harvest checks.
- Average miss.

This helps judges understand the long-term product value.

## Recent Harvest Check Events

Show harvest-check-driven updates:

```text
Spinach harvest check recorded: estimate missed by 3 days.
Future spinach estimates adjust earlier in similar conditions.
Lettuce reliability improved after a stable pH harvest cycle.
```

If no harvest checks exist, show seeded improvement events.

## Custom Plant Behavior

Custom plants should appear in the same improvement list as catalog plants.

Display rules:

- Source badge: `Custom`.
- Estimate quality starts as `Starter`.
- Completed crop cycles starts at `0`.
- Reliability is lower until harvest checks are submitted.
- After a harvest check, show the custom plant as `Getting better`.
- Custom profiles can be edited if the initial maturity estimate or ideal ranges were entered incorrectly.

Example:

```text
Red Amaranth
Custom plant
Starter estimate
0 completed cycles
Using user-provided 28 days to ready
```

Editing custom profiles:

- Allow editing custom plant name, default maturity days, and ideal ranges.
- Do not allow editing catalog profiles in the PoC.
- After editing a custom profile, invalidate plant profiles, affected crop estimates, and improvement stats.

Edit dialog requirements:

- Open only for custom plant profiles.
- Fields: plant name, typical days to ready, ready window buffer days, and optional advanced growing ranges.
- Validate that maturity days and range bounds are positive and that minimum values are less than maximum values.
- Disable submit while pending.
- On success, call `useUpdatePlantProfile`, invalidate plant profiles, crop summaries, affected crop estimates, and improvement stats, then show a toast.
- On failure, keep the dialog open and show an inline error.

## Navigation

- Add crop for a starter or custom plant -> `/crops/new`.
- Open recent harvest check crop -> `/crops/[batchId]?tab=feedback`.
- Focus a plant improvement card -> `/learning?plantProfileId=[plantProfileId]`.
- Open crop history, if implemented -> `/crops?plantProfileId=[plantProfileId]`.

## Loading State

Use skeleton cards and chart placeholder.

## Empty State

If no learning stats exist:

- Show starter-estimate explanation.
- Link to `/crops/new`.

## Error State

Use shadcn `Alert` with retry.

## Acceptance Criteria

- Improvements page reads stats through `useModelLearningStats`.
- Page shows starter, getting better, and highly reliable estimate states.
- Page includes custom plant profiles after they are created.
- User can correct custom plant profile details.
- Harvest check submitted from Crop Detail changes this page after cache invalidation.
- Cancelled, failed, and archived crops do not inflate completed-cycle learning stats.
- At least one chart visualizes accuracy improvement.
- Page clearly explains why estimates become better over time.
- Visible copy avoids ML, model, baseline, adaptive, and prediction-mode jargon.
