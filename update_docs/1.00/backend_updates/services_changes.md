# Backend Service Changes – Version 1.00 Communication & Engagement

## feedService.js (New)
- Provides cached, ranking-aware feed listing with dialect-agnostic engagement scoring.
- Exposes post creation, reaction toggling, share tracking, comment creation, comment pagination, and moderation helpers.
- Records engagement analytics via `FeedActivityLog` and flushes cache namespaces (`feed:list`, `feed:post:<id>`, `feed:comments:<id>`).

## messagingService.js
- Viewer state now includes `userId` so clients can determine ownership when rendering messages.
- Thread cache invalidation reused by feed service to ensure messaging counts stay accurate after engagement actions.
- Support notification queue safeguarded; `markThreadRead` continues to run within transactions while using the new auth context.

## auth middleware integration
- Middleware resolves JWT or `X-Actor-Id` headers and fetches the associated user record before handing off to downstream services.
- Services relying on `req.user` (messaging, feed) now receive consistent user context in both controllers and tests.

## trustService.js (New)
- Encapsulates escrow lifecycle logic: account creation, transaction initiation, release/refund operations, and audit trail enrichment.
- Provides dispute management utilities covering case creation, event logging, Cloudflare R2 evidence uploads, stage/status transitions, and linked escrow resolutions.
- Exposes `getTrustOverview` to aggregate escrow totals, dispute load, and release ageing metrics for consumption by operational dashboards.

## projectService.js
- Introduced transactional helpers to queue assignment events after commit, normalise fairness weights, and regenerate auto-assign queues without losing actor attribution.
- `updateProjectDetails` now centralises metadata edits, budget governance, and queue refresh logic so project management surfaces remain in sync with a single service call.
- Auto-assign enable/disable flows share the new helpers, emitting `auto_assign_enabled`, `auto_assign_queue_regenerated`, and change-tracking events for auditability.
- Project creation now requires an authenticated actor (or explicit `actorId` override) and persists `ownerId` so downstream dashboards and queue summaries resolve the correct account context.

## dashboardService.js (New)
- Aggregates owned projects, fairness queue metrics, saved-search subscriptions, and recent assignment events for authenticated users.
- Normalises Sequelize models into dashboard-ready payloads, including budget totals, status breakdowns, and queue expiry windows for the React workspace.
