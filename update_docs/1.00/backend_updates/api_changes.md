# Backend API Changes – Communication & Engagement Suite

## Authentication Envelope
- Added JWT + `x-actor-id` dual resolution in `authenticate.js`, allowing service accounts and background jobs to call APIs via explicit actor headers while still preferring Bearer tokens.
- Standardised `AuthorizationError` responses for expired or malformed tokens, surfacing `401` with actionable messages consumed by web/mobile clients.

## Messaging APIs
- `GET /api/messaging/threads` now returns unread counts, support-case metadata (priority, status, assigned agent), and last message timestamps for inbox rendering.
- `POST /api/messaging/threads` accepts subject, optional metadata, and channel type; escalations seeded with `supportCase` payloads to drive auto triage.
- `GET /api/messaging/threads/:threadId/messages` streams paginated messages ordered descending by creation date, including attachment metadata placeholders for future file delivery.
- `POST /api/messaging/threads/:threadId/messages` persists messages, attaches optimistic UUIDs for the client, and invalidates cached thread state.
- Support workflows expose:
  - `POST /api/messaging/threads/:threadId/escalate` – upgrades a thread to support escalation with SLA timers.
  - `POST /api/messaging/threads/:threadId/assign-support` – assigns internal agent ownership.
  - `POST /api/messaging/threads/:threadId/support-status` – updates status/resolution timeline.
  - `POST /api/messaging/threads/:threadId/state` – toggles thread state (open, snoozed, archived) for user inbox hygiene.
  - `POST /api/messaging/threads/:threadId/mute` – stores muted flag with expiry for notification throttling.

## Feed APIs
- `GET /api/feed` (with optional pagination params) returns rank-scored posts, aggregated metrics, and viewer state fields (`reaction`, `hasShared`).
- `GET /api/feed/:postId` exposes the same payload for a single post, leveraging cached rank expressions and viewer lookups.
- `POST /api/feed` allows authenticated members to create posts with visibility scopes and metadata.
- `POST /api/feed/:postId/reactions` toggles a reaction type and returns the active state to guide optimistic UI.
- `DELETE /api/feed/:postId/reactions` clears a viewer’s reaction, aligning metrics after toggles.
- `POST /api/feed/:postId/comments` supports threaded comments with parent ID, metadata, and audit logging.
- `GET /api/feed/:postId/comments` delivers paginated comment trees with author profiles.
- `POST /api/feed/:postId/share` records shares (feed or external channel) and increments viewer state to avoid duplicates.
- `POST /api/feed/:postId/moderation` logs moderation decisions (hide, restore, escalate) with reason codes and actor attribution.

## Profile APIs
- `GET /api/users/:id` profile overview payload now includes `metrics.engagementRefreshedAt` and `metrics.engagementStale` flags alongside refreshed `likesCount`/`followersCount`, reflecting the background aggregation job state so clients can display live counters without manual polling.

## Trust & Escrow APIs
- `POST /api/trust/escrow/accounts` creates or retrieves escrow accounts per provider with currency alignment, returning balances and reconciliation metadata for the Trust Center.
- `POST /api/trust/escrow/transactions` books new escrow transactions, applying fee/net calculations and scheduling release windows.
- `POST /api/trust/escrow/transactions/:transactionId/release` triggers releases with actor attribution, updates audit trails, and decrements held balances.
- `POST /api/trust/escrow/transactions/:transactionId/refund` issues refunds with mirrored audit logging while clearing pending release totals.
- `POST /api/trust/disputes` opens dispute cases with stage, status, and deadline scaffolding to power mediation workflows.
- `POST /api/trust/disputes/:disputeId/events` logs dispute actions, uploads evidence to Cloudflare R2, and optionally advances stages/statuses or applies escrow resolutions.
- `GET /api/trust/overview` surfaces aggregated escrow totals, dispute workload, release ageing buckets, and queue snapshots for the React Trust Center dashboard.

## Freelancer Order Pipeline APIs
- `GET /api/freelancer/order-pipeline` returns gig orders for a freelancer (with optional lookback filtering), enriched with requirement, revision, escrow collections, and derived metrics that power the dashboard columns.【F:gigvora-backend-nodejs/src/controllers/freelancerController.js†L17-L24】【F:gigvora-backend-nodejs/src/services/freelancerOrderPipelineService.js†L109-L158】
- `POST /api/freelancer/order-pipeline/orders` creates a new gig order, normalising currencies, intake/kickoff statuses, optional tags, and nested requirement/revision/escrow payloads in a single transaction.【F:gigvora-backend-nodejs/src/controllers/freelancerController.js†L26-L34】【F:gigvora-backend-nodejs/src/services/freelancerOrderPipelineService.js†L318-L418】
- `PATCH /api/freelancer/order-pipeline/orders/:orderId` updates lifecycle fields such as pipeline stage, delivery timestamps, CSAT, and client touchpoints while recomputing metrics for the dashboard view.【F:gigvora-backend-nodejs/src/controllers/freelancerController.js†L36-L40】【F:gigvora-backend-nodejs/src/services/freelancerOrderPipelineService.js†L437-L618】
- `POST /api/freelancer/order-pipeline/orders/:orderId/requirement-forms` / `PATCH .../:formId` manage automated requirement forms, promoting statuses and stamping submission/approval times for intake SLAs.【F:gigvora-backend-nodejs/src/controllers/freelancerController.js†L42-L52】【F:gigvora-backend-nodejs/src/services/freelancerOrderPipelineService.js†L420-L512】
- `POST /api/freelancer/order-pipeline/orders/:orderId/revisions` / `PATCH .../:revisionId` capture revision requests, auto-increment revision numbers, and close them when approved to unblock delivery progress.【F:gigvora-backend-nodejs/src/controllers/freelancerController.js†L54-L64】【F:gigvora-backend-nodejs/src/services/freelancerOrderPipelineService.js†L514-L566】
- `POST /api/freelancer/order-pipeline/orders/:orderId/escrow-checkpoints` / `PATCH .../:checkpointId` configure escrow milestones, enforce status transitions, and log release actors/amounts tied to client satisfaction gates.【F:gigvora-backend-nodejs/src/controllers/freelancerController.js†L66-L76】【F:gigvora-backend-nodejs/src/services/freelancerOrderPipelineService.js†L568-L618】

## Project & Auto-Assign APIs
- `PATCH /api/projects/:projectId` now updates project metadata (title, description, status, budget, geo) while emitting transactional assignment events and optionally regenerating the auto-assign queue in the same commit.
- `PATCH /api/projects/:projectId/auto-assign` continues to toggle the auto-assign programme but now emits `auto_assign_enabled` and `auto_assign_queue_regenerated` events when re-running the queue.

## Experience Launchpad APIs
- `POST /api/launchpad/applications` scores talent submissions against programme eligibility, persists readiness snapshots, and prevents duplicate active applications.
- `PATCH /api/launchpad/applications/:applicationId/status` advances candidates through screening/interview/acceptance workflows while capturing mentor assignments and interview slots.
- `POST /api/launchpad/employers` records employer briefs (headcount, engagement types, timelines) and triggers dashboard refreshes for Launchpad operations.
- `POST /api/launchpad/placements` links accepted fellows to employer briefs/opportunities, updates candidate status, and auto-creates opportunity links for reporting.
- `POST /api/launchpad/opportunities` allows operations to link existing jobs/gigs/projects to a cohort for analytics and surfacing in discovery experiences.
- `GET /api/launchpad/dashboard` aggregates pipeline, placement, interview, employer brief, and opportunity metrics for the React Launchpad insights panel.
