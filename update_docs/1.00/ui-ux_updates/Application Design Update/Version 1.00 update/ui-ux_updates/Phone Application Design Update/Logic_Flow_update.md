# Logic Flow Update – Phone Application v1.00

## Overview
The Version 1.00 phone app introduces a modular routing stack, offline-aware repositories, and analytics instrumentation aligned with the design overhaul. Logic updates ensure UI flows remain performant and intuitive while supporting future scalability.

## Navigation Enhancements
- Adopt **GoRouter** with declarative routes for top-level destinations (feed, explorer, marketplace tabs, launchpad, volunteering, profile, auth). Nested routes handle opportunity details and modals.
- Implement **state restoration** for bottom navigation: `RestorableInt` retains active tab; lists preserve scroll position via `PageStorageKey`.
- Introduce **modal route layering**: Search overlay, notifications sheet, offline overlay use `showModalBottomSheet` with `useSafeArea: true` to respect device cutouts.

## Data Fetching & Caching
- Expand repository layer to support `CachePolicy.freshness(duration: 5 minutes)` ensuring quick revisit performance.
- Feed and marketplace controllers expose unified `AsyncValue<ResourceState<T>>` pattern, enabling UI to respond to `loading`, `error`, `fromCache`, `success` states.
- Preload Launchpad and Volunteering metrics after login via background tasks; display progress spinners until data arrives.

## Interaction Logic
- Filter chips trigger `debounce(150ms)` before fetching to avoid excessive requests.
- Pull-to-refresh actions bypass cache and set `forceRefresh=true` on controllers; success triggers UI toast.
- CTA actions emit analytics events with payload `{screen, action, entityId, entityType}` before executing navigation or API call.
- Offline detection toggles `OfflineBanner` across all lists and prevents destructive actions (apply/pitch) with disabled CTA and explanatory tooltip.

## Error Handling
- Distinguish between recoverable (network, timeout) and critical (auth revoked) errors. Recoverable errors show inline banners; critical errors route to full-screen overlay with support CTA.
- Provide retry callbacks for each major screen, hooking into repository `refresh()` methods.

## Security & Compliance
- Admin login uses OTP delivered via secure endpoint; UI timer enforces 60s wait before resending.
- Company registration ensures legal documents uploaded before enabling program posting; forms handle document preview and status badges.

## Analytics & Instrumentation
- Integrate event naming with data team spec: e.g., `feed_post_engaged`, `search_query_submitted`, `opportunity_cta_tap`, `launchpad_milestone_checked`, `volunteer_hours_logged`.
- Screen view events triggered on `initState` using central `analytics.trackScreen(screenName, route)`. Modal overlays track as `sheet` type events.

## Performance Considerations
- Use `SliverList` for feed and marketplace to reduce memory usage; virtualization ensures smooth scroll.
- Pre-cache hero images using `cached_network_image` with LRU cache (max 100MB) to avoid redundant fetches.
- Limit animation rebuilds by leveraging `ValueListenableBuilder` for counters and progress bars.
