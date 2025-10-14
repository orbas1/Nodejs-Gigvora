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

## launchpadService.js (New)
- Scores Experience Launchpad applicants using programme eligibility criteria, maintains readiness snapshots, and prevents duplicate active submissions per cohort.
- Provides employer brief intake, placement orchestration, and opportunity linking helpers that invalidate caches and emit analytics-friendly payloads for dashboards.
- Aggregates launchpad pipeline metrics, placement performance, employer brief backlog, upcoming interviews, and opportunity breakdowns consumed by the new React insights panel.

## discoveryService.js
- Reused the search index `isRemoteRole` helper to calculate remote badges for jobs, gigs, projects, and volunteering entries when geo data omits remote flags, fixing test coverage gaps introduced during launchpad ingestion.

## searchIndexService.js
- Exported `isRemoteRole` so discovery and search indexing use a single remote-detection implementation, keeping DTO and Meilisearch document logic aligned.

## searchSubscriptionService.js
- Sanitiser now deduplicates array-based filters (employment types, categories, regions, etc.) when storing subscriptions, preventing redundant values from surfacing in public objects and aligning with React filter chips.

## profileService.js
- Normalises skill payloads by serialising sanitised arrays into JSON strings prior to persistence so Sequelize TEXT columns accept writes from the React profile editor overlay.
- Recomputes trust-score breakdowns, profile completion, and availability metadata after every update, refreshing cache entries and Experience Launchpad/Volunteer readiness dashboards without manual invalidation.
- Schedules engagement recomputation whenever cached metrics go stale, delegating to the new profile engagement service so likes/followers counters are refreshed asynchronously.
- Captures before/after profile snapshots so trust-score deltas, breakdown changes, and targeting segment transitions emit structured analytics events without blocking transactional writes.

## profileEngagementService.js (New)
- Aggregates likes and followers via `profile_appreciations` and `profile_followers` tables, updating `profiles` with fresh counts and `engagementRefreshedAt` timestamps.
- Provides helper methods for recording appreciations/followers, queueing recalculations, and running a resilient worker loop that retries failed jobs with exponential back-off.
- Emits analytics events for every recalculation, including job reasons, likes/followers deltas, and targeting funnel shifts powered by the new profile analytics helpers.

## profileAnalyticsService.js (New)
- Centralises trust score, engagement refresh, and targeting funnel instrumentation, producing normalised snapshots and diff metadata for analytics ingestion.
- Exposes helpers used by profile and engagement services to record trust delta events, funnel transitions, and queue-driven refresh telemetry while shielding core flows from analytics failures.

## agencyDashboardService.js
- Added a `buildFinanceControlTower` assembler that merges escrow summaries, finance overview snapshots, and scheduled `FinancePayoutBatch`/`FinancePayoutSplit` data into a single payload covering revenue, expenses, runway reserves, payout distribution, and tax export metadata.
- API response now includes the finance control tower block, exposing totals, top recipients, role allocation, and upcoming payout batches with deterministic currency handling.
- Hardened edge cases for empty finance data by normalising values, ensuring scheduled batches without splits still surface, and enriching tax export history with download URLs for the React dashboard.
