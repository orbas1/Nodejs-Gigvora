# Controller Changes – Communication & Engagement Suite

## Feed Controller (`src/controllers/feedController.js`)
- Rewritten to delegate to `feedService` for all feed operations, ensuring consistent caching and audit logging.
- `listFeedController` accepts pagination query params, injects `req.user?.id` to hydrate viewer state, and returns API-friendly payload with metrics and pagination metadata.
- `reactToPostController` toggles reactions and branches to `deleteReactionController` when the same reaction is reselected, aligning with UI optimistic updates.
- `sharePostController` validates share channel, records the share, and returns viewer state for deduplication.
- `moderatePostController` restricts actions to privileged user types and writes moderation metadata for downstream analytics.

## Messaging Controller (`src/controllers/messagingController.js`)
- All endpoints now rely on `requireAuth`; controller functions consume `req.user.id` and pass actor context into service methods for audit trails.
- `listInbox` includes unread counts, support-case metadata, and thread ordering by last activity, enabling the chat bubble preview.
- `openThread` and `listThreadMessages` handle pagination cursors (`before`, `limit`) and enrich messages with sender identity for the UI.
- `createConversation`, `postMessage`, `escalateThread`, and `assignSupport` set analytics metadata (channel type, escalation reason) recorded in service layer.
- `changeThreadState`, `muteConversation`, and `acknowledgeThread` return updated counts, ensuring clients can reconcile optimistic state changes without refetching the entire inbox.

## Trust Controller (`src/controllers/trustController.js`)
- New controller encapsulates escrow lifecycle endpoints (`createEscrowAccount`, `initiateEscrow`, `releaseEscrow`, `refundEscrow`) returning service-layer projections for dashboards.
- `createDispute` and `appendDisputeEvent` map to dispute workflows, forwarding evidence payloads to Cloudflare R2 via the service and returning updated dispute/transaction state.
- `getTrustOverview` consolidates escrow totals, dispute queues, and release ageing buckets into a single payload used by the React Trust Center.

## Project Controller (`src/controllers/projectController.js`)
- Added `update` action to accept partial project updates, hydrate actor IDs, and delegate to the transactional project service so metadata edits, budget adjustments, and queue regeneration happen atomically.
- `toggleAutoAssign` now bubbles up the richer payload emitted by the service (including regenerated queue entries) to keep the new project workspace in sync without an extra fetch.
- All project mutations now rely on `resolveRequestUserId`, preferring the authenticated JWT user while still honouring explicit `actorId` payloads for background jobs.

## Dashboard Controller (`src/controllers/dashboardController.js`)
- New `overview` handler resolves the authenticated user, calls `dashboardService.getDashboardOverview`, and returns a consolidated payload covering owned projects, queue telemetry, saved searches, and recent assignment events.
