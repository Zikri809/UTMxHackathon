# TASK-03: Domain Types And Shared Selectors

## Phase

Phase 1: Foundation And Data Contracts

## Goal

Define the domain contracts and shared derived-state selectors that all pages use.

## Dependencies

- `TASK-01_PROJECT_SETUP.md`

## Source Docs

- `docs/frontend-pages/00_APP_FOUNDATION.md`
- `docs/frontend-pages/10_COHERENCE_REVIEW_AND_FLOW_CONTRACTS.md`
- `docs/frontend-pages/12_USER_FRIENDLY_PRODUCT_PLAN.md`

## Deliverables

- Type files:
  - `src/types/location.ts`
  - `src/types/plant.ts`
  - `src/types/crop.ts`
  - `src/types/sensor.ts`
  - `src/types/prediction.ts`
  - `src/types/feedback.ts`
  - `src/types/learning.ts`
- `src/lib/domain/selectors.ts`
- Shared enums/types for:
  - crop lifecycle status
  - crop health state
  - feedback state
  - sensor assignment state
  - prediction mode
  - model maturity
  - metric availability
- Display label helpers for user-friendly copy.

## Required Selectors

- `getCropLifecycleState`
- `getCropHealthState`
- `getFeedbackState`
- `getSensorAssignmentState`
- `getMissingSensorTypes`
- `getHarvestWindowSummary`
- `getStatusPriority`

## Acceptance Checks

- Dashboard, Harvest Plan, Crops, Crop Detail, Devices & Locations, and Improvements can rely on one shared set of derived rules.
- No page needs to duplicate lifecycle, reliability, connection, or missing-metric logic.
- Display label helpers map technical values to grower-facing labels:
  - starter estimate
  - updated from conditions
  - improved estimate
  - reliability
  - connect devices
  - harvest check

