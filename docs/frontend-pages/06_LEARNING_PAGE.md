# Learning Page Build Spec

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

The Learning page makes the mocked ML story visible. It should show how generic predictions become plant-specific learned predictions as more crop cycles and feedback are collected.

## Primary User Questions

- Which plants have enough data for better predictions?
- Which custom plants are still baseline-only?
- How much has prediction accuracy improved?
- Which plants are still using generic estimates?
- Did my harvest feedback improve the model?

## Data Dependencies

Use TanStack Query hook:

```ts
const learningStats = useModelLearningStats();
```

Optional:

```ts
const cropBatches = useCropBatches();
const updatePlantProfile = useUpdatePlantProfile();
```

Use crop batches if showing recent feedback history or completed crop counts.

Learning stats should only treat `completed` crops with harvest feedback as model-training examples. `cancelled`, `failed`, and `archived` crops should not improve model accuracy unless they already had valid feedback before archival.

## Page Layout

Recommended structure:

```text
PageHeader
  title: Model Learning
  subtitle: Plant-specific prediction progress

Top summary row
  Total completed cycles
  Average error reduction
  Adaptive models
  Plants still learning

Main grid
  Plant learning cards
  Accuracy improvement chart

Bottom
  Generic vs learned model comparison
  Recent feedback events
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

## Model Maturity Levels

Use three levels:

```text
Baseline
Learning
Adaptive
```

Baseline:

- Uses generic crop maturity estimate.
- Low confidence.
- Not enough feedback data.
- Custom plants start here after the user provides a generic maturity estimate.

Learning:

- Combines generic estimate, sensor trends, and early feedback data.
- Medium confidence.

Adaptive:

- Uses plant-specific historical patterns.
- Higher confidence.
- Lower average prediction error.

## Plant Learning Cards

Each card should show:

- Plant type.
- Source: catalog or custom.
- Maturity level.
- Completed crop cycles.
- Average error before learning.
- Average error now.
- Confidence.
- Short model note.

Example:

```text
Lettuce
Adaptive model
124 completed cycles
Error reduced from 5.2 days to 1.8 days
Confidence: 86%
```

## Accuracy Improvement Chart

Use Recharts.

Chart options:

- Bar chart comparing before vs now for each plant.
- Line chart showing mocked error improvement over time.

Recommended for MVP:

- Bar chart because it is fast and easy to understand.

## Generic Vs Learned Comparison

Show a simple comparison table:

Columns:

- Feature.
- Generic estimate.
- Learned prediction.

Rows:

- Inputs used.
- Confidence.
- Personalization.
- Feedback loop.
- Prediction error.

This helps judges understand the long-term product value.

## Recent Feedback Events

Show feedback-driven updates:

```text
Spinach feedback submitted: prediction was 3 days late.
Spinach model adjusted future estimates earlier in similar conditions.
Lettuce model confidence increased after stable pH harvest cycle.
```

If no feedback exists, show seeded learning events.

## Custom Plant Behavior

Custom plants should appear in the same learning model list as catalog plants.

Display rules:

- Source badge: `Custom`.
- Maturity starts as `Baseline`.
- Completed crop cycles starts at `0`.
- Confidence is lower until feedback is submitted.
- After feedback, show the custom plant as `Learning`.
- Custom profiles can be edited if the initial maturity estimate or ideal ranges were entered incorrectly.

Example:

```text
Red Amaranth
Custom plant
Baseline model
0 completed cycles
Using user-provided 28 day maturity estimate
```

Editing custom profiles:

- Allow editing custom plant name, default maturity days, and ideal ranges.
- Do not allow editing catalog profiles in the PoC.
- After editing a custom profile, invalidate plant profiles, affected crop predictions, and learning stats.

## Loading State

Use skeleton cards and chart placeholder.

## Empty State

If no learning stats exist:

- Show baseline explanation.
- Link to `/crops/new`.

## Error State

Use shadcn `Alert` with retry.

## Acceptance Criteria

- Learning page reads stats through `useModelLearningStats`.
- Page shows baseline, learning, and adaptive model states.
- Page includes custom plant profiles after they are created.
- User can correct custom plant profile details.
- Feedback submitted from Crop Detail changes this page after cache invalidation.
- Cancelled, failed, and archived crops do not inflate completed-cycle learning stats.
- At least one chart visualizes accuracy improvement.
- Page clearly explains why the system becomes better over time.
