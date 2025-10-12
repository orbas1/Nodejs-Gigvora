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

## `20240901120000-add-project-owner.cjs`
- Adds nullable `ownerId` to `projects` with FK to `users` and supporting index `projects_owner_id_idx`.
- Ensures existing data remains valid while enabling dashboards and queue analytics to scope by authenticated owner.
- Down migration removes the index and column in a single transaction across dialects.
