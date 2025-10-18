# Database Evaluation — Version 1.00

## Functionality
- Core migrations provision multiple persona tables but omit supporting indexes (e.g., on `email`, `userId`, and foreign keys), which will degrade lookup performance under real workloads.【F:gigvora-backend-nodejs/database/migrations/20240501000000-create-core-tables.cjs†L5-L90】
- The schema seeds two-factor tokens without expiration triggers or composite keys, inviting duplicate entries and stale codes that never clear automatically.【F:gigvora-backend-nodejs/database/migrations/20240501000000-create-core-tables.cjs†L79-L88】
- Database bootstrap scripts never verify charset or collation, so deployments can end up with inconsistent text encodings across environments.【F:gigvora-backend-nodejs/src/config/database.js†L8-L52】
- Persona tables permit multiple records per user because there are no unique constraints on `userId`, opening the door to conflicting profile snapshots for the same account.【F:gigvora-backend-nodejs/database/migrations/20240501000000-create-core-tables.cjs†L20-L66】
- Monetary fields like `hourlyRate` are declared as unconstrained `DECIMAL`, leaving precision/scale to database defaults and risking rounding surprises between MySQL and SQLite test runs.【F:gigvora-backend-nodejs/database/migrations/20240501000000-create-core-tables.cjs†L55-L70】
- Later migrations depend on Postgres-only JSONB fallbacks despite the Sequelize config locking production to MySQL, so critical platform settings tables will silently fall back to unindexed JSON blobs without the performance characteristics engineers expect from JSONB.【F:gigvora-backend-nodejs/database/migrations/20240915103000-platform-settings.cjs†L3-L31】【F:gigvora-backend-nodejs/sequelize.config.cjs†L5-L19】

## Usability
- Configuration relies on raw environment variables without validation, providing no guard rails for missing credentials or pool sizes and complicating setup for new engineers.【F:gigvora-backend-nodejs/src/config/database.js†L8-L52】
- Sequelize CLI configuration lacks a production profile, forcing operators to overload the development section when managing migrations across stages.【F:gigvora-backend-nodejs/sequelize.config.cjs†L5-L19】
- SQLite defaults for tests create files under `tmp/test.sqlite`, but cleanup is manual; repeated runs leave residue that clouds developer confidence in test isolation.【F:gigvora-backend-nodejs/src/config/database.js†L23-L44】
- Pool configuration pulls raw integers from the environment without sanity checks, so a typo such as `DB_POOL_MAX=ten` injects `NaN` values into Sequelize’s pool and fails only at runtime with opaque errors.【F:gigvora-backend-nodejs/src/config/database.js†L11-L37】
- There is no migration seeding strategy or example data set alongside the schema, leaving onboarding teams to craft fixtures manually before they can explore the domain tables.【F:gigvora-backend-nodejs/database/migrations/20240501000000-create-core-tables.cjs†L5-L88】

## Errors
- Passwords are stored in plain `STRING` columns with no hashing or length constraints, setting the stage for data breaches and validation errors when longer password hashes are introduced later.【F:gigvora-backend-nodejs/database/migrations/20240501000000-create-core-tables.cjs†L5-L83】
- Foreign keys are declared without `onUpdate` clauses, so schema migrations that rename IDs can silently fail or leave orphan references.【F:gigvora-backend-nodejs/database/migrations/20240501000000-create-core-tables.cjs†L21-L77】
- Database lifecycle hooks only attempt shutdown after startup failures; they do not roll back partially created schemas, leaving behind inconsistent states during crashed migrations.【F:gigvora-backend-nodejs/src/server.js†L51-L99】
- The migration batch runs outside of an explicit transaction, meaning a mid-execution failure can leave half-created tables without any automatic rollback to a consistent state.【F:gigvora-backend-nodejs/database/migrations/20240501000000-create-core-tables.cjs†L5-L88】
- Pool draining marks the dependency as “degraded” even after successful closure, so monitoring surfaces false positives that mask real outage signals.【F:gigvora-backend-nodejs/src/services/databaseLifecycleService.js†L96-L155】

## Integration
- Multiple services warm database connections during HTTP boot, yet there is no coordination with background worker pools that may contend for the same Sequelize instance, risking connection exhaustion.【F:gigvora-backend-nodejs/src/server.js†L35-L99】
- The React API base is mismatched with backend port defaults, so database-backed endpoints will appear offline to the SPA even when the database is healthy.【F:gigvora-backend-nodejs/src/server.js†L26-L88】【F:gigvora-frontend-reactjs/src/services/apiClient.js†L1-L83】
- No schema snapshot or migration checksum is exported for the Flutter app, preventing the mobile client from validating that its cached models align with server-side structures.【F:gigvora-flutter-phoneapp/packages/gigvora_foundation/lib/src/cache/offline_cache.dart†L21-L126】
- Runtime health metrics broadcast only vendor and latency, omitting transaction isolation, replication role, or pool saturation, so downstream services cannot make informed routing decisions when the database degrades.【F:gigvora-backend-nodejs/src/services/databaseLifecycleService.js†L1-L120】

## Security
- Lack of encryption-at-rest guidance and plaintext credential handling in configuration files conflicts with compliance expectations for PII-heavy tables like `users` and `profiles`.【F:gigvora-backend-nodejs/src/config/database.js†L8-L52】【F:gigvora-backend-nodejs/database/migrations/20240501000000-create-core-tables.cjs†L5-L83】
- Two-factor tokens are stored without hashing or automatic cleanup, enabling attackers who gain read access to reuse active codes.【F:gigvora-backend-nodejs/database/migrations/20240501000000-create-core-tables.cjs†L79-L88】
- SSL enforcement toggles merely set `rejectUnauthorized: false`, leaving production connections vulnerable to MITM when operators expect strict certificate checks.【F:gigvora-backend-nodejs/src/config/database.js†L37-L52】

## Alignment
- Migration filenames span auto-assign, trust, discovery, and launchpad domains, signalling a broad schema surface that needs coordinated governance before further expansion.【66f05a†L1-L10】
- Database lifecycle services emphasise readiness signals but not backup/restore automation, misaligning with enterprise resilience targets spelled out in platform strategy conversations.【F:gigvora-backend-nodejs/src/server.js†L35-L146】
- Test configuration defaults to in-memory SQLite while production expects MySQL, implying divergence in SQL dialect coverage and making automated QA unreliable for MySQL-specific behaviours.【F:gigvora-backend-nodejs/sequelize.config.cjs†L5-L19】

## Full Scan Notes
- The runtime dependency guard imports `ServiceUnavailableError` yet never throws it, signalling unfinished resilience work and leaving database callers without rich error types to distinguish transient outages from configuration drift.【F:gigvora-backend-nodejs/src/services/runtimeDependencyGuard.js†L1-L15】
- Domain-focused migrations such as the community management rollout create expansive transactional tables and enums without any paired reporting projections, guaranteeing that analytics queries will pound production schemas rather than isolated replicas.【F:gigvora-backend-nodejs/database/migrations/20240915094500-community-management.cjs†L3-L80】
