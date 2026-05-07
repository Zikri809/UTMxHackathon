# User-Friendly Product Plan

## Purpose

This document turns the business analyst review into product rules for every page. The app should feel like an operations tool for growers, not a technical demo of sensors, mocks, or machine learning.

Implementation docs can use technical language. The product UI should not.

## Product Principle

Every screen should answer one practical grower question:

```text
What should I do next to keep harvest planning reliable?
```

The user should not need to understand:

- Machine learning.
- Mock APIs.
- Query invalidation.
- Sensor provenance.
- Assignment algorithms.
- Prediction modes.
- Backend architecture.

The app can still use those ideas internally. It should explain them as crop-planning outcomes.

## Navigation Labels

Routes can stay technical, but visible navigation should use plain operational labels.

| Route | Internal Page | User-Facing Label |
|---|---|---|
| `/dashboard` | Dashboard | Today |
| `/calendar` | Calendar | Harvest Plan |
| `/crops` | Crops | Crops |
| `/sensors` | Sensors | Devices & Locations |
| `/learning` | Learning | Improvements |

Notes:

- "Today" makes the dashboard feel like the daily starting point.
- "Harvest Plan" is clearer than "Calendar" because the page is about work planning, not date browsing.
- "Devices & Locations" is clearer than "Sensors" because growers think in racks, zones, rooms, and equipment.
- "Improvements" is friendlier than "Learning" or "Model Learning".

## Plain-Language Vocabulary

Use these user-facing terms:

| Technical Term | Use In UI |
|---|---|
| Prediction | Harvest estimate |
| Predicted harvest date | Expected ready date |
| Harvest window | Ready window |
| Confidence | Reliability |
| Generic baseline | Starter estimate |
| Sensor adjusted | Updated from conditions |
| Learned/adaptive model | Improved from past harvests |
| Model maturity | Estimate quality |
| Feedback | Harvest check |
| Submit feedback | Record harvest result |
| Sensor assignment | Connect devices |
| Sensor group | Device group |
| Sensor readings | Growing conditions |
| Sensor provenance | Where readings come from |
| Ambiguous assignment | Needs device connection |
| Crop batch | Crop batch, or just Crop when space is tight |
| Mock ML | Do not show in UI |
| TanStack Query | Do not show in UI |

Use technical terms only in developer docs, tooltips for advanced users, or implementation comments.

## Copy Rules

- Lead with the outcome, not the mechanism.
- Prefer verbs: "Record harvest result", "Connect devices", "Check crop", "Plan harvest".
- Keep empty states actionable.
- Avoid explaining the whole system in paragraphs.
- Use one-sentence helper text only where the user might be blocked.
- Put advanced controls behind "More details", "Advanced growing ranges", or "View why this changed".
- Never require users to understand why cache, model, sensor, or API state changed.

Bad:

```text
This crop is using a generic_baseline prediction mode with low model maturity.
```

Good:

```text
Starter estimate. Add devices or record harvest results to improve future dates.
```

Bad:

```text
Sensor group assignment is ambiguous.
```

Good:

```text
This crop needs a device connection.
```

Bad:

```text
Submit feedback to update learning stats.
```

Good:

```text
Record the harvest result so future estimates get better.
```

## Progressive Disclosure

Each page should have three layers:

1. Immediate decision: ready soon, needs attention, or on track.
2. Short reason: low light, missing devices, harvest result due, or updated ready date.
3. Details on demand: chart, device group, exact readings, estimate quality, or history.

Do not put all three layers in the first view at once.

## Page-Level UX Rules

### Today

The dashboard should feel like a morning checklist.

Prioritize:

- Ready soon.
- Needs harvest check.
- Needs attention.
- Needs device connection.
- Recently improved estimates.

Avoid:

- Dense technical charts.
- Long explanations of prediction logic.
- Showing inactive crops by default.

### Harvest Plan

The calendar should show when work is expected.

Prioritize:

- What is ready this week.
- Which dates moved.
- Which estimates are reliable.
- Which crops need harvest checks.

Use "Ready window" and "Expected ready date" instead of "prediction" in visible table labels.

### Crops

The crops page is an inventory and search surface.

Prioritize:

- Find a crop quickly.
- See status and ready window.
- Open details.
- Connect devices or record harvest result when needed.

Keep lifecycle actions in a More menu with confirmations so the page does not feel dangerous.

### Add Crop

The form should feel like a guided setup.

Recommended steps:

1. What are you growing?
2. Where is it growing?
3. When did it start?
4. How many plants?
5. Connect devices, optional.
6. Review starter estimate.

Advanced plant ranges should be collapsed by default. The user should be able to create a crop without knowing ideal pH, EC, or light ranges.

### Crop Detail

Crop Detail should answer:

```text
Is this crop on track, and what should I do next?
```

Recommended tabs:

- Overview
- Conditions
- Devices
- History
- Harvest Check
- Settings

Use "View why this changed" for estimate explanations.

### Devices & Locations

This page should not feel like an IoT admin console.

Prioritize:

- Which devices are online.
- Which rack or zone they belong to.
- Which crops still need device connections.
- One clear "Connect devices" flow.

Use "Device group" instead of "sensor group" in visible copy.

### Improvements

This page should show business value without AI jargon.

Prioritize:

- Estimates getting better over repeated harvests.
- Which crops still use starter estimates.
- Recent harvest results that improved future planning.
- Error before vs now, written as "Average miss".

Use "Improved", "Getting better", and "Starter estimate" instead of "adaptive", "learning", and "baseline" as primary labels.

## User-Friendly Acceptance Criteria

- A grower can complete the main demo path without reading technical docs.
- Every page has a clear primary action.
- Every warning tells the user what to do next.
- No visible UI copy mentions mock APIs, TanStack Query, backend, ML, or query invalidation.
- Technical concepts are translated into planning language.
- Advanced plant and device details are available but not required.
- The app can be demoed as an operational planning tool in under 5 minutes.

