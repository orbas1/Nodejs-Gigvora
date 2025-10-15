# Database Change Log — Version 1.50 Update

## 27 Apr 2024
- Added consent governance tables: `consent_policies`, `consent_policy_versions`,
  `user_consents`, and `consent_audit_events`. Schema enforces sequential version
  numbers per policy, composite unique constraints on user/policy/version
  combinations, soft-delete toggles for drafts, and timezone-aware timestamps to
  support GDPR retention evidence.
- Applied partial indexes for active policy lookups and audit event pagination so
  admin exports remain performant even as consent histories grow. Down migration
  removes tables and indexes while preserving existing maintenance/runtime
  artefacts.

## 23 Apr 2024
- Created `domain_governance_reviews` table to persist governance audit outcomes,
  remediation notes, steward contacts, and next-review cadences for every bounded
  context. Indexed `contextName`, `reviewStatus`, and `nextReviewDueAt` to power
  dashboard filters and overdue review alerts.
- Seeded baseline governance reviews so staging/test environments surface
  realistic remediation backlogs and audit history when the new governance
  endpoints are consumed by dashboards or policy automation.

## 13 Apr 2024
- Added `database_audit_events` table capturing lifecycle events (`startup`, `shutdown_initiated`, `shutdown_failed`) with initiator, reason, and JSON metadata storing pool telemetry for compliance review.

## 10 Apr 2024
- Created `runtime_announcements` table storing maintenance messaging with indexed `status`, `startsAt`, and `endsAt` columns so
  scheduled windows can be queried efficiently for public and admin endpoints.
- Persisted `audiences` and `channels` as JSON/JSONB arrays (dialect aware) plus `metadata` document for arbitrary key/value
  pairs, enabling downstream services to render targeted copy without schema churn.
- Added slug uniqueness constraint (`slug` unique index) to prevent duplicate announcements and keep cache keys deterministic.

## Historical Notes
- Earlier Version 1.50 entries covered lifecycle and domain registry changes; see prior weeks for detail.
