# Backend Change Log – Version 1.00 Programme Deliverables

## Summary
- Introduced authenticated messaging and feed engagement endpoints to complete Task 2 of the programme roadmap.
- Added JWT-aware middleware so every messaging and feed interaction inherits consistent user context and audit trails.
- Expanded the feed domain with reactions, comments, shares, and activity logging to power ranking, analytics, and moderation workflows.
- Hardened caching, pagination, and notification triggers around the messaging service to support floating inbox clients and support escalation SLAs.
- Delivered the first production slice of the Trust, Payments & Infrastructure milestone with escrow accounts, transactions, dispute case management, and Cloudflare R2-backed evidence storage powering a new Trust Center API surface.
- Built end-to-end Experience Launchpad workflows with readiness scoring, employer briefs, placements, and dashboard insights backed by dedicated models, services, routes, and seeded telemetry.

## Notable Enhancements
1. **Authentication & Session Propagation**  
   - New `authenticateOptional` / `requireAuth` middleware validates Bearer tokens and `X-Actor-Id` fallbacks, attaching user context to Express requests.  
   - Messaging routes now require authentication, preventing anonymous thread creation or escalation.

2. **Feed Engagement Service**  
   - Created `feedService.js` for ranking-aware feed retrieval, reaction toggling, comment creation, share tracking, and moderation metadata handling.  
   - Service integrates cache invalidation (`appCache`) and dialect-aware SQL expressions to keep ranking deterministic across SQLite (tests) and production (Postgres/MySQL).

3. **Controller & Route Updates**  
   - Replaced `feedController` with a contract-driven implementation covering listing, post detail, reactions, comments, share composer, and moderation APIs.  
   - Extended `feedRoutes` with RESTful endpoints and enforced auth on write operations; messaging routes now mount the auth middleware.

4. **Data Model & Persistence**  
   - Added Sequelize models and associations for `FeedComment`, `FeedReaction`, `FeedShare`, and `FeedActivityLog` with Postgres-friendly JSONB fallbacks to JSON for other dialects.  
   - Authored migration `20240801090000-feed-engagement.cjs` creating relational tables, enums, and indexes for engagement metrics and audit trails.

5. **Test Coverage**
   - Added Jest suites for `feedService` and `feedController` plus updated messaging controller tests to use issued JWTs.
   - CI now verifies the full engagement lifecycle (post → reaction → comment → share → moderation) and ensures inbox endpoints respect auth requirements.

## Trust, Payments & Compliance Enhancements
1. **Escrow Domain Models & Persistence**
   - Added Sequelize models for `EscrowAccount`, `EscrowTransaction`, `DisputeCase`, and `DisputeEvent` with associations to users, projects, and gigs, ensuring referential integrity and auditability across trust flows.
   - Authored migration `20240801090000-trust-payments.cjs` to create escrow/dispute tables, enums, indexes, and lifecycle columns compatible with Postgres, MySQL, and SQLite test environments.

2. **Cloudflare R2 Evidence Storage**
   - Introduced `r2Client.js` leveraging `@aws-sdk/client-s3` and presigned URLs to persist dispute evidence in Cloudflare R2 with one-hour signed retrieval links and lifecycle-aware metadata.
   - Dispute events now capture evidence keys, content metadata, and upload outcomes, allowing compliance teams to audit attachments without leaking internal storage paths.

3. **Trust Service Layer & APIs**
   - Implemented `trustService` with transactional helpers to create escrow accounts, initiate/fund transactions, release or refund balances, open disputes, append events, and compute programme-level trust analytics.
   - Created REST controllers/routes under `/api/trust` exposing escrow account creation, transaction lifecycle actions, dispute creation, dispute event logging, and an aggregated overview endpoint consumed by the new Trust Center.

4. **Analytics & Operational Reporting**
   - Trust overview aggregates escrow totals by status, dispute load by stage, release aging buckets, and dispute queues with transaction context to feed the operations dashboard.
   - Audit trails were enriched across escrow actions (initiate, release, refund, dispute events) capturing actor IDs, notes, and timestamps for compliance reporting and ledger reconciliation.

5. **Automated Validation**
   - Added Jest suites for `trustService` covering escrow initiation, release/refund paths, dispute creation, evidence uploads (with mocked R2), and reconciliation of account balances.
   - Regression run now spans seven service suites with 12 passing tests, guaranteeing escrow maths and dispute workflows remain deterministic across migrations.
6. **Operational Enablement**
   - Authored Trust & Escrow operations runbook documenting daily checks, release/refund procedures, dispute escalation paths, and compliance retention policies for finance and support teams.
   - Trust Center dashboard now aligns with runbook guidance, enabling on-call staff to action releases and disputes directly from the new UI.

