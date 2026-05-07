# TASK-12: Improvements Page

## Phase

Phase 4: Improvement Story And Demo Polish

## Goal

Show that harvest estimates improve over repeated crop cycles and harvest checks.

## Dependencies

- `TASK-05_QUERY_HOOKS.md`
- `TASK-08_CROP_DETAIL_AND_HARVEST_CHECK.md`

## Source Docs

- `docs/frontend-pages/06_LEARNING_PAGE.md`
- `docs/frontend-pages/11_BUSINESS_ANALYST_VIABILITY_REVIEW.md`
- `docs/frontend-pages/12_USER_FRIENDLY_PRODUCT_PLAN.md`

## Deliverables

- `src/app/learning/page.tsx`
- `src/components/learning/learning-page.tsx`
- `LearningModelCard` rendered as plant improvement card.
- `AccuracyTrendChart`
- `FeedbackHistoryList` rendered as harvest check history.
- `GenericVsLearnedComparison` rendered as starter vs improved estimate comparison.
- `EditPlantProfileDialog`

## Visible Labels

- Page title: `Improvements`.
- Estimate quality: Starter, Getting better, Highly reliable.
- Average miss, not prediction error.
- Harvest checks, not feedback.

## Acceptance Checks

- Custom plants appear after creation.
- Harvest checks submitted from Crop Detail update this page.
- Cancelled, failed, and archived crops do not inflate improvement stats.
- At least one chart visualizes average miss improvement.
- Custom plant profiles can be edited with validation.
- Visible copy avoids ML, model, baseline, and adaptive labels.

