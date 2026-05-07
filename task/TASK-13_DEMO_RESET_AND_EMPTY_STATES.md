# TASK-13: Demo Reset And Empty States

## Phase

Phase 4: Improvement Story And Demo Polish

## Goal

Make the app resilient during demos with clean reset behavior, empty states, loading states, and error states.

## Dependencies

- `TASK-06_TODAY_PAGE.md`
- `TASK-07_ADD_CROP_FLOW.md`
- `TASK-08_CROP_DETAIL_AND_HARVEST_CHECK.md`
- `TASK-09_DEVICES_AND_LOCATIONS.md`
- `TASK-10_HARVEST_PLAN.md`
- `TASK-11_CROPS_INVENTORY.md`
- `TASK-12_IMPROVEMENTS_PAGE.md`

## Source Docs

- `docs/frontend-pages/08_PAGE_ASSEMBLY_CHECKLIST.md`
- Every page-specific spec in `docs/frontend-pages/`

## Deliverables

- `DemoResetDialog`
- Reset action in low-priority menu.
- Loading skeletons for all pages.
- Empty states for all pages.
- Error alerts and retry actions for all query-backed pages.
- Toasts for create, connect devices, harvest check, edit, archive, cancel, failed, and reset flows.

## Acceptance Checks

- Demo reset restores seed crops, plant profiles, farm locations, device groups, condition readings, and improvement stats.
- Empty states are actionable.
- Errors use grower-friendly language.
- Loading states do not flash empty pages.
- Reset does not require a browser hard refresh.

