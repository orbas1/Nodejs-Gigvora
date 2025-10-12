# Migration Updates – Communication & Engagement Suite

## `20240801090000-feed-engagement.cjs`
- Creates feed engagement schema:
  - `feed_posts` with foreign key to `users`, JSON metadata column, and indexes for `createdAt` + `visibility`.
  - `feed_reactions` with composite unique index on (`postId`, `userId`) and enumerated `reactionType`.
  - `feed_comments` supporting nested replies via `parentId` self-reference and soft delete column `deletedAt` for moderation.
  - `feed_shares` capturing `channel`, optional message, and timestamp for analytics.
  - `feed_activity_logs` storing moderation and engagement actions for auditing.
- Down migration drops tables in reverse dependency order ensuring referential integrity.
- Migration tested against SQLite (local), MySQL, and Postgres dialects via Sequelize CLI to confirm compatibility with existing pipelines.

## `20240801090000-trust-payments.cjs`
- Creates trust schema:
  - `escrow_accounts` (userId, provider, status enum, currency, balances, reconciliation timestamp, metadata).
  - `escrow_transactions` (accountId, reference, type enum, status enum, gross/net amounts, counterparties, milestone metadata, audit trail JSON).
  - `dispute_cases` (escrowTransactionId, stage enum, status enum, priority enum, deadlines, resolution notes, metadata).
  - `dispute_events` (disputeCaseId, actor metadata, action enum, evidence storage fields, event timestamp, metadata).
- Down migration drops tables then enums to keep Postgres deployments clean; helper drops enum types conditionally to avoid MySQL/SQLite errors.
- Validated via Jest + Sequelize sync using SQLite along with manual MySQL/Postgres dry runs to ensure cross-dialect compatibility and referential integrity.

## `20240826094500-launchpad-workflows.cjs`
- Extends `experience_launchpads` with programme metadata (programme type, status, application URL, mentor lead, schedule, capacity, eligibility criteria, sponsorship, published timestamp).
- Creates launchpad-specific tables: `experience_launchpad_applications`, `experience_launchpad_employer_requests`, `experience_launchpad_placements`, and `experience_launchpad_opportunity_links` with enum-backed statuses and indexes for operational reporting.
- Down migration removes new tables, drops added columns, and clears Postgres enum types, ensuring reversible deployments across PostgreSQL, MySQL, and SQLite test environments.

## `20240915094500-profile-engagement-metrics.cjs`
- Creates `profile_appreciations` and `profile_followers` tables with appreciation/follower enums, metadata JSON, and unique indexes to prevent duplicate engagements.
- Introduces `profile_engagement_jobs` with scheduled timestamps, priority, lock metadata, and retry counters so background workers can safely coordinate recalculations across deployments.
- Adds `engagementRefreshedAt` to `profiles` and removes the new enums during down migrations to maintain compatibility across SQLite (tests), MySQL, and Postgres.
