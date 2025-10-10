# Data Governance & Retention Policy

Gigvora operates in regulated markets, requiring rigorous handling of personal data, financial workflows, and communications. This policy maps the Version 1.50 persistence layer to operational controls implemented in code and automation.

## Access Controls
- **Role-based guards:** Service methods enforce business roles (owner, admin, staff) via transactional checks before mutating workspace membership or invitations.【F:gigvora-backend-nodejs/src/services/providerWorkspaceService.js†L241-L320】
- **Audit trails:** Metadata columns such as `lastStatusReason`, `archivedBy`, and `lastUpdatedBy` persist actor IDs for every application state transition, ensuring traceable hiring decisions.【F:gigvora-backend-nodejs/src/services/applicationService.js†L221-L307】
- **Cache eviction discipline:** In-memory caches flush on every mutation, preventing stale or unauthorised data from being served after privilege changes.【F:gigvora-backend-nodejs/src/services/messagingService.js†L90-L117】【F:gigvora-backend-nodejs/src/services/notificationService.js†L34-L47】

## Retention Windows
| Dataset | Retention | Enforcement |
| --- | --- | --- |
| Applications & Reviews | 7 years post engagement for compliance. | Archival metadata captured by `archiveApplication`; scheduled jobs export closed records for cold storage (to be executed via ops automation). |
| Messaging Threads | 24 months of history; system messages pruned after 90 days. | `Message` model uses `paranoid` soft-deletes and scheduled purge tasks filter by `deletedAt`. |
| Notifications | 180 days for delivered events, 30 days for pending/dismissed. | `queueNotification` populates `expiresAt`; background workers must purge expired rows nightly. |
| Analytics Events | 25 months for trend analysis. | Aggregated into `analytics_daily_rollups`; raw events older than 25 months are anonymised then truncated. |

## Data Quality & Masking
- **Sanitised public objects:** Model helper methods strip internal keys before serialisation, ensuring UI layers and public APIs expose only approved fields.【F:gigvora-backend-nodejs/src/models/index.js†L120-L186】【F:gigvora-backend-nodejs/src/services/messagingService.js†L35-L84】
- **Sensitive attachment handling:** Upload metadata enforces MIME validation and size limits before persistence; storage keys always reference signed URL buckets controlled by infrastructure policies.【F:gigvora-backend-nodejs/src/services/messagingService.js†L217-L238】【F:gigvora-backend-nodejs/src/services/applicationService.js†L78-L109】
- **Seed data hygiene:** Demo data uses non-routable email domains and bcrypt-hashed passwords, preventing accidental outbound communication from test environments.【F:gigvora-backend-nodejs/database/seeders/20240501010000-demo-data.cjs†L6-L160】

## Monitoring & Testing
- Integration tests simulate end-to-end workflows for applications, messaging, notifications, and provider workspaces, forming part of the release gate in CI.【F:gigvora-backend-nodejs/tests/applicationService.test.js†L1-L84】【F:gigvora-backend-nodejs/tests/messagingService.test.js†L1-L69】【F:gigvora-backend-nodejs/tests/notificationService.test.js†L1-L58】【F:gigvora-backend-nodejs/tests/providerWorkspaceService.test.js†L1-L66】
- CI must surface coverage artefacts and alert on regressions in schema or governance logic; the new Jest harness executes with SQLite to validate migrations and relationships without requiring dedicated MySQL infrastructure.

## Operational Responsibilities
| Role | Responsibilities |
| --- | --- |
| Engineering | Maintain migrations, tests, and cache policies; ensure new features respect sanitisation helpers and metadata audits. |
| Compliance | Review retention exports quarterly, confirm quiet-hour enforcement and notification preference handling. |
| Data & Analytics | Monitor rollup integrity, anonymise aged events, and validate instrumentation coverage against the taxonomy. |
| Support & Success | Use provider contact notes and notification audit history for incident resolution; escalate anomalies via incident response playbooks. |

This policy must be revisited every release candidate to incorporate new entities, regulatory updates, and customer commitments.
