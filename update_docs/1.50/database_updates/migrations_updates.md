# Migrations Updates — Version 1.50 Update

## `20241010104500-create-domain-governance-reviews.cjs`
- Creates `domain_governance_reviews` with steward team, data steward contact,
  review status enum (`in_progress`, `approved`, `remediation_required`), review
  timestamps, next-review cadence, JSON scorecard payload, and audit notes.
- Adds indexes on `contextName`, `reviewStatus`, and `nextReviewDueAt` so
  dashboards can surface overdue contexts and filter by remediation state without
  full table scans. Down migration removes indexes, drops the table, and cleans up
  the enum type in Postgres environments.

## `20241015121500-runtime-maintenance-announcements.cjs`
- Creates `runtime_announcements` table with auto-incrementing primary key, unique `slug`, required `title`/`message`, enum-like
  `severity`/`status`, JSON(B) `audiences` and `channels`, optional `startsAt`/`endsAt`, boolean `dismissible`, audit fields
  (`createdBy`, `updatedBy`), and JSON(B) `metadata` for downstream rendering.
- Adds indexes on `status`, `startsAt`, `endsAt`, and `slug` to support admin filtering, upcoming window lookups, and uniqueness
  enforcement.
- Migration is idempotent and compatible with PostgreSQL and SQLite (falls back to JSON when JSONB unavailable); down migration
  drops the table and associated indexes.

## `20241015123000-database-connection-audit.cjs`
- Creates `database_audit_events` table with typed lifecycle metadata (`eventType`, `reason`, `initiatedBy`) and JSON(B)
  `metadata` capturing connection pool telemetry alongside `recordedAt` for chronological reporting.
- Adds indexes on `eventType` and `recordedAt` so operations tooling can pivot audits by lifecycle stage and fetch the most
  recent shutdown/startup entries quickly.
- Down migration drops the audit table and indexes; export audit rows before rollback if compliance teams require historical
  evidence.

## `20240920090000-governance-consent-tables.cjs`
- Provisions `consent_policies`, `consent_policy_versions`, `user_consents`, and
  `consent_audit_events` tables with foreign keys, cascading delete rules for
  draft versions, and timezone-aware timestamps for legal evidence.
- Adds composite indexes (`policyId`, `versionNumber`, `status`) plus partial
  indexes on `active=true` policies and `revokedAt IS NULL` user consents to keep
  admin/API queries responsive. Enforces uniqueness on `userId` + `policyVersion`
  to prevent duplicate acceptances.
- Down migration drops the consent tables and associated indexes; retention teams
  should export audit trails before rolling back to comply with GDPR storage
  requirements.

## Operational Guidance
- Run `npx sequelize-cli db:migrate` after pulling the update. Admin dashboards and mobile clients rely on the table to return
  maintenance banners; absence will surface 500 responses on the new endpoints.
- Ensure migration runs before toggling maintenance features in production to avoid partially wired UI surfaces referencing empty
  datasets.
