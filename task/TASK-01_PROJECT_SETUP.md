# TASK-01: Project Setup

## Phase

Phase 1: Foundation And Data Contracts

## Goal

Create the Next.js frontend project structure and install the required frontend stack.

## Dependencies

- None.

## Source Docs

- `docs/frontend-pages/00_APP_FOUNDATION.md`
- `FRONTEND_SYSTEM_DESIGN.md`

## Deliverables

- Next.js App Router project under `src/`.
- TypeScript configured.
- Tailwind CSS configured.
- shadcn/ui initialized.
- Required package dependencies installed:
  - `@tanstack/react-query`
  - `recharts`
  - `lucide-react`
  - `date-fns`
  - shadcn support packages
- Base app routes created:
  - `/`
  - `/dashboard`
  - `/calendar`
  - `/crops`
  - `/crops/new`
  - `/crops/[batchId]`
  - `/sensors`
  - `/learning`

## Acceptance Checks

- `npm run dev` starts successfully.
- Visiting `/` redirects to `/dashboard`.
- All required routes render a temporary placeholder.
- No route renders a marketing landing page.

## Notes

Use visible labels from the user-friendly plan even if route names remain technical.

