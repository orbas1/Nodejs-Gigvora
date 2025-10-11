# Version 1.00 User App – Backend/Service Layer Changes

- Introduced a GraphQL gateway that wraps HTTP and WebSocket links with automatic token propagation hooks, offline caching, and subscription support for mobile parity with the web routes.
- Delivered a realtime gateway with exponential backoff, heartbeat, and topic resubscription logic to power live feed updates in poor network conditions.
- Added a feature flag service backed by offline cache and remote sync endpoints so mobile feature rollout mirrors the web feature governance model.
