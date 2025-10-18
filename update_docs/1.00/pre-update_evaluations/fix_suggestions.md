# Fix Suggestions

1. **Backend Hardening and Governance**
   1.1 Split router registration into isolated modules, add automated import smoke tests, and remove duplicate exports so Express boot fails fast when a route is misconfigured.
   1.2 Collapse worker bootstrap into a single orchestrator that awaits each subsystem, records structured failure reasons, and blocks readiness until queues, schedulers, and dependency guards all pass.
   1.3 Replace ad hoc environment lookups with schema validation (e.g., `zod` or `envsafe`), provide defaults for development, and surface configuration errors through structured logs and `/health` payloads.
   1.4 Secure observability surfaces: require authentication for `/health/metrics`, generate correlation IDs server-side, and tighten Helmet CSP to remove `unsafe-inline` while shipping an allowlist for vetted assets.
   1.5 Refactor runtime dependency guard to a single feature toggle with explicit modes (enforced, monitor, disabled), and publish runbooks that explain how to interpret degraded states.
   1.6 Extend shutdown paths to confirm that background workers, database pools, and cron schedulers drained successfully, emitting metrics for failed teardown attempts.

2. **Database Reliability and Security**
   2.1 Backfill unique constraints, indexes, and composite keys for personas, verification tokens, linkage tables, and monetary fields; accompany changes with data migration scripts to deduplicate existing records.
   2.2 Wrap migrations in explicit transactions, add automated rollback tests, and enforce charset/collation/SSL requirements in bootstrap scripts so deployments fail early when prerequisites are missing.
   2.3 Hash passwords and OTP codes at rest, document retention/archival policies for audit logs, and introduce scheduled cleanup jobs with monitoring to verify expiry enforcement.
   2.4 Publish a production-ready Sequelize configuration profile with opinionated pool limits, SSL enforcement, and per-environment credentials, alongside onboarding documentation for operators.
   2.5 Generate schema snapshots (SQL dumps and contract artifacts) after each migration and distribute them to frontend/mobile teams to keep caches and models aligned.

3. **Dependency Hygiene and Tooling**
   3.1 Consolidate HTTP stacks by adopting native `fetch` or a single HTTP client, remove redundant logging middleware, and reconcile duplicated packages (`date-fns`, `axios`) through workspace hoists or resolution pins.
   3.2 Break heavyweight SDKs (Agora, Mapbox) behind feature-flagged dynamic imports or optional Flutter plugins, documenting licensing and configuration requirements before enabling them per environment.
   3.3 Publish internal Flutter design system and foundation packages to a private registry (or git tags) and replace path dependencies with semver releases so partners can consume them without the full monorepo.
   3.4 Enforce dependency governance via automated audits: add a monorepo script (Nx, Lage, or custom) that checks for duplicate ranges, outdated locks, and missing peer dependencies across workspaces.
   3.5 Establish secure storage primitives by default—ship `flutter_secure_storage` and HTTP-only cookie strategies as first-class dependencies—so clients no longer rely on insecure local storage.

4. **Frontend Remediation**
   4.1 Refactor routing into role-scoped route objects consumed by a single `<Routes>` tree with lazy-loaded pages and suspense fallbacks; add a 404 boundary and authenticated guards that clear stale state before redirecting.
   4.2 Centralise session state in a dedicated store (e.g., React Query, Zustand) that handles JSON parse failures, token refresh, and multi-tab sync while surfacing actionable error messages to users.
   4.3 Harden security by moving tokens to secure cookies or in-memory stores, regenerating `x-roles` headers from server-issued claims, and encapsulating DOM sanitisation in a shared utility with regression tests.
   4.4 Align API configuration with backend defaults by introducing runtime discovery (well-known endpoint or `.env` prompt), validating port mismatches during development, and documenting credential expectations.
   4.5 Implement bundle-splitting via Vite Rollup options, defer loading of admin dashboards until permissions are confirmed, and remove unused SDK imports from the default entry path.

5. **Mobile App Stabilisation**
   5.1 Convert bootstrap providers to explicit startup coordinators that run once, emit readiness signals, and parallelise compatible tasks; provide loading UIs rather than blank screens while bootstrapping.
   5.2 Differentiate transient failures from token expiry, introduce exponential backoff and retry policies, and surface inline toasts or modals explaining when the app is offline versus when reauthentication is required.
   5.3 Migrate token persistence to encrypted storage (platform keychain/Keystore), bind tokens to device identifiers, and add integrity checks before reusing cached credentials.
   5.4 Refactor service locator usage to support scoped overrides and teardown hooks, enabling hot restarts, widget tests, and background isolates without runtime crashes.
   5.5 Harmonise membership headers with the web client, sourcing signed claims from the backend, and document how downstream services interpret identity headers.
   5.6 Add feature-flag toggles so analytics, push notifications, and advanced providers can be disabled for MVP partners or during incident response without code changes.

6. **Cross-Cutting Governance and Alignment**
   6.1 Establish a shared contract pipeline (OpenAPI/JSON Schema) that feeds backend, web, and mobile clients, replacing ad hoc snapshots and ensuring migrations fail when contracts are out of sync.
   6.2 Create runbooks and dashboards that correlate dependency guard status, worker health, and database pool metrics, and require these to pass before declaring releases production-ready.
   6.3 Standardise environment defaults (ports, credential strategies, header names) across repos, including preflight lint rules that flag mismatches during CI.
   6.4 Introduce progressive delivery tooling—feature flag services, staged rollouts, and licensing enforcement—so optional enterprise integrations ship with configuration, compliance notes, and fallback experiences.
   6.5 Formalise a monorepo release process (versioning, changelog automation, melos or Nx tasks) that coordinates dependency updates, schema migrations, and client releases under a single governance board.
