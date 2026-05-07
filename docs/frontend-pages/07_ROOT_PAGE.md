# Root Page Build Spec

## Route And File

Route:

```text
/
```

Next.js file:

```text
src/app/page.tsx
```

## Purpose

The root page should send users straight into the product. For this proof of concept, do not build a marketing landing page. The app should feel usable immediately.

## Recommended Behavior

Required default:

```ts
redirect("/dashboard");
```

Fallback only if deployment requires it:

- Render the dashboard page directly if redirect behavior complicates static deployment.
- In this fallback, force the Today navigation item to be active even though the URL is `/`.

## Requirements

- The first visible screen should be the dashboard experience.
- The root route should not introduce a separate layout.
- The root route should not duplicate dashboard logic.
- If redirecting, use Next.js `redirect` from `next/navigation`.

## Acceptance Criteria

- Visiting `/` lands the user on `/dashboard` by default, or shows the dashboard content only for a static-deployment fallback.
- No separate marketing page exists.
- Navigation active state still highlights Today after redirect.
