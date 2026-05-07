# Harvest Calendar Page Specs

Use these files as the page-by-page implementation plan for the frontend proof of concept.

Recommended build order:

1. [App Foundation](00_APP_FOUNDATION.md)
2. [Root Page](07_ROOT_PAGE.md)
3. [Dashboard Page](01_DASHBOARD_PAGE.md)
4. [Crops List Page](03_CROPS_LIST_PAGE.md)
5. [Add Crop Page](04_ADD_CROP_PAGE.md)
6. [Crop Detail Page](05_CROP_DETAIL_PAGE.md)
7. [Sensors Page](09_SENSORS_PAGE.md)
8. [Calendar Page](02_CALENDAR_PAGE.md)
9. [Learning Page](06_LEARNING_PAGE.md)
10. [Page Assembly Checklist](08_PAGE_ASSEMBLY_CHECKLIST.md)

The specs assume:

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- mocked API calls
- mocked ML behavior
- custom plant profiles
- custom farm locations
- sensor-to-crop assignment
- crop edit/archive/cancel/failed states
- deterministic lifecycle and not-ready feedback behavior
- demo reset
- local storage persistence for demo writes

The minimum demo path is:

```text
/dashboard -> /crops/new -> /crops/[batchId] -> /sensors -> /calendar -> /learning
```
