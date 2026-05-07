# Implementation Task Roadmap

## Purpose

This directory turns the product and page plans into implementation-ready work. Each task has clear dependencies, deliverables, and acceptance checks so the frontend can be built phase by phase without rediscovering the plan.

Primary planning sources:

- `docs/frontend-pages/00_APP_FOUNDATION.md`
- `docs/frontend-pages/10_COHERENCE_REVIEW_AND_FLOW_CONTRACTS.md`
- `docs/frontend-pages/11_BUSINESS_ANALYST_VIABILITY_REVIEW.md`
- `docs/frontend-pages/12_USER_FRIENDLY_PRODUCT_PLAN.md`
- `docs/frontend-pages/08_PAGE_ASSEMBLY_CHECKLIST.md`

## Phase Order

### Phase 1: Foundation And Data Contracts

Goal: create the app skeleton, shared UI shell, domain types, mock API boundary, local storage persistence, query hooks, and shared selectors.

Tasks:

1. `TASK-01_PROJECT_SETUP.md`
2. `TASK-02_APP_SHELL_AND_UI_SYSTEM.md`
3. `TASK-03_DOMAIN_TYPES_AND_SELECTORS.md`
4. `TASK-04_MOCK_API_AND_STORAGE.md`
5. `TASK-05_QUERY_HOOKS.md`

Exit criteria:

- App runs.
- Routes exist.
- Navigation uses user-facing labels: Today, Harvest Plan, Crops, Devices & Locations, Improvements.
- Domain data flows only through query hooks and mock API functions.
- Demo reset works at the data layer.

### Phase 2: Core Grower Journey

Goal: implement the main crop planning loop from daily view to crop creation to crop detail and harvest check.

Tasks:

1. `TASK-06_TODAY_PAGE.md`
2. `TASK-07_ADD_CROP_FLOW.md`
3. `TASK-08_CROP_DETAIL_AND_HARVEST_CHECK.md`

Exit criteria:

- User can add a crop with a starter estimate.
- User can connect devices or continue without devices.
- User lands on Crop Detail.
- User can record a harvest result.
- Harvest checks update crop state and improvement stats.

### Phase 3: Operational Planning And Device Clarity

Goal: make the product credible as an operations tool, not just a detail-page demo.

Tasks:

1. `TASK-09_DEVICES_AND_LOCATIONS.md`
2. `TASK-10_HARVEST_PLAN.md`
3. `TASK-11_CROPS_INVENTORY.md`

Exit criteria:

- Device connection can start from any context and preserve crop context.
- Harvest Plan shows expected ready dates and ready windows.
- Crops inventory supports search, filters, and safe lifecycle actions.

### Phase 4: Improvement Story And Demo Polish

Goal: make the business value visible and remove product awkwardness.

Tasks:

1. `TASK-12_IMPROVEMENTS_PAGE.md`
2. `TASK-13_DEMO_RESET_AND_EMPTY_STATES.md`
3. `TASK-14_RESPONSIVE_QA_AND_DEMO_SCRIPT.md`

Exit criteria:

- Improvements page shows starter, getting better, and highly reliable estimate states.
- The demo path works in under 5 minutes.
- UI copy avoids ML, mock API, query invalidation, and sensor-assignment jargon.
- Desktop and mobile layouts are usable.

## Dependency Rules

- Do not build page components before `TASK-03`, `TASK-04`, and `TASK-05` are complete.
- Do not implement Harvest Plan, Crops inventory, or Devices & Locations before `useCropBatchSummaries` exists.
- Do not implement harvest checks before `submitHarvestFeedback` returns the full atomic result.
- Do not expose raw technical enum labels in UI. Use the language mapping from `12_USER_FRIENDLY_PRODUCT_PLAN.md`.

## Required Demo Path

```text
/dashboard
-> /crops/new
-> /crops/[batchId]
-> /sensors?batchId=[batchId]
-> /calendar?batchId=[batchId]
-> /crops/[seeded-spinach-id]?tab=feedback
-> /learning?plantProfileId=[spinach-profile-id]
```

Visible labels for the same path:

```text
Today
-> Add Crop
-> Crop Detail
-> Devices & Locations
-> Harvest Plan
-> Record harvest result
-> Improvements
```

