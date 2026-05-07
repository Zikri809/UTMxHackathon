# TASK-07: Add Crop Flow

## Phase

Phase 2: Core Grower Journey

## Goal

Let users add a crop through a guided, low-jargon form and land on Crop Detail.

## Dependencies

- `TASK-05_QUERY_HOOKS.md`
- `TASK-06_TODAY_PAGE.md`

## Source Docs

- `docs/frontend-pages/04_ADD_CROP_PAGE.md`
- `docs/frontend-pages/12_USER_FRIENDLY_PRODUCT_PLAN.md`

## Deliverables

- `src/app/crops/new/page.tsx`
- `src/components/crops/add-crop-page.tsx`
- `AddCropForm`
- `EstimatePreview`
- `FarmLocationSelector`
- `DeviceConnectionCard`
- Custom plant flow
- Custom rack/zone flow

## Guided Steps

1. What are you growing?
2. Where is it growing?
3. When did it start?
4. How many plants?
5. Connect devices, optional.
6. Review starter estimate.

## Acceptance Checks

- User can create a crop with catalog plant.
- User can create a custom plant with typical days to ready.
- User can create a farm location inline.
- User can connect a device group or choose `No devices connected yet`.
- Advanced growing ranges are collapsed by default.
- Submit uses `useCreateCropBatchWithDependencies`.
- Success navigates to `/crops/[batchId]`.
- Toast says crop was added with a starter harvest estimate.

