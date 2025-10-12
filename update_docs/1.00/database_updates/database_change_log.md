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

## 2024-08-26 – Experience Launchpad Schema
- Extended `experience_launchpads` with programme metadata (programme type, status, application URL, mentor lead, start/end dates, capacity, eligibility criteria, sponsorship, published timestamp) to support readiness scoring and scheduling.
- Created `experience_launchpad_applications` (status enums, qualification scores, skills JSON, mentor assignments, interview slots) and `experience_launchpad_employer_requests` (headcount, engagement types, SLA commitments, metadata).
- Added `experience_launchpad_placements` (targetType enum, placement lifecycle, compensation JSON, feedback) and `experience_launchpad_opportunity_links` (target linking + provenance) powering dashboards and opportunity surfacing.
