# TASK-14: Responsive QA And Demo Script

## Phase

Phase 4: Improvement Story And Demo Polish

## Goal

Verify the complete app across desktop and mobile and lock the 5-minute demo path.

## Dependencies

- `TASK-13_DEMO_RESET_AND_EMPTY_STATES.md`

## Source Docs

- `docs/frontend-pages/08_PAGE_ASSEMBLY_CHECKLIST.md`
- `docs/frontend-pages/11_BUSINESS_ANALYST_VIABILITY_REVIEW.md`
- `docs/frontend-pages/12_USER_FRIENDLY_PRODUCT_PLAN.md`

## Deliverables

- Manual QA checklist.
- Final demo script.
- Responsive fixes for desktop and mobile.
- Copy pass to remove product-facing jargon.
- Final smoke-test notes.

## Required Smoke Test

```text
1. Open Today.
2. Add a new lettuce crop.
3. Connect or skip devices.
4. Land on Crop Detail.
5. Verify expected ready date, ready window, reliability, conditions, and device connection.
6. Open Devices & Locations and verify connection context.
7. Open Harvest Plan and verify the crop appears.
8. Open seeded spinach crop with harvest check needed.
9. Record harvest result.
10. Open Improvements and verify stats changed.
11. Reset demo data.
```

## Acceptance Checks

- Demo path works in under 5 minutes.
- No visible copy mentions ML, mock API, TanStack Query, mutation, or query invalidation.
- Technical enum labels never appear in UI.
- Mobile layout has no overlapping text or broken controls.
- Desktop layout prioritizes scanability and actions.
- Final implementation is ready for hackathon judging.