## Project Management Enhancements
1. **Transactional Project Updates**
   - `projectService` gained queue-aware helpers (`enableAutoAssignForProject`, `disableAutoAssignForProject`, `extractAutoAssignSettingsPayload`) so project creation, toggles, and metadata edits all reuse the same fairness logic and after-commit event persistence.
   - `updateProjectDetails` now handles title/description/status/budget/location updates, emits structured `updated` events, and regenerates auto-assign queues when budgets or fairness settings change.

2. **API & Controller Layer**
   - `projectController.update` and `PATCH /api/projects/:projectId` were added to expose the transactional update surface, allowing the React workspace to edit scopes and fairness settings without juggling multiple endpoints.
   - Auto-assign toggles now surface enriched payloads (queue entries, regenerated settings) through the controller to avoid additional fetches from the client.

3. **Event Telemetry & Tests**
   - New `auto_assign_queue_regenerated` event type powers analytics around fairness tuning, while `updated` events now capture field-level change history.
   - Added Jest coverage in `tests/projectService.test.js` validating metadata updates, queue regeneration, disable/enable flows, and event emission alongside the existing auto-assign suite.

## Experience Launchpad Workflows
1. **Launchpad Domain & Persistence**
   - Expanded `experience_launchpads` with programme metadata (status, programme type, eligibility criteria, sponsorship, dates, capacity) and introduced dedicated tables for applications, employer requests, placements, and opportunity links.
   - Authored migration `20240826094500-launchpad-workflows.cjs` plus seeder updates that populate exemplar cohorts, applicants, employer briefs, placements, and opportunity links so analytics dashboards surface realistic launch data.
2. **Service & API Layer**
   - Delivered `launchpadService` handling readiness scoring, duplicate protection, employer intake, placement orchestration, and insights aggregation exposed via the new `/api/launchpad` application, employer, placement, opportunity, and dashboard routes.
   - Added `launchpadController` and `launchpadRoutes` ensuring parity with caching and analytics hooks so dashboards refresh when submissions, briefs, or placements change.
3. **Quality & Telemetry**
   - Added Jest coverage (`tests/launchpadService.test.js`) validating scoring logic, status transitions, employer brief capture, placement linkage, and dashboard rollups across SQLite.
   - Seed data now exercises the full workflow, unlocking dashboard telemetry in development/staging environments and enabling deterministic CI coverage for the new domain.

## Discovery & Search Hardening
1. **Remote Detection Parity**
   - Exported the search index `isRemoteRole` utility and reused it inside `discoveryService` DTO mapping to eliminate inconsistent remote flags between Meilisearch documents and REST payloads.
2. **Filter Sanitisation**
   - Updated `searchSubscriptionService` to deduplicate array-based filters during sanitisation so stored subscriptions and API responses no longer surface duplicate values (e.g. repeated employment types) when React chips rehydrate state.
3. **Launchpad Scoring Coverage**
   - Adjusted the launchpad service tests to assert auto-accept behaviour when candidates meet experience and skill thresholds, mirroring the production scoring thresholds defined in the eligibility criteria.

## Profiles & Employment Systems
1. **Holistic Profile Updates**
   - Hardened `profileService.updateProfile` so sanitised skill inventories are serialised into JSON strings before persisting to Sequelize TEXT columns, eliminating SQLite validation failures and unlocking the React Profile Editor overlay.
   - Trust-score recomputation now executes after every profile write, repopulating completion metrics and breakdown metadata that feed Experience Launchpad eligibility and Volunteer Hub readiness dashboards.
2. **Quality Gates**
   - Backend regression suite (`npm test -- --runInBand`) runs green across 13 suites/37 tests following the profile pipeline fix, protecting the availability normaliser, reference synchronisation, and cache refresh logic from regressions.
3. **Engagement Aggregation**
   - Added appreciation/follower schemas (`profile_appreciations`, `profile_followers`) plus a queue-backed aggregation worker that recalculates likes/followers counters and stamps `engagementRefreshedAt` whenever new events arrive.
   - `profileEngagementService` exposes helpers for recording appreciations/follows, batching recalculations, and signalling stale metrics; `profileService.getProfileOverview` now schedules refreshes automatically while metrics are cached for clients.
4. **Analytics Instrumentation**
   - Introduced `profileAnalyticsService` to emit structured analytics events for trust score deltas, engagement refreshes, and targeting funnel transitions, wiring those payloads into the analytics warehouse and downstream dashboards.
   - Updated `profileService` and `profileEngagementService` to capture before/after snapshots, compute funnel diffs, and enqueue instrumentation after transactions; Jest suites assert event payloads and queue reasons to guard regression risk.
