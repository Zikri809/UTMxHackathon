# TASK-04: Mock API And Local Storage

## Phase

Phase 1: Foundation And Data Contracts

## Goal

Create a frontend-only mock API that behaves like a future backend client and persists demo writes.

## Dependencies

- `TASK-03_DOMAIN_TYPES_AND_SELECTORS.md`

## Source Docs

- `docs/frontend-pages/00_APP_FOUNDATION.md`
- `docs/frontend-pages/10_COHERENCE_REVIEW_AND_FLOW_CONTRACTS.md`

## Deliverables

- `src/lib/mock-api/storage.ts`
- `src/lib/mock-api/farm-locations.ts`
- `src/lib/mock-api/plant-profiles.ts`
- `src/lib/mock-api/crops.ts`
- `src/lib/mock-api/sensors.ts`
- `src/lib/mock-api/sensor-groups.ts`
- `src/lib/mock-api/predictions.ts`
- `src/lib/mock-api/feedback.ts`
- `src/lib/mock-api/learning.ts`
- `src/lib/mock-ml/calculate-prediction.ts`
- Seed data for:
  - Butterhead Lettuce
  - Thai Basil
  - Spinach needing harvest check
  - Kale starter estimate
  - rack/zone locations
  - device groups
  - improvement stats

## Required Atomic Commands

- `createCropBatchWithDependencies`
- `assignSensorGroupToBatch`
- `submitHarvestFeedback`
- `resetDemoData`

## Acceptance Checks

- User-created crops survive refresh.
- Custom plants survive refresh.
- Farm locations survive refresh.
- Device connections survive refresh.
- Harvest checks survive refresh.
- Demo reset restores seed state.
- Atomic commands update all affected records together.
- Mock API functions return promises with small deterministic delays.

