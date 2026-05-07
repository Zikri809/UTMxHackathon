# TASK-08: Crop Detail And Harvest Check

## Phase

Phase 2: Core Grower Journey

## Goal

Build the main crop detail page, estimate explanation, conditions view, devices view, and harvest check flow.

## Dependencies

- `TASK-05_QUERY_HOOKS.md`
- `TASK-07_ADD_CROP_FLOW.md`

## Source Docs

- `docs/frontend-pages/05_CROP_DETAIL_PAGE.md`
- `docs/frontend-pages/10_COHERENCE_REVIEW_AND_FLOW_CONTRACTS.md`
- `docs/frontend-pages/12_USER_FRIENDLY_PRODUCT_PLAN.md`

## Deliverables

- `src/app/crops/[batchId]/page.tsx`
- `src/components/crops/crop-detail-page.tsx`
- `PredictionSummaryPanel` rendered as estimate summary.
- `PredictionExplanation` rendered behind `View why this changed`.
- `SensorMetricCard` rendered as condition metric card.
- `SensorTrendChart` rendered as condition trend chart.
- `SensorAssignmentCard` rendered as device connection card.
- `FeedbackModal` rendered as harvest check modal or tab.
- `EditCropDialog`
- `CropStatusActions`

## Visible Tabs

- Overview
- Conditions
- Devices
- History
- Harvest Check
- Settings

## Acceptance Checks

- Crop loads with estimate, ready window, reliability, and status.
- Conditions show current readings and at least one chart.
- Missing metrics show as `Not tracked`.
- Devices tab explains which device group is connected.
- Missing device connection routes to Devices & Locations with crop preselected.
- Harvest check supports accurate, early, late, and not ready.
- `Not ready yet` keeps crop active and schedules another check.
- Harvest check updates Improvements data.

