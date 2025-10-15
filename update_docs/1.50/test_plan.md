# Version 1.50 Test Plan

## Scope
- Validate lifecycle orchestration, health telemetry, and security hardening introduced in Task 1 across backend, web, and mobile surfaces.
- Confirm regression coverage for high-risk flows identified in Version 1.50 planning, including finance, consent, marketplace, and maintenance-mode workflows.
- Exercise new `/health/live` and `/health/ready` endpoints to ensure readiness probes emit `503` during dependency failures and graceful shutdown sequences.

## Backend Testing Strategy
- Unit tests for lifecycle helpers, health service, worker manager, and existing services impacted by the refactor.
- Service-level tests that simulate Stripe/Escrow outages by toggling `paymentsCore`/`complianceProviders` health, asserting finance overviews and wallet ledger writes return 503 with structured dependency metadata.
- Integration tests covering `/health/*` endpoints, rate limiting boundaries, and correlation ID propagation.
- Smoke tests validating start/stop sequences, worker supervisor state changes, and Sequelize connectivity fallbacks.
- Security tests confirming payload size enforcement, abuse throttling, and structured logging redaction.
- Domain service tests validating AuthDomainService password hashing, login audit creation, feature flag evaluation, and MarketplaceDomainService workspace synchronisation.
- Domain introspection tests verifying context/service bindings, schema serialisation, and association exports align with `/api/domains` payloads.
- Governance service tests validating `DomainIntrospectionService` aggregates
  governance metadata and persisted reviews, ensuring `/api/domains/governance`
  returns remediation counts, steward contacts, and default cadences for contexts
  without historical data. Supertest coverage now exercises the HTTP endpoints
  to confirm routing, error handling, and merged review payloads.

## Frontend & Admin Testing Strategy
- Add dashboard integration tests to confirm health telemetry widgets render realtime data and handle degraded states.
- Perform accessibility regression for maintenance banners, ensuring ARIA live regions and focus management behave across themes.
- Validate rate-limit feedback appears in admin interfaces without leaking implementation details.
- Add governance dashboard tests (React Testing Library) covering loading,
  remediation, empty, and error states once component test harness stabilises.

## Mobile Testing Strategy
- Update user/provider apps to poll `/health/ready`; add integration tests for session bootstrap fallback messaging.
- Execute offline/maintenance simulations to verify banners, retry timers, and localisation assets function correctly.
- Add Flutter widget tests for `DomainGovernanceSummaryCard` to guarantee
  loading, error, and remediation-heavy states render with production styling
  and localisation. Tests authored locally; CI execution remains blocked until
  the Flutter SDK lands in the shared runners.

## Tooling & Automation
- Extend CI pipelines to call the new health endpoints before and after integration tests, blocking deployments on readiness degradation.
- Capture structured logs during tests and assert the presence of `requestId` correlation metadata for traceability.
- Schedule load tests to validate rate-limiter thresholds and worker supervisor resilience under burst traffic.
- Add a CI step running `npm run schemas:sync` and diffing `shared-contracts/domain` artifacts to ensure schema contracts stay version-controlled.
- Run `npm run schemas:clients` alongside the schema sync to regenerate TypeScript definitions and block merges on drift.
