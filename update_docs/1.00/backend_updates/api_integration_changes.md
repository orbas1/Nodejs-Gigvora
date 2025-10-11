# API Integration Changes – Communication & Engagement Suite

## Client Authentication
- React web now persists JWT via `apiClient` and propagates it to `messagingClient` and `feedClient`; both clients add Bearer headers and fall back to `x-actor-id` when a support operator impersonation is required.
- Axios interceptors normalise `401`/`403` responses, redirecting to login or surfacing inline messaging prompts depending on context.

## Messaging Client Integration
- `useMessagingCenter` hook orchestrates inbox polling, thread selection, message posting, and mutation cache invalidation; integrates analytics for view, compose, send, and escalation events.
- Hook consumes the backend thread schema (unread counts, support case payloads) and merges optimistic messages using temporary client-side IDs until API confirmation.
- Floating chat bubble component lazy-loads the messaging client bundle, keeping initial page weight low while still prefetching threads upon hover/tap.

## Feed Client Integration
- `feedClient` wraps new REST endpoints (`/feed`, `/feed/:id`, `/feed/:id/reactions`, `/feed/:id/comments`, `/feed/:id/share`, `/feed/:id/moderation`).
- Optimistic reaction/comment/share handlers in `FeedPage.jsx` update local state immediately and reconcile with the API response to match server truth.
- Error handling normalises validation errors (e.g., duplicate share attempts, moderation permissions) for display in `DataStatus` and composer toasts.

## Analytics & Telemetry
- Both clients emit structured analytics events (`web_feed_viewed`, `web_feed_reaction_click`, `web_messaging_thread_opened`, etc.) that include cache metadata and viewer states; these events map to the telemetry schema defined in analytics service docs.
- Backend logs feed moderation activity via `FeedActivityLog` and surfaces actor + reason metadata, closing the loop for compliance dashboards and audit trails.

## Trust Center & Compliance Integrations
- Added `trust.js` service in the React client to consume the `/api/trust` endpoints with cache-aware fetches, transaction lifecycle calls, and dispute event submissions.
- Built the Trust Center dashboard that hydrates escrow totals, dispute workload, and release queues from the new overview endpoint while providing inline release actions that call `POST /trust/escrow/transactions/:id/release` with audit metadata.
- Escrow and dispute events propagate analytics via the existing `analyticsService` to track releases, refunds, and evidence uploads for compliance reporting.
