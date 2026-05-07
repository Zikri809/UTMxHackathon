# TASK-05: Query Keys And Hooks

## Phase

Phase 1: Foundation And Data Contracts

## Goal

Create TanStack Query keys and hooks so pages never import seed data directly.

## Dependencies

- `TASK-02_APP_SHELL_AND_UI_SYSTEM.md`
- `TASK-04_MOCK_API_AND_STORAGE.md`

## Source Docs

- `docs/frontend-pages/00_APP_FOUNDATION.md`
- `docs/frontend-pages/08_PAGE_ASSEMBLY_CHECKLIST.md`

## Deliverables

- `src/lib/query/client.ts`
- `src/lib/query/keys.ts`
- `src/lib/query/hooks.ts`
- Hooks for all required reads and writes, including:
  - `useCropBatchSummaries`
  - `useCreateCropBatchWithDependencies`
  - `useAssignSensorGroupToBatch`
  - `useHarvestFeedback`
  - `useSubmitHarvestFeedback`
  - `useResetDemoData`

## Acceptance Checks

- Query provider wraps all interactive pages.
- Every page reads domain data through hooks.
- Mutations invalidate all affected query keys.
- Reset invalidates every relevant query.
- No UI component imports seed data directly.

