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

## Trust & Escrow APIs
- `POST /api/trust/escrow/accounts` creates or retrieves escrow accounts per provider with currency alignment, returning balances and reconciliation metadata for the Trust Center.
- `POST /api/trust/escrow/transactions` books new escrow transactions, applying fee/net calculations and scheduling release windows.
- `POST /api/trust/escrow/transactions/:transactionId/release` triggers releases with actor attribution, updates audit trails, and decrements held balances.
- `POST /api/trust/escrow/transactions/:transactionId/refund` issues refunds with mirrored audit logging while clearing pending release totals.
- `POST /api/trust/disputes` opens dispute cases with stage, status, and deadline scaffolding to power mediation workflows.
- `POST /api/trust/disputes/:disputeId/events` logs dispute actions, uploads evidence to Cloudflare R2, and optionally advances stages/statuses or applies escrow resolutions.
- `GET /api/trust/overview` surfaces aggregated escrow totals, dispute workload, release ageing buckets, and queue snapshots for the React Trust Center dashboard.
