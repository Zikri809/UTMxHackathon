# TASK-09: Devices And Locations

## Phase

Phase 3: Operational Planning And Device Clarity

## Goal

Build the Devices & Locations page so users can see where devices are and connect them to crops without technical confusion.

## Dependencies

- `TASK-05_QUERY_HOOKS.md`
- `TASK-08_CROP_DETAIL_AND_HARVEST_CHECK.md`

## Source Docs

- `docs/frontend-pages/09_SENSORS_PAGE.md`
- `docs/frontend-pages/10_COHERENCE_REVIEW_AND_FLOW_CONTRACTS.md`
- `docs/frontend-pages/12_USER_FRIENDLY_PRODUCT_PLAN.md`

## Deliverables

- `src/app/sensors/page.tsx`
- `src/components/sensors/sensors-page.tsx`
- `DeviceGroupTable`
- `DeviceTable`
- `FarmLocationTable`
- `ConnectDevicesDialog`
- Missing device connection panel

## Required Deep Links

- `/sensors?batchId=[batchId]`
- `/sensors?action=assign&batchId=[batchId]&returnTo=[encoded-route]`

## Acceptance Checks

- Page title is `Devices & Locations`.
- Crop context is preserved when arriving from Today, Crops, Harvest Plan, or Crop Detail.
- `ConnectDevicesDialog` opens with crop preselected when `action=assign`.
- Reconnecting a device group prompts for confirmation.
- Connection updates previous crop and new crop atomically.
- New farm locations can exist as placement-only.
- UI says `Device group`, `Connect devices`, `Needs review`, and `Not tracked`.

