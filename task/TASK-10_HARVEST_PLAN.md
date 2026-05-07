# TASK-10: Harvest Plan

## Phase

Phase 3: Operational Planning And Device Clarity

## Goal

Build the calendar/list planning view that shows expected harvest work.

## Dependencies

- `TASK-05_QUERY_HOOKS.md`
- `TASK-08_CROP_DETAIL_AND_HARVEST_CHECK.md`
- `TASK-09_DEVICES_AND_LOCATIONS.md`

## Source Docs

- `docs/frontend-pages/02_CALENDAR_PAGE.md`
- `docs/frontend-pages/12_USER_FRIENDLY_PRODUCT_PLAN.md`

## Deliverables

- `src/app/calendar/page.tsx`
- `src/components/calendar/calendar-page.tsx`
- `CalendarToolbar`
- `CalendarView`
- `CalendarEventChip`
- `CropSummaryDrawer`
- Month, week, and list views if time allows.

## User-Facing Requirements

- Page title: `Harvest Plan`.
- Use `Expected ready date`, `Ready window`, and `Reliability`.
- Use `Updated from conditions`.
- Use `Needs device connection`.
- Use `Record harvest result`.

## Acceptance Checks

- Crop summaries render without N+1 prediction queries.
- Clicking a crop opens a summary drawer.
- Drawer can open crop detail.
- Drawer can route to harvest check.
- Drawer can route to connect devices.
- Cancelled, failed, and archived crops are hidden by default but available through filters.
- Filters do not mutate underlying data.

