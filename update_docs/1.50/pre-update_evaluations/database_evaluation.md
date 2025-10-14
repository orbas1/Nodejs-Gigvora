# Database Evaluation – Version 1.50

## Functionality
- **Schema coverage lags behind domain complexity.** `database/migrations/20240501001000-create-marketplace-tables.cjs` provisions only minimal columns for feeds, jobs, gigs, and projects. Meanwhile `src/models/index.js` defines hundreds of attributes, enums, and relations that never migrate to the database, so production schemas cannot satisfy model expectations.
- **Enum explosion hinders maintainability.** Massive enum arrays in `src/models/index.js` and `src/models/constants/index.js` encode business logic inline. Without lookup tables or reference data, analytics, reporting, and localization layers cannot translate statuses or evolve workflows without code deployments.
- **Index strategy is insufficient.** Migrations add few indexes beyond foreign keys, while models query heavily filtered columns (e.g., search filters on `geoCountry`, `geoRegion`, `employmentType`). Missing composite indexes will lead to sequential scans and unbounded query times as data grows.
- **Referential integrity is inconsistent.** Many tables (e.g., `gigs`, `projects`, `experience_launchpads`) lack foreign keys to users or organizations even though models expect associations. Deleting a parent leaves orphaned rows with no cascading cleanup.
- **Multi-tenant and audit requirements are unmet.** There are no tenant keys, history tables, or soft-delete columns. High-risk tables (payments, compliance) cannot satisfy regulatory traceability or retention obligations.
- **Materialised views and denormalised stores are absent.** Analytics-heavy routes in `src/controllers/analyticsController.js` expect pre-aggregated metrics, yet the database ships only raw transactional tables. Without summary tables or warehouse extracts, SLAs for dashboards cannot be met.

## Usability
- **Migration story is opaque.** The project mixes old `.sql` scripts (`database/install.sql`) with Sequelize migrations and relies on `sequelize.sync({ force: true })` during tests. There is no canonical runbook for creating, reverting, or seeding databases across environments.
- **Local developer workflow is fragile.** Default dialects pivot between MySQL (prod) and SQLite (tests) without seed data or fixtures. Engineers must craft bespoke seeders to test features, slowing iteration and increasing inconsistency.
- **Naming conventions vary.** Tables oscillate between snake_case and camelCase, and enum values blend hyphen and underscore separators. Absent naming standards complicate ORM usage and external integrations.
- **Large monolithic model definitions impede comprehension.** Bundling every model into `src/models/index.js` makes it hard to locate specific entities or understand dependencies. New contributors struggle to reason about schema scope or required migrations.
- **Lack of visualization/documentation.** There is no ERD, data dictionary, or schema linting. Teams guess relationships, leading to incorrect joins and reporting errors.
- **Configuration is scattered.** `sequelize.config.cjs`, `.sequelizerc`, and inline environment defaults disagree on database names, ports, and dialects. Engineers must inspect multiple files to understand how migrations run in each environment.

## Errors & Stability
- **Migrations are not idempotent.** ENUM-based migrations (`ENUM('public','connections')`) lack drop safeguards, causing production deploys to fail when enums change. No automated drift detection exists.
- **Sequelize sync masks failures.** Tests rely on `sequelize.sync({ force: true })`, which silently creates missing columns even when migrations are outdated. Production deployments may succeed while tests mask schema mismatches.
- **Transaction usage is sparse.** Critical flows (bulk inserts, payouts) issue multiple statements without wrapping them in transactions. Partial failures can corrupt state or leave orphaned records.
- **No backup/restore automation.** There is no documented backup cadence, snapshot tooling, or restore testing. Disaster recovery readiness is unverified.
- **Lack of partitioning strategy.** High-volume tables (activity feeds, notifications) will grow indefinitely without partitioning or archival policies, leading to vacuum and retention issues.
- **Connection pooling is unmanaged.** Sequelize initialisation in `src/models/index.js` defers to environment defaults; there are no pool size limits, timeouts, or circuit breakers. Under load, pooled connections will saturate the database and starve background workers.

## Integration
- **Search indexing is detached from data lifecycle.** `searchIndexService.js` rehydrates Meilisearch independently of DB changes. Without triggers or CDC, indexes drift from source-of-truth data and require expensive full re-syncs.
- **Analytics pipelines have no foothold.** There are no change streams, CDC connectors, or event outboxes. BI integrations promised to partners cannot be built without re-architecting persistence.
- **Compliance integrations are absent.** There is no data retention policy, encryption-at-rest management, or consent tracking tables to interface with legal/compliance tooling.
- **Environment promotion lacks structure.** No schema versioning strategy coordinates dev/stage/prod. Manual SQL patches risk drift between environments and make rollback nearly impossible.
- **Cache/queue coordination is missing.** Models emit no events when data mutates, so caches (Redis), queues, or downstream processors cannot stay in sync, causing stale experiences.
- **External warehouse exports are fictional.** Controllers refer to Snowflake/BigQuery pushes, yet there are no staging tables or export jobs under `database/` or `scripts/`. Integration teams cannot validate feeds promised in sales collateral.

## Security
- **Sensitive data lacks field-level controls.** Personally identifiable information (PII) and secrets are stored in plaintext columns without encryption, hashing, or masking. Column-level security is absent.
- **Access auditing is unavailable.** Tables include no `createdBy`/`updatedBy` metadata, no audit trails, and no row-level history. Investigations into misuse or data leakage would be impossible.
- **Data retention and deletion are unmanaged.** There are no TTL indexes, soft-delete flags, or purge jobs. Compliance obligations (GDPR right to be forgotten) cannot be honoured reliably.
- **Secrets stored in migrations/code.** Sample data and migrations hard-code admin accounts and tokens, exposing credentials if ever run against non-sandbox databases.
- **Boundary security is undefined.** No row-level security, schema separation, or tenant isolation exists. All data sits in a single public schema, increasing blast radius for breaches.
- **PII redaction is absent in exports.** CSV/export helpers leak full phone numbers, addresses, and compliance status fields without masking. When BI exports run, they will violate privacy policies immediately.

## Alignment
- **Enterprise analytics promises are unsupported.** Marketing commitments for predictive analytics and compliance dashboards require dimensional models, audit logs, and warehousing pipelines absent from the schema.
- **Scalability goals conflict with implementation.** A single monolithic database with no partitioning, read replicas, or sharding strategies cannot serve the multi-tenant workload described in product briefs.
- **Operational readiness is lacking.** Without runbooks, backups, or observability, the database cannot meet enterprise SLAs or compliance checkpoints.
- **Data governance is immature.** There is no metadata catalogue, stewardship process, or lineage tracking, contradicting claims of enterprise governance.
- **Cross-surface parity is impossible.** React and Flutter teams rely on enumerations in `src/models/index.js`, but the database lacks canonical lookup tables. Until parity exists, UI features will diverge from persisted truth.
