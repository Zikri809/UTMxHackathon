# TASK-06: Today Page

## Phase

Phase 2: Core Grower Journey

## Goal

Build the daily starting page that shows what needs action now.

## Dependencies

- `TASK-05_QUERY_HOOKS.md`

## Source Docs

- `docs/frontend-pages/01_DASHBOARD_PAGE.md`
- `docs/frontend-pages/12_USER_FRIENDLY_PRODUCT_PLAN.md`

## Deliverables

- `src/app/dashboard/page.tsx`
- `src/components/dashboard/dashboard-page.tsx`
- Supporting components:
  - `PageHeader`
  - `StatCard`
  - `CropCard`
  - `PredictionBadge`
  - `ConfidenceMeter`
  - `HarvestWindow`
  - `InsightList`

## User-Facing Requirements

- Page title: `Today`.
- Use `Expected ready date`, `Ready window`, and `Reliability`.
- Use `Connect devices`.
- Use `Record harvest result`.
- Show one clear next action per issue.

## Acceptance Checks

- Active crops are visible.
- Ready-soon crops are easy to spot.
- Harvest-check crop is visible without scrolling on desktop seed data.
- Crops needing device connection are visible.
- Cancelled, failed, and archived crops are hidden by default.
- Loading, empty, and error states exist.

