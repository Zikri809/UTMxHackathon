# TASK-02: App Shell And UI System

## Phase

Phase 1: Foundation And Data Contracts

## Goal

Build the shared app layout, navigation, providers, and base UI components.

## Dependencies

- `TASK-01_PROJECT_SETUP.md`

## Source Docs

- `docs/frontend-pages/00_APP_FOUNDATION.md`
- `docs/frontend-pages/12_USER_FRIENDLY_PRODUCT_PLAN.md`

## Deliverables

- `src/app/layout.tsx`
- `src/app/providers.tsx`
- `src/app/globals.css`
- `src/components/layout/app-shell.tsx`
- `src/components/layout/sidebar-nav.tsx`
- `src/components/layout/top-nav.tsx`
- shadcn/ui components installed:
  - button
  - card
  - badge
  - dialog
  - drawer
  - form
  - input
  - select
  - tabs
  - table
  - calendar
  - popover
  - progress
  - skeleton
  - alert
  - separator
  - sonner

## Visible Navigation Labels

- Today -> `/dashboard`
- Harvest Plan -> `/calendar`
- Crops -> `/crops`
- Devices & Locations -> `/sensors`
- Improvements -> `/learning`

## Acceptance Checks

- Every main route renders inside `AppShell`.
- Desktop has a fixed sidebar.
- Mobile has top navigation with drawer menu.
- Active navigation state works.
- `Add Crop` is visible as a primary action.
- UI copy does not expose technical route names as page labels.

