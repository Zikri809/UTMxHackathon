# TASK-11: Crops Inventory

## Phase

Phase 3: Operational Planning And Device Clarity

## Goal

Build the crop inventory page for scanning, searching, filtering, and opening crop details.

## Dependencies

- `TASK-05_QUERY_HOOKS.md`
- `TASK-08_CROP_DETAIL_AND_HARVEST_CHECK.md`
- `TASK-09_DEVICES_AND_LOCATIONS.md`

## Source Docs

- `docs/frontend-pages/03_CROPS_LIST_PAGE.md`
- `docs/frontend-pages/12_USER_FRIENDLY_PRODUCT_PLAN.md`

## Deliverables

- `src/app/crops/page.tsx`
- `src/components/crops/crops-list-page.tsx`
- `CropStatusTabs`
- `CropFilters`
- `CropTable`
- `CropRowActions`
- Mobile crop-card list

## Acceptance Checks

- User can search by plant, variety, rack, and zone.
- User can filter by status, plant type, rack/zone, and device connection.
- User can sort by expected ready date, planted date, reliability, and status priority.
- User can open any crop detail.
- User can connect devices from a row action.
- User can record harvest result from a row action.
- Lifecycle actions are inside a More menu with confirmations.

