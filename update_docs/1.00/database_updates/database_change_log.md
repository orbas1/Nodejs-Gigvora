# Database Change Log – Communication & Engagement Suite

## 2024-08-01 – Feed Engagement Schema
- Added `feed_posts` table with visibility enum, metadata JSON, and timestamps used for ranking.
- Added `feed_reactions` (postId, userId, reactionType) with unique constraint to enforce single reaction per user/post.
- Added `feed_comments` supporting parent replies, soft deletes, and metadata for attachments.
- Added `feed_shares` recording share channel and message body with unique constraint on (postId, userId, channel) to prevent duplicates.
- Added `feed_activity_logs` capturing actor, action, metadata to power moderation/audit dashboards.
- Migration seeds indexes on engagement tables (postId/userId) to keep feed queries under 50ms on SQLite/MySQL/Postgres.

## Messaging Enhancements
- Extended messaging tables through Sequelize models to surface unread counts and support case metadata; existing schema unchanged but new computed columns/associations defined in models.

## 2024-08-08 – Trust & Escrow Schema
- Introduced `escrow_accounts` with currency, balance, pending release, and reconciliation timestamps plus enums for lifecycle states.
- Added `escrow_transactions` capturing gross/net amounts, fee data, counterparties, milestone metadata, and audit trails.
- Created `dispute_cases` to manage mediation stages, SLA deadlines, resolution notes, and associations with transactions and agents.
- Added `dispute_events` storing actor metadata, action types, evidence storage keys/URLs, and event timestamps for compliance audits.

## 2024-09-01 – Project Ownership & Dashboard Support
- Added `ownerId` to `projects` (nullable for legacy data) with foreign-key linkage to `users`, enabling per-account dashboards and queue telemetry.
- Created `projects_owner_id_idx` to accelerate dashboard lookups and queue aggregation queries.
