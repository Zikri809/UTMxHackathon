# Harvest Calendar Page Specs

Use these files as the page-by-page product plan for the frontend proof of concept.

For implementation, use the phase-by-phase task backlog in `../../task/README.md`.

Recommended build order:

1. [App Foundation](00_APP_FOUNDATION.md)
2. [Root Page](07_ROOT_PAGE.md)
3. [Today Page](01_DASHBOARD_PAGE.md)
4. [Crops List Page](03_CROPS_LIST_PAGE.md)
5. [Add Crop Page](04_ADD_CROP_PAGE.md)
6. [Crop Detail Page](05_CROP_DETAIL_PAGE.md)
7. [Devices & Locations Page](09_SENSORS_PAGE.md)
8. [Harvest Plan Page](02_CALENDAR_PAGE.md)
9. [Improvements Page](06_LEARNING_PAGE.md)
10. [Coherence Review And Flow Contracts](10_COHERENCE_REVIEW_AND_FLOW_CONTRACTS.md)
11. [Business Analyst Viability Review](11_BUSINESS_ANALYST_VIABILITY_REVIEW.md)
12. [User-Friendly Product Plan](12_USER_FRIENDLY_PRODUCT_PLAN.md)
13. [Page Assembly Checklist](08_PAGE_ASSEMBLY_CHECKLIST.md)

The specs assume:

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- mocked API calls
- mocked estimate behavior
- custom plant profiles
- custom farm locations
- device-to-crop connection
- crop edit/archive/cancel/failed states
- deterministic lifecycle and not-ready harvest check behavior
- demo reset
- local storage persistence for demo writes
- intent-preserving deep links for harvest checks and device connection
- shared selectors for lifecycle, device connection, health, and harvest-check state
- list-level harvest estimate summaries for Today, Crops, and Harvest Plan
- a focused business wedge around CEA harvest planning, not broad AI farming
- plain-language user-facing labels so growers do not need to understand technical internals

The minimum demo path is:

```text
/dashboard -> /crops/new -> /crops/[batchId] -> /sensors?batchId=[batchId] -> /calendar?batchId=[batchId] -> /crops/[seeded-spinach-id]?tab=feedback -> /learning?plantProfileId=[spinach-profile-id]
```

Use the Devices & Locations step as a concrete verification or connection moment, not a generic detour.
