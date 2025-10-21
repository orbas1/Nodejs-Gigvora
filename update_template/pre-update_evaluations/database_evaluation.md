# Pre-Update Evaluation — Database

## Scope
Assessment covered relational schemas for RBAC policies, credential verification artifacts, serviceman mission data, and user trust metrics. Both transactional and analytics workloads were reviewed.

## Current State
- Core schemas normalised; referential integrity enforced via foreign keys and cascading deletes.
- Change data capture (CDC) streaming to Snowflake functioning with <30 second lag.
- Partitioning strategy on mission events table keeps query latency under 120ms for 7-day window.

## Required Changes
| Entity | Change | Rationale | Owner | Status |
| --- | --- | --- | --- | --- |
| `role_policy_snapshots` | Add `diff_hash` and `environment_tag` columns. | Support new policy diff viewer & multi-environment governance. | Data Platform | In Development |
| `provider_credentials` | Introduce `document_fingerprint` & `verification_method`. | Enable AI validation traceability and manual override audit. | Marketplace Data | Completed |
| `mission_assignments` | Add `sla_breach_notified_at`. | Track notifications for compliance audits. | Field Ops Engineering | Scheduled Sprint 2 |
| `user_trust_scores` | Create materialised view combining reviews, verifications, SLA metrics. | Power trust-focused profile components without heavy joins. | Analytics | Completed |

## Data Quality
- Automated dbt tests expanded to cover uniqueness and accepted values for new columns.
- Backfill scripts validated in staging with row-level reconciliation reports.
- Sensitive data encrypted at rest using AES-256; keys rotated per policy.

## Risk Assessment
- Migration downtime mitigated via online schema change tooling (gh-ost). Rollback strategy documented.
- Data retention policies reviewed; credential documents adhere to 3-year retention limit with auto purge.
- Potential risk: CDC pipeline adjustments required for new columns. Mitigation: update schemas in Airbyte connectors prior to release.

## Approval
Database changes approved pending completion of mission assignment column migration by 29 Nov and CDC connector update sign-off.
