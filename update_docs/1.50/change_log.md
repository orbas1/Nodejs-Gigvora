# Version 1.50 Update Change Log

## 06 Apr 2024
- Released `/api/domains/registry` and context/model drill-down endpoints that expose bounded-context metadata, index coverage, and service bindings for operators and tooling clients.
- Generated TypeScript client definitions in `shared-contracts/clients/typescript` via `npm run schemas:clients`, ensuring Node/React consumers ingest the same contracts as JSON schema clients.
- Added domain capability descriptors to auth, marketplace, and platform services so downstream diagnostics and documentation stay in sync with bounded contexts.

## 05 Apr 2024
- Partitioned `src/models/index.js` into logged domain contexts via a new registry, introducing auth/marketplace/platform domain services plus login audit models and feature-flag governance.
- Added JSON schema generation (`npm run schemas:sync`) that exports canonical auth, marketplace, and platform contracts to `shared-contracts/domain` for React and Flutter clients.
- Updated project workspace orchestration to consume the marketplace domain service, ensuring workspace status synchronises automatically with project state changes.

## 04 Apr 2024
- Decoupled the Node.js API server lifecycle from background workers, added graceful shutdown hooks, and published `/health/live` plus `/health/ready` endpoints with structured telemetry for operators and mobile clients.
- Hardened inbound request handling via correlation-aware logging, configurable payload limits, and environment-tuned rate limiting to align with security remediation goals.
- Delivered design specifications for maintenance-mode messaging, health telemetry widgets, and rate-limit disclosures across web and mobile experiences, updating associated design trackers and task plans.

---

# Historical Note — Version 1.10
- Removed all provider phone app artifacts (documentation, evaluations, tests, and UI assets) from the update package to reflect the retirement of the provider mobile experience.
